defmodule Klix.Settlements do
  @moduledoc """
  What each organizer is owed per event.

      net_payable = gross − platform fees − promoter commissions − cash the
                    organizer already collected through their own M-Pesa

  Loyalty credits are funded by the platform, so they reduce the cash
  collected but not the organizer's gross. A negative net means the
  organizer owes the platform (for example when all sales went straight to
  their own paybill).
  """

  import Ecto.Query
  alias Klix.Repo
  alias Klix.Accounts.{Organizer, User}
  alias Klix.Events.Event
  alias Klix.Orders.Order
  alias Klix.Promoters.Commission
  alias Klix.Settlements.Settlement

  @zero Decimal.new(0)

  @doc "A statement for one event, whether or not it has been settled yet."
  def statement(%Event{} = event) do
    event_statements(where(Event, [e], e.id == ^event.id)) |> List.first()
  end

  def organizer_statements(%Organizer{id: organizer_id}) do
    Event
    |> where([e], e.organizer_id == ^organizer_id)
    |> event_statements()
  end

  @doc "Ended events with sales that haven't been settled, for the admin payout queue."
  def pending(params \\ %{}) do
    now = DateTime.utc_now()

    Event
    |> where([e], e.end_datetime <= ^now)
    |> event_statements()
    |> Enum.filter(&(&1.status == "due" and (Decimal.gt?(&1.gross, 0) or Decimal.gt?(&1.collected_by_organizer, 0))))
    |> then(fn list ->
      case params["organizer_id"] do
        id when id in [nil, ""] -> list
        id -> Enum.filter(list, &(&1.organizer_id == id))
      end
    end)
  end

  def list_paid(params) do
    from(s in Settlement, order_by: [desc: s.paid_at], preload: [:event, :organizer])
    |> Repo.paginate(params)
  end

  defp event_statements(event_query) do
    orders =
      from(o in Order,
        where: o.status == "completed",
        group_by: o.event_id,
        select: %{
          event_id: o.event_id,
          gross: sum(o.subtotal - o.discount_amount),
          fees: sum(o.platform_fee),
          collected: filter(sum(o.amount), o.payment_account == "organizer"),
          orders: count(o.id)
        }
      )

    commissions =
      from(c in Commission,
        where: c.status == "earned",
        group_by: c.event_id,
        select: %{event_id: c.event_id, total: sum(c.amount)}
      )

    from(e in event_query,
      join: org in assoc(e, :organizer),
      left_join: o in subquery(orders),
      on: o.event_id == e.id,
      left_join: c in subquery(commissions),
      on: c.event_id == e.id,
      left_join: s in Settlement,
      on: s.event_id == e.id,
      order_by: [desc: e.end_datetime],
      select: %{
        event_id: e.id,
        event_title: e.title,
        event_slug: e.slug,
        end_datetime: e.end_datetime,
        organizer_id: org.id,
        organizer_name: org.business_name,
        orders: coalesce(o.orders, 0),
        gross: coalesce(o.gross, 0),
        platform_fees: coalesce(o.fees, 0),
        collected_by_organizer: coalesce(o.collected, 0),
        promoter_commissions: coalesce(c.total, 0),
        settlement_id: s.id,
        paid_at: s.paid_at,
        reference: s.reference
      }
    )
    |> Repo.all()
    |> Enum.map(fn row ->
      row =
        Enum.reduce([:gross, :platform_fees, :collected_by_organizer, :promoter_commissions], row, fn key, acc ->
          Map.update!(acc, key, &decimal/1)
        end)

      net =
        row.gross
        |> Decimal.sub(row.platform_fees)
        |> Decimal.sub(row.promoter_commissions)
        |> Decimal.sub(row.collected_by_organizer)

      ended? = DateTime.compare(row.end_datetime, DateTime.utc_now()) != :gt

      row
      |> Map.put(:net_payable, net)
      |> Map.put(:status, cond do
        row.settlement_id -> "paid"
        ended? -> "due"
        true -> "accruing"
      end)
    end)
  end

  defp decimal(%Decimal{} = d), do: d
  defp decimal(n) when is_integer(n), do: Decimal.new(n)
  defp decimal(nil), do: @zero

  @doc "Records that an event's payout was made, freezing the numbers at that moment."
  def mark_paid(%Event{} = event, %User{} = admin, attrs) do
    case statement(event) do
      %{status: "paid"} ->
        {:error, {:validation, "This event has already been settled"}}

      %{status: "accruing"} ->
        {:error, {:validation, "Events can only be settled after they end"}}

      s ->
        %Settlement{
          event_id: event.id,
          organizer_id: event.organizer_id,
          gross: s.gross,
          platform_fees: s.platform_fees,
          promoter_commissions: s.promoter_commissions,
          collected_by_organizer: s.collected_by_organizer,
          net_payable: s.net_payable,
          reference: attrs["reference"],
          note: attrs["note"],
          paid_at: DateTime.utc_now(),
          paid_by_id: admin.id
        }
        |> Ecto.Changeset.change()
        |> Ecto.Changeset.unique_constraint(:event_id, message: "has already been settled")
        |> Repo.insert()
    end
  end
end
