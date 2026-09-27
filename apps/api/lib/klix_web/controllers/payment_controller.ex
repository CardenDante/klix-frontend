defmodule KlixWeb.PaymentController do
  use KlixWeb, :controller
  require Logger

  alias Klix.{Orders, Payments}
  alias KlixWeb.JSON

  def initiate_mpesa(conn, %{"transaction_id" => id} = params) do
    with {:ok, order} <- fetch_order(conn, id),
         {:ok, order} <- Payments.initiate_mpesa(order, params["phone_number"]) do
      ok(conn, JSON.order(order), "Check your phone and enter your M-Pesa PIN")
    end
  end

  def initiate_mpesa(_conn, _params), do: {:error, {:validation, "transaction_id is required"}}

  @doc """
  Current state of a transaction. Tickets are included once it completes.
  `force_check=true` asks Safaricom directly if we're still waiting.
  """
  def show(conn, %{"transaction_id" => id} = params) do
    with {:ok, order} <- fetch_order(conn, id) do
      order =
        if params["force_check"] in ["true", "1"] and throttle_check(order.id) == :ok do
          {:ok, order} = Payments.query_status(order)
          order
        else
          order
        end

      ok(conn, order_payload(order))
    end
  end

  def query_status(conn, %{"transaction_id" => id}) do
    with {:ok, order} <- fetch_order(conn, id) do
      order =
        case throttle_check(order.id) do
          :ok ->
            {:ok, order} = Payments.query_status(order)
            order

          _ ->
            order
        end

      ok(conn, order_payload(order))
    end
  end

  def mpesa_callback(conn, %{"token" => token} = params) do
    expected = Klix.Payments.Mpesa.config()[:callback_token]

    if expected && Plug.Crypto.secure_compare(token, expected) do
      Payments.handle_stk_callback(Map.delete(params, "token"))
    else
      Logger.warning("Rejected M-Pesa callback with a bad token")
    end

    # Safaricom only needs to know we received it.
    json(conn, %{"ResultCode" => 0, "ResultDesc" => "Accepted"})
  end

  defp fetch_order(conn, id) do
    case Orders.get_order(id) do
      nil ->
        {:error, {:not_found, "Transaction not found"}}

      order ->
        if Orders.can_view?(order, current_user(conn)),
          do: {:ok, order},
          else: {:error, {:not_found, "Transaction not found"}}
    end
  end

  defp order_payload(order) do
    order = Klix.Repo.preload(order, [event: [], tickets: [:ticket_type, :event]], force: true)
    payload = JSON.order(order)

    if order.status == "completed",
      do: payload,
      else: Map.delete(payload, :tickets)
  end

  # One provider query per order every 5 seconds, however often clients poll.
  defp throttle_check(order_id), do: Klix.RateLimiter.hit({:stk_query, order_id}, 1, 5)
end
