defmodule Klix.Orders do
  @moduledoc """
  Checkout: reserving inventory, creating orders and tickets, completing
  paid orders and releasing reservations that lapse.

  ## Why this holds up under load

    * Reserving is one conditional `UPDATE ... WHERE available >= n` per
      ticket type. Postgres serializes writers on that row, so two buyers can
      never both get the last ticket, and nobody holds a lock while talking
      to M-Pesa. A CHECK constraint on `ticket_types` backs this up.
    * Ticket types are always locked in id order, so multi-item carts can't
      deadlock each other.
    * Expiry is a durable Oban job plus a per-minute sweep, so reservations
      come back even if a node dies mid-checkout.
    * Completing an order locks the order row and is idempotent: duplicate
      M-Pesa callbacks, the reconciliation poller and a manual status check
      can all race safely.
  """

  import Ecto.Query
  require Logger

  alias Ecto.Multi
  alias Klix.Repo
  alias Klix.Accounts.User
  alias Klix.Events
  alias Klix.Events.{Event, TicketType}
  alias Klix.Orders.{Order, OrderItem, Ticket}
  alias Klix.Orders.Workers.ExpireOrder
  alias Klix.Loyalty
  alias Klix.Promoters

  @max_line_items 10

  ## Reading

  def get_order(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Repo.get(Order, id)
      :error -> nil
    end
  end

  def get_order_with_tickets(id) do
    case get_order(id) do
      nil -> nil
      order -> Repo.preload(order, tickets: [:ticket_type, :event], items: [], event: [])
    end
  end

  @doc """
  Guest orders are reachable by their (unguessable) id. Orders placed while
  signed in are only visible to that user, admins and the event's organizer.
  """
  def can_view?(%Order{user_id: nil}, _user), do: true
  def can_view?(%Order{user_id: id}, %User{id: id}), do: true
  def can_view?(%Order{}, %User{role: "admin"}), do: true

  def can_view?(%Order{event_id: event_id}, %User{} = user) do
    case Events.get_event(event_id) do
      nil -> false
      event -> Events.can_manage?(user, event)
    end
  end

  def can_view?(_, _), do: false

  ## Checkout

  @doc """
  Reserves tickets and creates a pending order.

  `params` follows the `/tickets/purchase-cart` body: `items` (list of
  `%{"ticket_type_id", "quantity"}`), `attendee_name`, `attendee_email`,
  `attendee_phone`, an optional `promoter_code`, and for signed-in users
  `use_loyalty_credits` (with an optional `loyalty_credits_amount`).
  """
  def create_order(user, params) do
    now = DateTime.utc_now()

    with {:ok, attendee} <- validate_attendee(user, params),
         {:ok, items} <- normalize_items(params["items"]),
         {:ok, ticket_types} <- load_ticket_types(items),
         {:ok, event} <- validate_event(ticket_types, now),
         :ok <- validate_line_items(items, ticket_types, now),
         {:ok, promoter_code} <- resolve_promoter_code(params["promoter_code"], event) do
      discount_pct = Promoters.discount_percentage(promoter_code)
      expires_at = DateTime.add(now, reservation_ttl(), :second)

      Multi.new()
      |> Multi.run(:reserved, fn repo, _ -> reserve_all(repo, items, now) end)
      |> Multi.run(:priced, fn repo, %{reserved: reserved} ->
        insert_order(repo, user, event, attendee, reserved, promoter_code, discount_pct, expires_at, now)
      end)
      |> Multi.run(:order, fn repo, %{priced: order} -> apply_loyalty(repo, user, order, params) end)
      |> Oban.insert(:expire_job, fn %{order: order} ->
        ExpireOrder.new(%{order_id: order.id}, scheduled_at: expires_at)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{order: order}} ->
          Events.invalidate(event)
          order = Repo.preload(order, tickets: [:ticket_type, :event])
          if Decimal.eq?(order.amount, 0), do: complete_free_order(order), else: {:ok, order}

        {:error, :reserved, reason, _} ->
          {:error, reason}

        {:error, _step, reason, _} ->
          {:error, reason}
      end
    end
  end

  # Credits reduce what the buyer pays; the organizer's revenue is unchanged.
  defp apply_loyalty(repo, %User{} = user, order, %{"use_loyalty_credits" => use} = params)
       when use in [true, "true"] do
    requested =
      case parse_int(params["loyalty_credits_amount"]) do
        {n, ""} when n >= 0 -> n
        _ -> nil
      end

    credits = Loyalty.redeemable(user, order.amount, requested)

    with {:ok, credits} when credits > 0 <- Loyalty.redeem(repo, user.id, credits, order.id) do
      order
      |> Ecto.Changeset.change(
        credits_applied: credits,
        amount: Decimal.sub(order.amount, credits)
      )
      |> repo.update()
    else
      {:ok, 0} -> {:ok, order}
      error -> error
    end
  end

  defp apply_loyalty(_repo, _user, order, _params), do: {:ok, order}

  defp reservation_ttl, do: Application.fetch_env!(:klix, :reservation_ttl_seconds)

  defp validate_attendee(user, params) do
    name = trim(params["attendee_name"]) || (user && blank_to_nil(User.full_name(user)))
    email = trim(params["attendee_email"]) || (user && user.email)
    phone = Klix.Phone.normalize(trim(params["attendee_phone"]) || (user && user.phone_number))

    cond do
      is_nil(name) -> {:error, {:validation, "attendee_name is required"}}
      String.length(name) > 200 -> {:error, {:validation, "attendee_name is too long"}}
      is_nil(email) -> {:error, {:validation, "attendee_email is required"}}
      not Regex.match?(~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/, email) -> {:error, {:validation, "attendee_email is invalid"}}
      phone && not Klix.Phone.valid?(phone) -> {:error, {:validation, "attendee_phone must be a Kenyan phone number"}}
      true -> {:ok, %{name: name, email: String.downcase(email), phone: phone}}
    end
  end

  defp trim(nil), do: nil
  defp trim(value) when is_binary(value), do: blank_to_nil(String.trim(value))
  defp trim(_), do: nil

  defp blank_to_nil(""), do: nil
  defp blank_to_nil(value), do: value

  defp normalize_items(items) when is_list(items) and items != [] do
    items
    |> Enum.reduce_while(%{}, fn
      %{"ticket_type_id" => id, "quantity" => qty}, acc ->
        with {:ok, id} <- Ecto.UUID.cast(id),
             {qty, ""} <- parse_int(qty),
             true <- qty > 0 do
          {:cont, Map.update(acc, id, qty, &(&1 + qty))}
        else
          _ -> {:halt, :error}
        end

      _, _ ->
        {:halt, :error}
    end)
    |> case do
      :error ->
        {:error, {:validation, "each item needs a ticket_type_id and a positive quantity"}}

      map when map_size(map) > @max_line_items ->
        {:error, {:validation, "too many ticket types in one order"}}

      map ->
        # Sorted by id: every checkout locks rows in the same order.
        {:ok, map |> Enum.sort_by(&elem(&1, 0))}
    end
  end

  defp normalize_items(_), do: {:error, {:validation, "items must be a non-empty list"}}

  defp parse_int(value) when is_integer(value), do: {value, ""}
  defp parse_int(value) when is_binary(value), do: Integer.parse(value)
  defp parse_int(_), do: :error

  defp load_ticket_types(items) do
    ids = Enum.map(items, &elem(&1, 0))
    types = Repo.all(from tt in TicketType, where: tt.id in ^ids, preload: [event: :organizer])

    if length(types) == length(ids),
      do: {:ok, Map.new(types, &{&1.id, &1})},
      else: {:error, {:not_found, "One or more ticket types do not exist"}}
  end

  defp validate_event(ticket_types, now) do
    case ticket_types |> Map.values() |> Enum.map(& &1.event) |> Enum.uniq_by(& &1.id) do
      [%Event{status: "published"} = event] ->
        if DateTime.compare(event.end_datetime, now) == :gt,
          do: {:ok, event},
          else: {:error, {:validation, "This event has already ended"}}

      [%Event{}] ->
        {:error, {:validation, "This event is not on sale"}}

      _ ->
        {:error, {:validation, "All tickets in an order must be for the same event"}}
    end
  end

  defp validate_line_items(items, ticket_types, now) do
    Enum.reduce_while(items, :ok, fn {id, qty}, :ok ->
      tt = Map.fetch!(ticket_types, id)

      cond do
        not TicketType.on_sale?(tt, now) ->
          {:halt, {:error, {:validation, "#{tt.name} tickets are not on sale"}}}

        qty > tt.max_per_order ->
          {:halt, {:error, {:validation, "You can buy at most #{tt.max_per_order} #{tt.name} tickets per order"}}}

        true ->
          {:cont, :ok}
      end
    end)
  end

  defp resolve_promoter_code(code, _event) when code in [nil, ""], do: {:ok, nil}

  defp resolve_promoter_code(code, %Event{id: event_id}) do
    case Promoters.validate_code(code, event_id) do
      {:ok, promoter_code} -> {:ok, promoter_code}
      {:error, message} -> {:error, {:validation, message}}
    end
  end

  defp reserve_all(repo, items, now) do
    Enum.reduce_while(items, {:ok, []}, fn {id, qty}, {:ok, acc} ->
      query =
        from tt in TicketType,
          where:
            tt.id == ^id and tt.is_active and
              tt.quantity_total - tt.quantity_sold - tt.quantity_reserved >= ^qty,
          select: tt

      case repo.update_all(query, inc: [quantity_reserved: qty], set: [updated_at: now]) do
        {1, [tt]} ->
          {:cont, {:ok, [{tt, qty} | acc]}}

        {0, _} ->
          name = repo.one(from tt in TicketType, where: tt.id == ^id, select: tt.name)
          {:halt, {:error, {:sold_out, "Not enough #{name} tickets left"}}}
      end
    end)
    |> case do
      {:ok, reserved} -> {:ok, Enum.reverse(reserved)}
      error -> error
    end
  end

  defp insert_order(repo, user, event, attendee, reserved, promoter_code, discount_pct, expires_at, now) do
    lines =
      Enum.map(reserved, fn {tt, qty} ->
        discount = tt.price |> Decimal.mult(discount_pct) |> Decimal.div(100) |> Decimal.round(2)
        %{ticket_type: tt, quantity: qty, unit_price: tt.price, unit_discount: discount}
      end)

    subtotal = sum(lines, &Decimal.mult(&1.unit_price, &1.quantity))
    discount = sum(lines, &Decimal.mult(&1.unit_discount, &1.quantity))
    amount = Decimal.sub(subtotal, discount)

    order_attrs = %Order{
      user_id: user && user.id,
      event_id: event.id,
      promoter_code_id: promoter_code && promoter_code.id,
      status: "pending",
      subtotal: subtotal,
      discount_amount: discount,
      amount: amount,
      platform_fee: platform_fee(amount),
      attendee_name: attendee.name,
      attendee_email: attendee.email,
      attendee_phone: attendee.phone,
      mpesa_phone: attendee.phone,
      expires_at: expires_at
    }

    with {:ok, order} <- repo.insert(order_attrs) do
      item_rows =
        Enum.map(lines, fn line ->
          %{
            id: Ecto.UUID.generate(),
            order_id: order.id,
            ticket_type_id: line.ticket_type.id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            discount_amount: Decimal.mult(line.unit_discount, line.quantity),
            inserted_at: now
          }
        end)

      ticket_rows =
        for line <- lines, _ <- 1..line.quantity do
          %{
            id: Ecto.UUID.generate(),
            order_id: order.id,
            ticket_type_id: line.ticket_type.id,
            event_id: event.id,
            user_id: user && user.id,
            ticket_number: Ticket.generate_number(),
            attendee_name: attendee.name,
            attendee_email: attendee.email,
            attendee_phone: attendee.phone,
            status: "pending_payment",
            original_price: line.unit_price,
            discount_amount: line.unit_discount,
            final_price: Decimal.sub(line.unit_price, line.unit_discount),
            is_guest_purchase: is_nil(user),
            inserted_at: now,
            updated_at: now
          }
        end

      repo.insert_all(OrderItem, item_rows)
      repo.insert_all(Ticket, ticket_rows)
      {:ok, order}
    end
  end

  defp sum(list, fun), do: Enum.reduce(list, Decimal.new(0), &Decimal.add(fun.(&1), &2))

  defp platform_fee(amount) do
    pct = Decimal.new(Application.fetch_env!(:klix, :platform_fee_percentage))
    amount |> Decimal.mult(pct) |> Decimal.div(100) |> Decimal.round(2)
  end

  defp complete_free_order(order) do
    with {:ok, order} <- complete_order(order.id, %{}) do
      {:ok, Repo.preload(order, [tickets: [:ticket_type, :event]], force: true)}
    end
  end

  ## Payment outcomes

  @doc """
  Marks an order paid: reserved inventory becomes sold and tickets become
  valid. Safe to call any number of times for the same order.

  `payment` may contain `:mpesa_receipt` and `:amount_paid`.
  """
  def complete_order(order_id, payment \\ %{}) do
    now = DateTime.utc_now()

    Repo.transaction(fn ->
      order = lock_order!(order_id)

      case order.status do
        "completed" ->
          order

        "pending" ->
          move_reserved_to_sold(order, now)
          mark_completed(order, payment, now)

        status when status in ["expired", "cancelled", "failed"] ->
          # The money arrived after we released the reservation. Take the
          # tickets from what is still available, or flag for refund.
          case take_available(order, now) do
            :ok ->
              respend_credits(order)
              mark_completed(order, payment, now)

            :sold_out -> Repo.rollback({:refund_required, order})
          end

        "refund_required" ->
          order
      end
    end)
    |> case do
      {:ok, order} ->
        after_status_change(order)
        {:ok, order}

      {:error, {:refund_required, order}} ->
        flag_refund(order, payment)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp lock_order!(order_id) do
    Repo.one!(from o in Order, where: o.id == ^order_id, lock: "FOR UPDATE", preload: [:items])
  end

  defp move_reserved_to_sold(order, now) do
    for item <- Enum.sort_by(order.items, & &1.ticket_type_id) do
      {1, _} =
        from(tt in TicketType, where: tt.id == ^item.ticket_type_id)
        |> Repo.update_all(
          inc: [quantity_reserved: -item.quantity, quantity_sold: item.quantity],
          set: [updated_at: now]
        )
    end
  end

  # Releasing the order gave its credits back; the late payment only covered
  # the rest, so take them again if the buyer still has them.
  defp respend_credits(%Order{credits_applied: credits, user_id: user_id} = order)
       when credits > 0 and is_binary(user_id) do
    case Loyalty.redeem(Repo, user_id, credits, order.id) do
      {:ok, _} -> :ok
      {:error, _} -> Logger.warning("Could not re-spend credits for late-paid order #{order.id}", order_id: order.id)
    end
  end

  defp respend_credits(_order), do: :ok

  defp take_available(order, now) do
    Enum.reduce_while(Enum.sort_by(order.items, & &1.ticket_type_id), :ok, fn item, :ok ->
      query =
        from tt in TicketType,
          where:
            tt.id == ^item.ticket_type_id and
              tt.quantity_total - tt.quantity_sold - tt.quantity_reserved >= ^item.quantity

      case Repo.update_all(query, inc: [quantity_sold: item.quantity], set: [updated_at: now]) do
        {1, _} -> {:cont, :ok}
        {0, _} -> {:halt, :sold_out}
      end
    end)
  end

  defp mark_completed(order, payment, now) do
    from(t in Ticket, where: t.order_id == ^order.id)
    |> Repo.update_all(set: [status: "confirmed", purchased_at: now, updated_at: now])

    Promoters.record_use(Repo, order)
    Loyalty.earn(Repo, order)

    order =
      order
      |> Ecto.Changeset.change(
        status: "completed",
        paid_at: now,
        failure_reason: nil,
        mpesa_receipt: payment[:mpesa_receipt] || order.mpesa_receipt
      )
      |> Repo.update!()

    # Queued in the same transaction: sent exactly once, and only if the
    # order really completed.
    Klix.Notifications.ticket_confirmation(order)
    order
  end

  defp flag_refund(order, payment) do
    Logger.error("Order #{order.id} was paid after its tickets sold out; refund required",
      order_id: order.id
    )

    {:ok, order} =
      order
      |> Ecto.Changeset.change(
        status: "refund_required",
        paid_at: DateTime.utc_now(),
        mpesa_receipt: payment[:mpesa_receipt] || order.mpesa_receipt,
        failure_reason: "Paid after the reservation expired and tickets sold out"
      )
      |> Repo.update()

    after_status_change(order)
    {:ok, order}
  end

  @doc """
  Releases a pending order's reservation and closes it with `status`
  (`failed`, `cancelled` or `expired`). No-op for orders that are no longer
  pending, so it is safe to race with `complete_order/2`.
  """
  def release_order(order_id, status, reason \\ nil)
      when status in ["failed", "cancelled", "expired"] do
    now = DateTime.utc_now()

    Repo.transaction(fn ->
      order = lock_order!(order_id)

      if order.status == "pending" do
        for item <- Enum.sort_by(order.items, & &1.ticket_type_id) do
          from(tt in TicketType, where: tt.id == ^item.ticket_type_id)
          |> Repo.update_all(inc: [quantity_reserved: -item.quantity], set: [updated_at: now])
        end

        from(t in Ticket, where: t.order_id == ^order.id)
        |> Repo.update_all(set: [status: "cancelled", updated_at: now])

        Loyalty.refund_redemption(Repo, order)

        order
        |> Ecto.Changeset.change(status: status, failure_reason: reason)
        |> Repo.update!()
      else
        order
      end
    end)
    |> tap(fn
      {:ok, order} -> after_status_change(order)
      _ -> :ok
    end)
  end

  @doc "Pushes the expiry of an order out, e.g. while an M-Pesa prompt is open."
  def extend_expiry(%Order{} = order, seconds) do
    new_expiry = DateTime.add(DateTime.utc_now(), seconds, :second)

    if DateTime.compare(new_expiry, order.expires_at) == :gt do
      from(o in Order, where: o.id == ^order.id and o.status == "pending")
      |> Repo.update_all(set: [expires_at: new_expiry, updated_at: DateTime.utc_now()])

      %{order | expires_at: new_expiry}
    else
      order
    end
  end

  defp after_status_change(%Order{} = order) do
    Events.invalidate_event_id(order.event_id)

    Phoenix.PubSub.broadcast(
      Klix.PubSub,
      status_topic(order.id),
      {:order_status, %{transaction_id: order.id, status: order.status, message: order.failure_reason}}
    )
  end

  @doc "PubSub topic that receives `{:order_status, payload}` for an order."
  def status_topic(order_id), do: "order_status:#{order_id}"

  @doc "Releases every pending order that is past its expiry. Returns the count."
  def sweep_expired(limit \\ 500) do
    cutoff = DateTime.utc_now()

    from(o in Order,
      where: o.status == "pending" and o.expires_at < ^cutoff,
      select: o.id,
      limit: ^limit
    )
    |> Repo.all()
    |> Enum.map(&release_order(&1, "expired", "Reservation expired"))
    |> length()
  end
end
