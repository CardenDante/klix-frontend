defmodule Klix.Analytics do
  @moduledoc """
  Reporting for organizers and admins. Everything here is aggregate SQL
  over indexed columns, cached briefly so dashboards refreshing every few
  seconds don't add load.

  Money terms:
    * gross   — ticket revenue after promo discounts (what the organizer sold)
    * fees    — the platform's share
    * net     — gross minus fees and promoter commissions
  """

  import Ecto.Query
  alias Klix.{Cache, Repo}
  alias Klix.Accounts.{Organizer, User}
  alias Klix.Events.{Event, TicketType}
  alias Klix.Orders.{Order, Ticket}
  alias Klix.Promoters.{Commission, Profile, PromoterCode, Withdrawal}

  @zero Decimal.new(0)

  ## Organizer

  def organizer_dashboard(%Organizer{} = organizer) do
    Cache.fetch({:analytics, :organizer, organizer.id}, :timer.seconds(30), fn ->
      now = DateTime.utc_now()
      month_start = start_of_month(now)
      last_month_start = start_of_month(DateTime.add(month_start, -86_400, :second))

      counts =
        from(e in Event,
          where: e.organizer_id == ^organizer.id,
          select: %{
            total: count(e.id),
            active: filter(count(e.id), e.status == "published" and e.end_datetime > ^now),
            completed: filter(count(e.id), e.end_datetime <= ^now and e.status != "cancelled"),
            draft: filter(count(e.id), e.status == "draft")
          }
        )
        |> Repo.one()

      money =
        from(o in Order,
          join: e in assoc(o, :event),
          where: e.organizer_id == ^organizer.id and o.status == "completed",
          select: %{
            gross: sum(o.subtotal - o.discount_amount),
            fees: sum(o.platform_fee),
            gross_this_month: filter(sum(o.subtotal - o.discount_amount), o.paid_at >= ^month_start),
            gross_last_month:
              filter(sum(o.subtotal - o.discount_amount), o.paid_at >= ^last_month_start and o.paid_at < ^month_start)
          }
        )
        |> Repo.one()

      tickets =
        from(t in Ticket,
          join: e in assoc(t, :event),
          where: e.organizer_id == ^organizer.id and t.status in ["confirmed", "used"],
          select: %{
            total: count(t.id),
            checked_in: count(t.checked_in_at),
            this_month: filter(count(t.id), t.purchased_at >= ^month_start),
            last_month: filter(count(t.id), t.purchased_at >= ^last_month_start and t.purchased_at < ^month_start)
          }
        )
        |> Repo.one()

      commissions =
        from(c in Commission,
          join: e in assoc(c, :event),
          where: e.organizer_id == ^organizer.id and c.status == "earned",
          select: sum(c.amount)
        )
        |> Repo.one() || @zero

      summaries = event_summaries(organizer.id)
      ended = Enum.filter(summaries, &(DateTime.compare(&1.end_datetime, now) != :gt and &1.tickets_sold > 0))

      gross = money.gross || @zero
      fees = money.fees || @zero

      %{
        organizer_id: organizer.id,
        organizer_name: organizer.business_name,
        total_events: counts.total,
        active_events: counts.active,
        completed_events: counts.completed,
        draft_events: counts.draft,
        total_revenue: gross,
        total_platform_fees: fees,
        total_promoter_commissions: commissions,
        total_net_revenue: gross |> Decimal.sub(fees) |> Decimal.sub(commissions),
        revenue_this_month: money.gross_this_month || @zero,
        revenue_last_month: money.gross_last_month || @zero,
        revenue_growth_percentage: growth(money.gross_this_month, money.gross_last_month),
        total_tickets_sold: tickets.total,
        tickets_sold_this_month: tickets.this_month,
        tickets_sold_last_month: tickets.last_month,
        ticket_sales_growth_percentage: growth(tickets.this_month, tickets.last_month),
        average_event_capacity_utilization: average(summaries, fn s -> pct(s.tickets_sold, s.total_capacity) end),
        average_check_in_rate: average(ended, fn s -> pct(s.checked_in, s.tickets_sold) end),
        top_events: summaries |> Enum.sort_by(& &1.revenue, {:desc, Decimal}) |> Enum.take(5),
        upcoming_events:
          summaries
          |> Enum.filter(&(DateTime.compare(&1.start_datetime, now) == :gt and &1.status != "cancelled"))
          |> Enum.sort_by(& &1.start_datetime, DateTime)
          |> Enum.take(5),
        recent_completed_events: ended |> Enum.sort_by(& &1.end_datetime, {:desc, DateTime}) |> Enum.take(5)
      }
    end)
  end

  defp event_summaries(organizer_id) do
    revenue =
      from(o in Order,
        where: o.status == "completed",
        group_by: o.event_id,
        select: %{event_id: o.event_id, revenue: sum(o.subtotal - o.discount_amount)}
      )

    sold =
      from(t in Ticket,
        where: t.status in ["confirmed", "used"],
        group_by: t.event_id,
        select: %{event_id: t.event_id, sold: count(t.id), checked_in: count(t.checked_in_at)}
      )

    capacity =
      from(tt in TicketType, where: tt.is_active, group_by: tt.event_id, select: %{event_id: tt.event_id, total: sum(tt.quantity_total)})

    from(e in Event,
      where: e.organizer_id == ^organizer_id,
      left_join: r in subquery(revenue),
      on: r.event_id == e.id,
      left_join: s in subquery(sold),
      on: s.event_id == e.id,
      left_join: c in subquery(capacity),
      on: c.event_id == e.id,
      select: %{
        event_id: e.id,
        event_name: e.title,
        event_slug: e.slug,
        event_date: e.start_datetime,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        status: e.status,
        is_published: e.status == "published",
        tickets_sold: coalesce(s.sold, 0),
        checked_in: coalesce(s.checked_in, 0),
        total_capacity: coalesce(c.total, 0),
        revenue: coalesce(r.revenue, 0)
      }
    )
    |> Repo.all()
    |> Enum.map(fn s ->
      s
      |> Map.update!(:revenue, &to_decimal/1)
      |> Map.put(:check_in_rate, pct(s.checked_in, s.tickets_sold))
    end)
  end

  def event_analytics(%Event{} = event) do
    Cache.fetch({:analytics, :event, event.id}, :timer.seconds(20), fn -> build_event_analytics(event) end)
  end

  defp build_event_analytics(event) do
    now = DateTime.utc_now()

    money =
      from(o in Order,
        where: o.event_id == ^event.id and o.status == "completed",
        select: %{
          gross: sum(o.subtotal - o.discount_amount),
          fees: sum(o.platform_fee),
          discounts: sum(o.discount_amount),
          customers: count(o.attendee_email, :distinct),
          registered: count(o.user_id, :distinct),
          orders: count(o.id)
        }
      )
      |> Repo.one()

    guests =
      Repo.one(
        from o in Order,
          where: o.event_id == ^event.id and o.status == "completed" and is_nil(o.user_id),
          select: count(o.attendee_email, :distinct)
      )

    # Buyers who also bought for another event by the same organizer.
    returning =
      Repo.one(
        from o in Order,
          where: o.event_id == ^event.id and o.status == "completed",
          where:
            fragment(
              "EXISTS (SELECT 1 FROM orders o2 JOIN events e2 ON e2.id = o2.event_id WHERE o2.attendee_email = ? AND o2.status = 'completed' AND e2.organizer_id = ? AND o2.event_id <> ?)",
              o.attendee_email,
              type(^event.organizer_id, :binary_id),
              type(^event.id, :binary_id)
            ),
          select: count(o.attendee_email, :distinct)
      )

    by_type =
      from(tt in TicketType,
        where: tt.event_id == ^event.id,
        left_join: t in Ticket,
        on: t.ticket_type_id == tt.id and t.status in ["confirmed", "used"],
        group_by: [tt.id, tt.name, tt.price, tt.quantity_total, tt.sort_order],
        order_by: [asc: tt.sort_order, asc: tt.price],
        select: %{
          ticket_type_id: tt.id,
          ticket_type_name: tt.name,
          price: tt.price,
          quantity_total: tt.quantity_total,
          tickets_sold: count(t.id),
          tickets_checked_in: count(t.checked_in_at),
          revenue: coalesce(sum(t.final_price), 0)
        }
      )
      |> Repo.all()
      |> Enum.map(&Map.update!(&1, :revenue, fn r -> to_decimal(r) end))

    total_sold = Enum.sum(Enum.map(by_type, & &1.tickets_sold))
    capacity = Enum.sum(Enum.map(by_type, & &1.quantity_total))
    checked_in = Enum.sum(Enum.map(by_type, & &1.tickets_checked_in))

    cancelled = Repo.aggregate(from(t in Ticket, where: t.event_id == ^event.id and t.status == "cancelled"), :count)

    # Sales per day in Nairobi time.
    daily =
      from(t in Ticket,
        where: t.event_id == ^event.id and t.status in ["confirmed", "used"] and not is_nil(t.purchased_at),
        group_by: fragment("date(? AT TIME ZONE 'Africa/Nairobi')", t.purchased_at),
        order_by: fragment("date(? AT TIME ZONE 'Africa/Nairobi')", t.purchased_at),
        select: %{
          date: fragment("date(? AT TIME ZONE 'Africa/Nairobi')", t.purchased_at),
          tickets_sold: count(t.id),
          revenue: sum(t.final_price)
        }
      )
      |> Repo.all()
      |> Enum.map_reduce({0, @zero}, fn day, {tickets, revenue} ->
        tickets = tickets + day.tickets_sold
        revenue = Decimal.add(revenue, day.revenue)
        {Map.merge(day, %{cumulative_tickets: tickets, cumulative_revenue: revenue}), {tickets, revenue}}
      end)
      |> elem(0)

    top_promoters =
      from(pc in PromoterCode,
        where: pc.event_id == ^event.id,
        left_join: cm in Commission,
        on: cm.promoter_code_id == pc.id and cm.status == "earned",
        left_join: p in Profile,
        on: p.user_id == pc.promoter_id,
        group_by: [pc.id, pc.code, pc.code_type, pc.discount_percentage, pc.commission_percentage, pc.times_used, pc.clicks, p.display_name],
        order_by: [desc: pc.times_used],
        limit: 10,
        select: %{
          promoter_code: pc.code,
          promoter_name: p.display_name,
          code_type: pc.code_type,
          discount_percentage: pc.discount_percentage,
          commission_percentage: pc.commission_percentage,
          times_used: pc.times_used,
          clicks: pc.clicks,
          tickets_sold: coalesce(sum(cm.tickets), 0),
          revenue_generated: coalesce(sum(cm.order_amount), 0),
          total_discount_given: coalesce(sum(cm.discount_amount), 0),
          total_commission_earned: coalesce(sum(cm.amount), 0)
        }
      )
      |> Repo.all()

    commissions = Enum.reduce(top_promoters, @zero, &Decimal.add(to_decimal(&1.total_commission_earned), &2))
    gross = money.gross || @zero
    fees = money.fees || @zero
    days_until = max(div(DateTime.diff(event.start_datetime, now), 86_400), 0)

    first_sale = List.first(daily)
    selling_days = if first_sale, do: max(Date.diff(Date.utc_today(), first_sale.date) + 1, 1), else: 0
    per_day = if selling_days > 0, do: Float.round(total_sold / selling_days, 1), else: 0.0
    avg_price = if total_sold > 0, do: Decimal.div(gross, total_sold) |> Decimal.round(2), else: @zero

    projected_tickets = min(total_sold + round(per_day * days_until), capacity)

    %{
      event_id: event.id,
      event_name: event.title,
      event_date: event.start_datetime,
      total_revenue: gross,
      platform_fees: fees,
      total_promoter_commissions: commissions,
      net_revenue: gross |> Decimal.sub(fees) |> Decimal.sub(commissions),
      total_promoter_discounts: money.discounts || @zero,
      tickets_sold: total_sold,
      total_capacity: capacity,
      capacity_utilization: pct(total_sold, capacity),
      average_ticket_price: avg_price,
      sales_by_type:
        Enum.map(by_type, fn t -> Map.put(t, :percentage_of_total, pct(t.tickets_sold, total_sold)) end),
      daily_sales: daily,
      top_promoters: top_promoters,
      checkin_stats: %{
        total_tickets: total_sold,
        checked_in: checked_in,
        not_checked_in: total_sold - checked_in,
        check_in_rate: pct(checked_in, total_sold),
        cancelled_tickets: cancelled
      },
      customer_demographics: %{
        total_customers: money.customers,
        registered_customers: money.registered,
        guest_customers: guests,
        returning_customers: returning,
        average_tickets_per_customer: if(money.customers > 0, do: Float.round(total_sold / money.customers, 2), else: 0.0)
      },
      days_until_event: days_until,
      average_sales_per_day: per_day,
      projected_tickets: projected_tickets,
      projected_revenue: Decimal.mult(avg_price, projected_tickets)
    }
  end

  ## Admin

  def admin_overview do
    Cache.fetch({:analytics, :admin_overview}, :timer.seconds(60), fn ->
      now = DateTime.utc_now()
      month_start = start_of_month(now)

      users =
        from(u in User,
          select: %{
            total: count(u.id),
            active: filter(count(u.id), u.is_active),
            new_this_month: filter(count(u.id), u.inserted_at >= ^month_start),
            organizers: filter(count(u.id), u.role == "organizer"),
            promoters: filter(count(u.id), u.role == "promoter"),
            admins: filter(count(u.id), u.role == "admin")
          }
        )
        |> Repo.one()

      events =
        from(e in Event,
          select: %{
            total: count(e.id),
            published: filter(count(e.id), e.status == "published"),
            upcoming: filter(count(e.id), e.status == "published" and e.start_datetime > ^now),
            flagged: filter(count(e.id), not is_nil(e.flagged_at))
          }
        )
        |> Repo.one()

      orders =
        from(o in Order,
          where: o.status == "completed",
          select: %{
            count: count(o.id),
            gmv: sum(o.subtotal - o.discount_amount),
            cash: sum(o.amount),
            fees: sum(o.platform_fee),
            gmv_this_month: filter(sum(o.subtotal - o.discount_amount), o.paid_at >= ^month_start),
            fees_this_month: filter(sum(o.platform_fee), o.paid_at >= ^month_start)
          }
        )
        |> Repo.one()

      tickets = Repo.aggregate(from(t in Ticket, where: t.status in ["confirmed", "used"]), :count)
      refunds = Repo.aggregate(from(o in Order, where: o.status == "refund_required"), :count)

      pending = %{
        organizers: Repo.aggregate(from(o in Organizer, where: o.status == "pending"), :count),
        promoters: Repo.aggregate(from(p in Profile, where: p.status == "pending"), :count),
        withdrawals: Repo.aggregate(from(w in Withdrawal, where: w.status == "requested"), :count),
        withdrawal_amount: Repo.one(from(w in Withdrawal, where: w.status == "requested", select: sum(w.amount))) || @zero,
        refunds_required: refunds
      }

      %{
        users: users,
        events: events,
        orders: %{
          completed: orders.count,
          gross_merchandise_value: orders.gmv || @zero,
          cash_collected: orders.cash || @zero,
          platform_fees: orders.fees || @zero,
          gmv_this_month: orders.gmv_this_month || @zero,
          platform_fees_this_month: orders.fees_this_month || @zero
        },
        tickets_sold: tickets,
        pending: pending,
        monthly: monthly_series(),
        top_organizers: top_organizers(),
        top_events: top_events(),
        categories: categories()
      }
    end)
  end

  defp monthly_series do
    since = start_of_month(DateTime.add(DateTime.utc_now(), -330 * 86_400, :second))

    revenue =
      from(o in Order,
        where: o.status == "completed" and o.paid_at >= ^since,
        group_by: fragment("date_trunc('month', ?)", o.paid_at),
        select:
          {fragment("to_char(date_trunc('month', ?), 'YYYY-MM')", o.paid_at),
           %{gmv: sum(o.subtotal - o.discount_amount), fees: sum(o.platform_fee), orders: count(o.id)}}
      )
      |> Repo.all()
      |> Map.new()

    signups =
      from(u in User,
        where: u.inserted_at >= ^since,
        group_by: fragment("date_trunc('month', ?)", u.inserted_at),
        select: {fragment("to_char(date_trunc('month', ?), 'YYYY-MM')", u.inserted_at), count(u.id)}
      )
      |> Repo.all()
      |> Map.new()

    for offset <- 11..0//-1 do
      date = Date.utc_today() |> Date.beginning_of_month() |> Date.shift(month: -offset)
      key = Calendar.strftime(date, "%Y-%m")
      r = Map.get(revenue, key, %{gmv: @zero, fees: @zero, orders: 0})
      %{month: key, gmv: r.gmv, platform_fees: r.fees, orders: r.orders, new_users: Map.get(signups, key, 0)}
    end
  end

  defp top_organizers do
    from(o in Order,
      join: e in assoc(o, :event),
      join: org in assoc(e, :organizer),
      where: o.status == "completed",
      group_by: [org.id, org.business_name],
      order_by: [desc: sum(o.subtotal - o.discount_amount)],
      limit: 10,
      select: %{
        organizer_id: org.id,
        business_name: org.business_name,
        revenue: sum(o.subtotal - o.discount_amount),
        orders: count(o.id)
      }
    )
    |> Repo.all()
  end

  defp top_events do
    from(o in Order,
      join: e in assoc(o, :event),
      where: o.status == "completed",
      group_by: [e.id, e.title, e.slug, e.start_datetime],
      order_by: [desc: sum(o.subtotal - o.discount_amount)],
      limit: 10,
      select: %{
        event_id: e.id,
        title: e.title,
        slug: e.slug,
        start_datetime: e.start_datetime,
        revenue: sum(o.subtotal - o.discount_amount),
        orders: count(o.id)
      }
    )
    |> Repo.all()
  end

  defp categories do
    from(e in Event,
      left_join: t in Ticket,
      on: t.event_id == e.id and t.status in ["confirmed", "used"],
      where: e.status in ["published", "completed"],
      group_by: e.category,
      order_by: [desc: count(t.id)],
      select: %{category: e.category, events: count(e.id, :distinct), tickets_sold: count(t.id)}
    )
    |> Repo.all()
  end

  ## Helpers

  defp start_of_month(%DateTime{} = dt), do: %{dt | day: 1, hour: 0, minute: 0, second: 0, microsecond: {0, 6}}

  defp pct(_part, 0), do: 0.0
  defp pct(part, whole), do: Float.round(part * 100 / whole, 1)

  defp average([], _fun), do: 0.0
  defp average(list, fun), do: Float.round(Enum.sum(Enum.map(list, fun)) / length(list), 1)

  defp growth(current, previous) do
    current = to_float(current)
    previous = to_float(previous)
    if previous > 0, do: Float.round((current - previous) * 100 / previous, 1)
  end

  defp to_float(nil), do: 0.0
  defp to_float(%Decimal{} = d), do: Decimal.to_float(d)
  defp to_float(n) when is_integer(n), do: n * 1.0
  defp to_float(n), do: n

  defp to_decimal(%Decimal{} = d), do: d
  defp to_decimal(n) when is_integer(n), do: Decimal.new(n)
  defp to_decimal(nil), do: @zero
end
