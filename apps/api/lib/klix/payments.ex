defmodule Klix.Payments do
  @moduledoc "Starting M-Pesa payments for orders and applying their outcomes."

  import Ecto.Query
  require Logger

  alias Klix.Repo
  alias Klix.Orders
  alias Klix.Orders.Order
  alias Klix.Accounts.Organizer
  alias Klix.Payments.{Mpesa, MpesaCredential, PaymentEvent}
  alias Klix.Payments.Workers.ReconcilePayment

  # Customers get this long to answer the prompt on their phone.
  @prompt_window_seconds 180

  @doc "Sends an STK push to the customer's phone for a pending order."
  def initiate_mpesa(%Order{} = order, phone \\ nil) do
    phone = Klix.Phone.normalize(phone) || order.mpesa_phone || order.attendee_phone
    now = DateTime.utc_now()

    cond do
      order.status != "pending" ->
        {:error, {:validation, "This order is #{order.status}"}}

      DateTime.compare(order.expires_at, now) != :gt ->
        {:error, {:validation, "This checkout has expired, please start again"}}

      not Klix.Phone.valid?(phone) ->
        {:error, {:validation, "A valid M-Pesa phone number is required"}}

      true ->
        request = %{
          phone: phone,
          # M-Pesa only takes whole shillings.
          amount: order.amount |> Decimal.round(0, :ceiling) |> Decimal.to_integer(),
          reference: "KLIX" <> String.slice(order.id, 0, 8),
          description: "Klix tickets"
        }

        {account, config} = payment_config(order)

        case Mpesa.stk_push(request, config) do
          {:ok, %{checkout_request_id: checkout_id, merchant_request_id: merchant_id}} ->
            order = Orders.extend_expiry(order, @prompt_window_seconds)

            {:ok, order} =
              order
              |> Ecto.Changeset.change(
                mpesa_phone: phone,
                mpesa_checkout_request_id: checkout_id,
                mpesa_merchant_request_id: merchant_id,
                payment_account: account,
                mpesa_shortcode: config[:party_b] || config[:shortcode]
              )
              |> Repo.update()

            log_event(order.id, "stk_push", %{request: request, checkout_request_id: checkout_id})

            # If the callback never arrives we still find out what happened.
            %{order_id: order.id}
            |> ReconcilePayment.new(schedule_in: 75)
            |> Oban.insert()

            {:ok, order}

          {:error, {:rejected, message}} ->
            {:error, {:payment_provider, message}}

          {:error, _reason} ->
            {:error, {:payment_provider, "M-Pesa is not reachable right now, please try again"}}
        end
    end
  end

  @doc """
  Applies an STK callback from Safaricom. Always returns `:ok` so the
  provider gets a success response; problems are logged and left for the
  reconciliation job.
  """
  def handle_stk_callback(%{"Body" => %{"stkCallback" => callback}} = payload) do
    checkout_id = callback["CheckoutRequestID"]
    order = checkout_id && Repo.one(from o in Order, where: o.mpesa_checkout_request_id == ^checkout_id)

    log_event(order && order.id, "stk_callback", payload)

    case {order, Mpesa.classify_result_code(callback["ResultCode"])} do
      {nil, _} ->
        Logger.warning("M-Pesa callback for unknown checkout #{inspect(checkout_id)}")

      {order, :completed} ->
        meta = callback_metadata(callback)
        paid = meta["Amount"]

        if paid && Decimal.lt?(decimal(paid), Decimal.round(order.amount, 0, :ceiling)) do
          Logger.error("M-Pesa underpayment on order #{order.id}: #{inspect(paid)}", order_id: order.id)
          Orders.release_order(order.id, "failed", "Amount paid did not match the order total")
        else
          Orders.complete_order(order.id, %{mpesa_receipt: meta["MpesaReceiptNumber"]})
        end

      {order, :cancelled} ->
        Orders.release_order(order.id, "cancelled", callback["ResultDesc"])

      {order, :failed} ->
        Orders.release_order(order.id, "failed", callback["ResultDesc"])
    end

    :ok
  end

  def handle_stk_callback(payload) do
    log_event(nil, "stk_callback_malformed", payload)
    :ok
  end

  defp callback_metadata(callback) do
    callback
    |> get_in(["CallbackMetadata", "Item"])
    |> List.wrap()
    |> Map.new(fn item -> {item["Name"], item["Value"]} end)
  end

  defp decimal(value) when is_integer(value), do: Decimal.new(value)
  defp decimal(value) when is_float(value), do: Decimal.from_float(value)
  defp decimal(value) when is_binary(value), do: Decimal.new(value)

  @doc """
  Asks Safaricom for the result of an order's STK push and applies it.
  Returns the (possibly updated) order.
  """
  def query_status(%Order{status: "pending", mpesa_checkout_request_id: checkout_id} = order)
      when is_binary(checkout_id) do
    result = Mpesa.stk_query(checkout_id, config_for_account(order))
    log_event(order.id, "stk_query", %{result: inspect(result)})

    case result do
      {:ok, :completed, _} -> Orders.complete_order(order.id)
      {:ok, :cancelled, desc} -> Orders.release_order(order.id, "cancelled", desc)
      {:ok, :failed, desc} -> Orders.release_order(order.id, "failed", desc)
      {:ok, :pending} -> {:ok, order}
      {:error, _} -> {:ok, order}
    end
  end

  def query_status(%Order{} = order), do: {:ok, order}

  ## Which M-Pesa account an order is paid into

  # Organizers with verified credentials of their own are paid directly.
  defp payment_config(%Order{event_id: event_id}) do
    case active_credential_for_event(event_id) do
      %MpesaCredential{} = credential -> {"organizer", MpesaCredential.to_config(credential, Mpesa.config())}
      nil -> {"platform", Mpesa.config()}
    end
  end

  # Status queries must use the same app the push went through.
  defp config_for_account(%Order{payment_account: "organizer", event_id: event_id}) do
    case active_credential_for_event(event_id) || credential_for_event(event_id) do
      %MpesaCredential{} = credential -> MpesaCredential.to_config(credential, Mpesa.config())
      nil -> Mpesa.config()
    end
  end

  defp config_for_account(_order), do: Mpesa.config()

  defp active_credential_for_event(event_id) do
    Repo.one(
      from c in MpesaCredential,
        join: e in Klix.Events.Event,
        on: e.organizer_id == c.organizer_id,
        where: e.id == ^event_id and c.is_active
    )
  end

  defp credential_for_event(event_id) do
    Repo.one(
      from c in MpesaCredential,
        join: e in Klix.Events.Event,
        on: e.organizer_id == c.organizer_id,
        where: e.id == ^event_id
    )
  end

  ## Organizer credentials

  def get_credential(%Organizer{id: organizer_id}), do: Repo.get_by(MpesaCredential, organizer_id: organizer_id)

  @doc "Saves an organizer's Daraja credentials. They stay inactive until verified."
  def save_credential(%Organizer{} = organizer, attrs) do
    (get_credential(organizer) || %MpesaCredential{organizer_id: organizer.id})
    |> MpesaCredential.changeset(attrs)
    |> Repo.insert_or_update()
  end

  @doc "Authenticates with Safaricom using the saved credentials and activates them on success."
  def verify_credential(%MpesaCredential{} = credential) do
    case Mpesa.verify_credentials(MpesaCredential.to_config(credential, Mpesa.config())) do
      :ok ->
        credential
        |> Ecto.Changeset.change(is_active: true, verified_at: DateTime.utc_now())
        |> Repo.update()

      {:error, _} ->
        {:error, {:validation, "Safaricom rejected these credentials. Check the consumer key and secret."}}
    end
  end

  def deactivate_credential(%MpesaCredential{} = credential) do
    credential |> Ecto.Changeset.change(is_active: false) |> Repo.update()
  end

  def delete_credential(%MpesaCredential{} = credential), do: Repo.delete(credential)

  defp log_event(order_id, kind, payload) do
    Repo.insert(%PaymentEvent{order_id: order_id, kind: kind, payload: sanitize(payload)})
  rescue
    error -> Logger.error("Could not log payment event: #{Exception.message(error)}")
  end

  defp sanitize(payload) when is_map(payload), do: payload |> Jason.encode!() |> Jason.decode!()
  defp sanitize(payload), do: %{value: inspect(payload)}
end
