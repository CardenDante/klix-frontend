defmodule Klix.Promoters do
  @moduledoc """
  The promoter programme.

  1. A user applies for a promoter profile; an admin approves it.
  2. The promoter asks an event's organizer for permission to sell it. The
     organizer approves with terms: a commission and an optional buyer
     discount.
  3. The promoter creates codes for approved events and shares them.
  4. Paid orders that used a code earn a commission, which becomes
     withdrawable once the event has ended.
  """

  import Ecto.Query
  alias Ecto.Multi
  alias Klix.Repo
  alias Klix.Accounts.{Organizer, User}
  alias Klix.Events.Event
  alias Klix.Orders.Order
  alias Klix.Promoters.{Commission, EventApproval, Profile, PromoterCode, Withdrawal}

  @min_withdrawal Decimal.new(100)
  @max_codes_per_event 5

  ## Profiles

  def get_profile(%User{id: user_id}), do: Repo.get_by(Profile, user_id: user_id)
  def get_profile_by_id(id) do
    case cast_id(id) do
      {:ok, id} -> Repo.get(Profile, id)
      :error -> nil
    end
  end

  def approved?(%User{role: "admin"}), do: true

  def approved?(%User{} = user) do
    match?(%Profile{status: "approved"}, get_profile(user))
  end

  def apply_as_promoter(%User{} = user, attrs) do
    %Profile{user_id: user.id} |> Profile.changeset(attrs) |> Repo.insert()
  end

  def update_profile(%Profile{} = profile, attrs) do
    profile |> Profile.changeset(attrs) |> Repo.update()
  end

  def list_profiles(params) do
    Profile
    |> then(fn q ->
      case params["status"] do
        s when s in [nil, ""] -> q
        s -> where(q, status: ^s)
      end
    end)
    |> order_by(desc: :inserted_at)
    |> preload(:user)
    |> Repo.paginate(params)
  end

  @doc "Approves a profile and gives the user the promoter role (unless they already have a stronger one)."
  def approve_profile(%Profile{} = profile, %User{} = admin) do
    Multi.new()
    |> Multi.update(
      :profile,
      Profile.review_changeset(profile, %{
        status: "approved",
        approved_at: DateTime.utc_now(),
        approved_by_id: admin.id,
        rejection_reason: nil
      })
    )
    |> Multi.run(:user, fn repo, %{profile: p} ->
      user = repo.get!(User, p.user_id)

      if user.role in ["attendee", "event_staff"],
        do: user |> User.role_changeset("promoter") |> repo.update(),
        else: {:ok, user}
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{profile: profile}} -> {:ok, Repo.preload(profile, :user)}
      {:error, _, reason, _} -> {:error, reason}
    end
  end

  def reject_profile(%Profile{} = profile, reason) do
    profile |> Profile.review_changeset(%{status: "rejected", rejection_reason: reason}) |> Repo.update()
  end

  @doc "Suspending also switches off every code the promoter has."
  def suspend_profile(%Profile{} = profile, reason) do
    Repo.transaction(fn ->
      from(c in PromoterCode, where: c.promoter_id == ^profile.user_id)
      |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])

      profile
      |> Profile.review_changeset(%{status: "suspended", rejection_reason: reason})
      |> Repo.update!()
    end)
  end

  ## Event requests

  def request_event(%User{} = user, event_id, message) do
    with true <- approved?(user) || {:error, :promoter_not_approved},
         {:ok, event_id} <- cast_id(event_id),
         %Event{status: "published"} = event <- Repo.get(Event, event_id) || {:error, {:not_found, "Event not found"}} do
      %EventApproval{promoter_id: user.id, event_id: event.id, organizer_id: event.organizer_id}
      |> EventApproval.request_changeset(%{message: message})
      |> Repo.insert()
    else
      %Event{} -> {:error, {:validation, "Only published events can be promoted"}}
      error -> error
    end
  end

  def list_my_requests(%User{id: user_id}, status \\ nil) do
    from(a in EventApproval, where: a.promoter_id == ^user_id, order_by: [desc: a.inserted_at], preload: [:event])
    |> filter_status(status)
    |> Repo.all()
  end

  def approved_events(%User{id: user_id}) do
    from(a in EventApproval,
      join: e in assoc(a, :event),
      where: a.promoter_id == ^user_id and a.status == "approved",
      order_by: [asc: e.start_datetime],
      preload: [event: e]
    )
    |> Repo.all()
  end

  def list_requests_for_organizer(%Organizer{id: organizer_id}, params) do
    from(a in EventApproval,
      where: a.organizer_id == ^organizer_id,
      order_by: [desc: a.inserted_at],
      preload: [:event, promoter: []]
    )
    |> filter_status(params["status"])
    |> then(fn q ->
      case cast_id(params["event_id"]) do
        {:ok, id} -> where(q, [a], a.event_id == ^id)
        _ -> q
      end
    end)
    |> Repo.all()
    |> attach_profiles()
  end

  def approved_promoters_for_event(event_id) do
    from(a in EventApproval,
      where: a.event_id == ^event_id and a.status == "approved",
      preload: [:promoter]
    )
    |> Repo.all()
    |> attach_profiles()
  end

  # Adds the promoter's display name without an N+1.
  defp attach_profiles(approvals) do
    ids = approvals |> Enum.map(& &1.promoter_id) |> Enum.uniq()
    names = Repo.all(from p in Profile, where: p.user_id in ^ids, select: {p.user_id, p.display_name}) |> Map.new()
    Enum.map(approvals, &Map.put(&1, :promoter_name, Map.get(names, &1.promoter_id)))
  end

  def get_request_for_organizer(%Organizer{id: organizer_id}, id) do
    with {:ok, id} <- cast_id(id) do
      Repo.one(from a in EventApproval, where: a.id == ^id and a.organizer_id == ^organizer_id)
    else
      _ -> nil
    end
  end

  def approve_request(%EventApproval{} = approval, attrs) do
    approval
    |> EventApproval.terms_changeset(attrs)
    |> Ecto.Changeset.put_change(:status, "approved")
    |> Ecto.Changeset.put_change(:approved_at, DateTime.utc_now())
    |> Ecto.Changeset.put_change(:revoked_at, nil)
    |> Ecto.Changeset.validate_required([:commission_percentage])
    |> Repo.update()
    |> tap(fn
      {:ok, a} -> sync_codes(a, is_active: true)
      _ -> :ok
    end)
  end

  def reject_request(%EventApproval{} = approval, message) do
    approval
    |> Ecto.Changeset.change(status: "rejected", rejected_at: DateTime.utc_now(), response_message: message)
    |> Repo.update()
  end

  def revoke_request(%EventApproval{} = approval, message) do
    approval
    |> Ecto.Changeset.change(status: "revoked", revoked_at: DateTime.utc_now(), response_message: message)
    |> Repo.update()
    |> tap(fn
      {:ok, a} -> sync_codes(a, is_active: false)
      _ -> :ok
    end)
  end

  @doc "Changing the terms applies to the promoter's existing codes for that event too."
  def update_terms(%EventApproval{status: "approved"} = approval, attrs) do
    approval
    |> EventApproval.terms_changeset(attrs)
    |> Repo.update()
    |> tap(fn
      {:ok, a} -> sync_codes(a, [])
      _ -> :ok
    end)
  end

  def update_terms(_, _), do: {:error, {:validation, "Only approved promoters have terms to update"}}

  defp sync_codes(%EventApproval{} = a, extra) do
    discount = a.discount_percentage || Decimal.new(0)

    set =
      [
        commission_percentage: a.commission_percentage,
        discount_percentage: if(Decimal.gt?(discount, 0), do: discount),
        code_type: if(Decimal.gt?(discount, 0), do: "discount", else: "commission"),
        updated_at: DateTime.utc_now()
      ] ++ extra

    from(c in PromoterCode, where: c.promoter_id == ^a.promoter_id and c.event_id == ^a.event_id)
    |> Repo.update_all(set: set)
  end

  ## Codes

  @doc """
  Creates a code for an approved event. Terms come from the organizer's
  approval, never from the request.
  """
  def create_code(%User{} = user, attrs) do
    with {:ok, event_id} <- cast_id(attrs["event_id"]),
         %EventApproval{status: "approved"} = approval <-
           Repo.get_by(EventApproval, promoter_id: user.id, event_id: event_id) ||
             {:error, {:validation, "You need the organizer's approval to promote this event"}},
         :ok <- check_code_limit(user, event_id) do
      discount = approval.discount_percentage || Decimal.new(0)
      code = attrs["code"] |> blank_to_nil() || generate_code(user)

      %PromoterCode{promoter_id: user.id, event_id: event_id}
      |> PromoterCode.changeset(%{
        code: code,
        code_type: if(Decimal.gt?(discount, 0), do: "discount", else: "commission"),
        discount_percentage: if(Decimal.gt?(discount, 0), do: discount),
        commission_percentage: approval.commission_percentage,
        usage_limit: attrs["usage_limit"],
        valid_from: attrs["valid_from"],
        valid_until: attrs["valid_until"]
      })
      |> Repo.insert()
    else
      %EventApproval{} -> {:error, {:validation, "You need the organizer's approval to promote this event"}}
      error -> error
    end
  end

  defp check_code_limit(user, event_id) do
    count = Repo.aggregate(from(c in PromoterCode, where: c.promoter_id == ^user.id and c.event_id == ^event_id), :count)
    if count >= @max_codes_per_event, do: {:error, {:validation, "You can create up to #{@max_codes_per_event} codes per event"}}, else: :ok
  end

  defp generate_code(%User{} = user) do
    prefix =
      (user.first_name || "KLIX")
      |> String.upcase()
      |> String.replace(~r/[^A-Z0-9]/, "")
      |> String.slice(0, 6)
      |> case do
        "" -> "KLIX"
        p -> p
      end

    prefix <> (:crypto.strong_rand_bytes(3) |> Base.encode32(padding: false) |> binary_part(0, 4))
  end

  defp blank_to_nil(nil), do: nil
  defp blank_to_nil(s) when is_binary(s), do: if(String.trim(s) == "", do: nil, else: s)
  defp blank_to_nil(_), do: nil

  def list_codes(%User{id: user_id}, params \\ %{}) do
    from(c in PromoterCode, where: c.promoter_id == ^user_id, order_by: [desc: c.inserted_at], preload: [:event])
    |> then(fn q -> if params["active_only"] == "true", do: where(q, [c], c.is_active), else: q end)
    |> Repo.all()
    |> attach_code_stats()
  end

  def get_code_for_promoter(%User{id: user_id}, id) do
    with {:ok, id} <- cast_id(id),
         %PromoterCode{} = code <- Repo.one(from c in PromoterCode, where: c.id == ^id and c.promoter_id == ^user_id, preload: [:event]) do
      code |> List.wrap() |> attach_code_stats() |> hd()
    else
      _ -> nil
    end
  end

  def deactivate_code(%PromoterCode{} = code) do
    code |> Ecto.Changeset.change(is_active: false) |> Repo.update()
  end

  def track_click(code) when is_binary(code) do
    code = code |> String.trim() |> String.upcase()
    {count, _} = from(c in PromoterCode, where: c.code == ^code and c.is_active) |> Repo.update_all(inc: [clicks: 1])
    if count == 1, do: :ok, else: {:error, :not_found}
  end

  def track_click(_), do: {:error, :not_found}

  # Adds sales stats to codes: tickets, revenue, commission and conversion.
  defp attach_code_stats(codes) do
    ids = Enum.map(codes, & &1.id)

    stats =
      from(cm in Commission,
        where: cm.promoter_code_id in ^ids and cm.status == "earned",
        group_by: cm.promoter_code_id,
        select:
          {cm.promoter_code_id,
           %{
             tickets_sold: sum(cm.tickets),
             revenue_generated: sum(cm.order_amount),
             total_discount_given: sum(cm.discount_amount),
             total_commission_earned: sum(cm.amount)
           }}
      )
      |> Repo.all()
      |> Map.new()

    # Discount-only codes earn no commission rows, so count orders too.
    order_stats =
      from(o in Order,
        join: t in assoc(o, :tickets),
        where: o.promoter_code_id in ^ids and o.status == "completed",
        group_by: o.promoter_code_id,
        select: {o.promoter_code_id, %{tickets: count(t.id)}}
      )
      |> Repo.all()
      |> Map.new()

    empty = %{tickets_sold: 0, revenue_generated: Decimal.new(0), total_discount_given: Decimal.new(0), total_commission_earned: Decimal.new(0)}

    Enum.map(codes, fn code ->
      s = Map.get(stats, code.id, empty)
      tickets = max(s.tickets_sold || 0, get_in(order_stats, [code.id, :tickets]) || 0)
      conversion = if code.clicks > 0, do: Float.round(code.times_used * 100 / code.clicks, 1)
      Map.put(code, :stats, Map.merge(s, %{tickets_sold: tickets, conversion_rate: conversion}))
    end)
  end

  ## Checkout helpers

  def get_code(code, event_id) when is_binary(code) and is_binary(event_id) do
    code = code |> String.trim() |> String.upcase()

    with {:ok, event_id} <- Ecto.UUID.cast(event_id) do
      Repo.one(from c in PromoterCode, where: c.code == ^code and c.event_id == ^event_id)
    else
      _ -> nil
    end
  end

  def get_code(_, _), do: nil

  @doc "Returns `{:ok, code}` if the code can be used for the event right now."
  def validate_code(code, event_id, now \\ DateTime.utc_now()) do
    case get_code(code, event_id) do
      nil ->
        {:error, "Invalid promoter code"}

      %PromoterCode{is_active: false} ->
        {:error, "This promoter code is no longer active"}

      %PromoterCode{valid_from: from} = c when not is_nil(from) ->
        if DateTime.compare(now, from) == :lt,
          do: {:error, "This promoter code is not active yet"},
          else: check_expiry_and_limit(c, now)

      c ->
        check_expiry_and_limit(c, now)
    end
  end

  defp check_expiry_and_limit(%PromoterCode{} = c, now) do
    cond do
      c.valid_until && DateTime.compare(now, c.valid_until) != :lt ->
        {:error, "This promoter code has expired"}

      c.usage_limit && c.times_used >= c.usage_limit ->
        {:error, "This promoter code has reached its usage limit"}

      true ->
        {:ok, c}
    end
  end

  @doc "The discount a code gives, as a percentage (zero for commission-only codes)."
  def discount_percentage(%PromoterCode{code_type: "discount", discount_percentage: %Decimal{} = pct}),
    do: pct

  def discount_percentage(_), do: Decimal.new(0)

  @doc """
  Called inside the order-completion transaction: counts the use and, if
  the code earns commission, records it. Idempotent per order.
  """
  def record_use(repo, %Order{promoter_code_id: code_id} = order) when is_binary(code_id) do
    {_, [code]} =
      from(c in PromoterCode, where: c.id == ^code_id, select: c)
      |> repo.update_all(inc: [times_used: 1])

    pct = code.commission_percentage

    if pct && Decimal.gt?(pct, 0) do
      tickets = repo.aggregate(from(t in Klix.Orders.Ticket, where: t.order_id == ^order.id), :count)
      base = Decimal.sub(order.subtotal, order.discount_amount)

      repo.insert!(
        %Commission{
          order_id: order.id,
          promoter_id: code.promoter_id,
          promoter_code_id: code.id,
          event_id: order.event_id,
          tickets: tickets,
          order_amount: base,
          discount_amount: order.discount_amount,
          commission_percentage: pct,
          amount: base |> Decimal.mult(pct) |> Decimal.div(100) |> Decimal.round(2)
        },
        on_conflict: :nothing,
        conflict_target: :order_id
      )
    end

    :ok
  end

  def record_use(_repo, _order), do: :ok

  ## Earnings and withdrawals

  @doc """
  Commissions are held until the event ends (so refunds and disputes can be
  handled), then become withdrawable.
  """
  def earnings(%User{id: user_id}) do
    now = DateTime.utc_now()

    commission_totals =
      from(cm in Commission,
        join: e in assoc(cm, :event),
        where: cm.promoter_id == ^user_id and cm.status == "earned",
        select: %{
          total: sum(cm.amount),
          matured: filter(sum(cm.amount), e.end_datetime <= ^now),
          pending: filter(sum(cm.amount), e.end_datetime > ^now),
          this_month: filter(sum(cm.amount), cm.inserted_at >= ^start_of_month(now))
        }
      )
      |> Repo.one()

    withdrawals =
      from(w in Withdrawal,
        where: w.promoter_id == ^user_id and w.status in ["requested", "paid"],
        select: %{
          requested: filter(sum(w.amount), w.status == "requested"),
          paid: filter(sum(w.amount), w.status == "paid")
        }
      )
      |> Repo.one()

    d = &(&1 || Decimal.new(0))
    matured = d.(commission_totals.matured)
    requested = d.(withdrawals.requested)
    paid = d.(withdrawals.paid)

    %{
      total_earned: d.(commission_totals.total),
      pending: d.(commission_totals.pending),
      available: matured |> Decimal.sub(requested) |> Decimal.sub(paid) |> Decimal.max(0),
      in_withdrawal: requested,
      withdrawn: paid,
      this_month: d.(commission_totals.this_month),
      minimum_withdrawal: @min_withdrawal
    }
  end

  defp start_of_month(%DateTime{} = now), do: %{now | day: 1, hour: 0, minute: 0, second: 0, microsecond: {0, 6}}

  @doc """
  Requests a payout to M-Pesa. The promoter's profile row is locked for the
  duration, so two simultaneous requests can't both spend the same balance.
  """
  def request_withdrawal(%User{} = user, params) do
    with {:ok, amount} <- parse_amount(params["amount"]) do
      Repo.transaction(fn ->
        profile =
          Repo.one(from p in Profile, where: p.user_id == ^user.id and p.status == "approved", lock: "FOR UPDATE") ||
            Repo.rollback(:promoter_not_approved)

        phone = Klix.Phone.normalize(params["phone"]) || profile.payout_phone || user.phone_number
        %{available: available} = earnings(user)

        cond do
          not Klix.Phone.valid?(phone) ->
            Repo.rollback({:validation, "A valid M-Pesa number is required"})

          Decimal.lt?(amount, @min_withdrawal) ->
            Repo.rollback({:validation, "The minimum withdrawal is KES #{@min_withdrawal}"})

          Decimal.gt?(amount, available) ->
            Repo.rollback({:validation, "You can withdraw up to KES #{Decimal.round(available, 2)}"})

          true ->
            Repo.insert!(%Withdrawal{promoter_id: user.id, amount: amount, phone: phone})
        end
      end)
    end
  end

  defp parse_amount(value) do
    case value && Decimal.parse(to_string(value)) do
      {amount, ""} -> {:ok, Decimal.round(amount, 2)}
      _ -> {:error, {:validation, "Enter an amount"}}
    end
  end

  def list_withdrawals(%User{id: user_id}, limit \\ 50) do
    Repo.all(from w in Withdrawal, where: w.promoter_id == ^user_id, order_by: [desc: w.inserted_at], limit: ^limit)
  end

  def list_all_withdrawals(params) do
    from(w in Withdrawal, order_by: [desc: w.inserted_at], preload: [:promoter])
    |> filter_status(params["status"])
    |> Repo.paginate(params)
  end

  def get_withdrawal(id) do
    case cast_id(id) do
      {:ok, id} -> Repo.get(Withdrawal, id)
      :error -> nil
    end
  end

  def mark_withdrawal_paid(%Withdrawal{status: "requested"} = w, %User{} = admin, reference) do
    w
    |> Ecto.Changeset.change(status: "paid", reference: reference, processed_at: DateTime.utc_now(), processed_by_id: admin.id)
    |> Repo.update()
  end

  def mark_withdrawal_paid(_, _, _), do: {:error, {:validation, "Only requested withdrawals can be marked paid"}}

  def reject_withdrawal(%Withdrawal{status: "requested"} = w, %User{} = admin, note) do
    w
    |> Ecto.Changeset.change(status: "rejected", note: note, processed_at: DateTime.utc_now(), processed_by_id: admin.id)
    |> Repo.update()
  end

  def reject_withdrawal(_, _, _), do: {:error, {:validation, "Only requested withdrawals can be rejected"}}

  ## Leaderboard and dashboard

  def leaderboard(params \\ %{}) do
    limit = params |> Map.get("limit", "20") |> to_string() |> Integer.parse() |> case do
      {n, _} -> n |> max(1) |> min(100)
      _ -> 20
    end

    since =
      case params["period"] do
        "week" -> DateTime.add(DateTime.utc_now(), -7 * 86_400, :second)
        "month" -> DateTime.add(DateTime.utc_now(), -30 * 86_400, :second)
        _ -> nil
      end

    Klix.Cache.fetch({:promoter_leaderboard, params["period"], limit}, :timer.minutes(2), fn ->
      from(cm in Commission,
        join: p in Profile,
        on: p.user_id == cm.promoter_id,
        where: cm.status == "earned",
        group_by: [cm.promoter_id, p.display_name],
        order_by: [desc: sum(cm.tickets)],
        limit: ^limit,
        select: %{
          promoter_id: cm.promoter_id,
          display_name: p.display_name,
          tickets_sold: sum(cm.tickets),
          revenue_generated: sum(cm.order_amount),
          total_commission: sum(cm.amount)
        }
      )
      |> then(fn q -> if since, do: where(q, [cm], cm.inserted_at >= ^since), else: q end)
      |> Repo.all()
      |> Enum.with_index(1)
      |> Enum.map(fn {row, rank} -> Map.put(row, :rank, rank) end)
    end)
  end

  def dashboard(%User{} = user) do
    codes = list_codes(user)
    now = DateTime.utc_now()
    month_start = start_of_month(now)
    last_month_start = start_of_month(DateTime.add(month_start, -86_400, :second))

    monthly =
      from(cm in Commission,
        where: cm.promoter_id == ^user.id and cm.status == "earned" and cm.inserted_at >= ^last_month_start,
        select: %{
          commission_this_month: filter(sum(cm.amount), cm.inserted_at >= ^month_start),
          commission_last_month: filter(sum(cm.amount), cm.inserted_at < ^month_start),
          tickets_this_month: filter(sum(cm.tickets), cm.inserted_at >= ^month_start),
          tickets_last_month: filter(sum(cm.tickets), cm.inserted_at < ^month_start)
        }
      )
      |> Repo.one()

    top_events =
      from(cm in Commission,
        join: e in assoc(cm, :event),
        where: cm.promoter_id == ^user.id and cm.status == "earned",
        group_by: [e.id, e.title, e.slug, e.start_datetime],
        order_by: [desc: sum(cm.tickets)],
        limit: 5,
        select: %{
          event_id: e.id,
          event_name: e.title,
          event_slug: e.slug,
          event_date: e.start_datetime,
          tickets_sold: sum(cm.tickets),
          revenue_generated: sum(cm.order_amount),
          commission_earned: sum(cm.amount)
        }
      )
      |> Repo.all()

    zero = Decimal.new(0)

    %{
      total_codes: length(codes),
      active_codes: Enum.count(codes, & &1.is_active),
      total_clicks: Enum.sum(Enum.map(codes, & &1.clicks)),
      total_uses: Enum.sum(Enum.map(codes, & &1.times_used)),
      total_tickets_sold: Enum.sum(Enum.map(codes, & &1.stats.tickets_sold)),
      total_revenue_generated: Enum.reduce(codes, zero, &Decimal.add(&1.stats.revenue_generated || zero, &2)),
      commission_this_month: monthly.commission_this_month || zero,
      commission_last_month: monthly.commission_last_month || zero,
      tickets_this_month: monthly.tickets_this_month || 0,
      tickets_last_month: monthly.tickets_last_month || 0,
      earnings: earnings(user),
      top_events: top_events
    }
  end

  ## Helpers

  defp filter_status(query, status) when status in [nil, ""], do: query
  defp filter_status(query, status), do: where(query, [x], x.status == ^status)

  defp cast_id(nil), do: :error
  defp cast_id(id), do: Ecto.UUID.cast(id)
end
