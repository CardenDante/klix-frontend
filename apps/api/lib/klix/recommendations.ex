defmodule Klix.Recommendations do
  @moduledoc """
  Event discovery without a separate ML service: signals come straight from
  sales (what's selling now), categories a user has bought before, their
  saved preferences, and location.
  """

  import Ecto.Query
  alias Klix.{Cache, Events, Repo}
  alias Klix.Accounts.User
  alias Klix.Events.Event
  alias Klix.Orders.Ticket

  @ttl :timer.minutes(2)

  defp limit_param(params, default \\ 10) do
    case Integer.parse(to_string(params["limit"] || default)) do
      {n, _} when n > 0 -> min(n, 50)
      _ -> default
    end
  end

  @doc "Upcoming events ordered by tickets sold in the last 7 days."
  def trending(params \\ %{}) do
    limit = limit_param(params)
    category = params["category"]

    Cache.fetch({:recs, :trending, limit, category}, @ttl, fn ->
      since = DateTime.add(DateTime.utc_now(), -7 * 86_400, :second)

      recent =
        from(t in Ticket,
          where: t.status in ["confirmed", "used"] and t.purchased_at >= ^since,
          group_by: t.event_id,
          select: %{event_id: t.event_id, recent: count(t.id)}
        )

      Events.upcoming_public_query()
      |> join(:left, [event: e], r in subquery(recent), on: r.event_id == e.id, as: :recent)
      |> maybe_category(category)
      |> order_by([recent: r, event: e], desc_nulls_last: r.recent, asc: e.start_datetime)
      |> limit(^limit)
      |> Repo.all()
    end)
  end

  @doc "Upcoming events ordered by total tickets sold."
  def popular(params \\ %{}) do
    limit = limit_param(params)

    Cache.fetch({:recs, :popular, limit, params["category"]}, @ttl, fn ->
      Events.upcoming_public_query()
      |> maybe_category(params["category"])
      |> order_by([inventory: i, event: e], desc_nulls_last: i.sold, asc: e.start_datetime)
      |> limit(^limit)
      |> Repo.all()
    end)
  end

  @doc "Other upcoming events in the same category or by the same organizer."
  def similar(event_id, limit \\ 6) do
    with {:ok, event_id} <- Ecto.UUID.cast(event_id),
         %Event{} = event <- Repo.get(Event, event_id) do
      Cache.fetch({:recs, :similar, event_id, limit}, @ttl, fn ->
        Events.upcoming_public_query()
        |> where([event: e], e.id != ^event.id)
        |> where([event: e], e.category == ^event.category or e.organizer_id == ^event.organizer_id)
        |> order_by([event: e],
          desc: e.organizer_id == ^event.organizer_id,
          asc: e.start_datetime
        )
        |> limit(^limit)
        |> Repo.all()
      end)
    else
      _ -> []
    end
  end

  @doc """
  Personal picks: categories the user has bought before plus the ones they
  saved as preferences, excluding events they already have tickets for.
  """
  def for_you(%User{} = user, params \\ %{}) do
    limit = limit_param(params)

    bought =
      Repo.all(
        from t in Ticket,
          join: e in assoc(t, :event),
          where: t.user_id == ^user.id and t.status in ["confirmed", "used"],
          group_by: e.category,
          order_by: [desc: count(t.id)],
          select: e.category
      )

    preferred = List.wrap((user.preferences || %{})["preferred_categories"])
    categories = Enum.uniq(bought ++ preferred)

    owned =
      from t in Ticket,
        where: t.user_id == ^user.id and t.status in ["confirmed", "used"],
        select: t.event_id

    picks =
      if categories == [] do
        []
      else
        Events.upcoming_public_query()
        |> where([event: e], e.category in ^categories)
        |> where([event: e], e.id not in subquery(owned))
        |> order_by([inventory: i, event: e], desc_nulls_last: i.sold, asc: e.start_datetime)
        |> limit(^limit)
        |> Repo.all()
      end

    # Top up with what's trending so the section is never empty.
    if length(picks) < limit do
      ids = MapSet.new(picks, & &1.id)
      picks ++ (trending(%{"limit" => limit * 2}) |> Enum.reject(&MapSet.member?(ids, &1.id)) |> Enum.take(limit - length(picks)))
    else
      picks
    end
  end

  @doc "Sections for a discovery page."
  def discovery(user \\ nil) do
    now = DateTime.utc_now()
    {weekend_start, weekend_end} = next_weekend(now)

    %{
      trending: trending(%{"limit" => 8}),
      this_weekend:
        Cache.fetch({:recs, :weekend, Date.to_iso8601(DateTime.to_date(weekend_start))}, @ttl, fn ->
          Events.upcoming_public_query()
          |> where([event: e], e.start_datetime >= ^weekend_start and e.start_datetime < ^weekend_end)
          |> order_by([event: e], asc: e.start_datetime)
          |> limit(8)
          |> Repo.all()
        end),
      free:
        Cache.fetch({:recs, :free}, @ttl, fn ->
          Events.upcoming_public_query()
          |> where([inventory: i], i.min_price == 0)
          |> order_by([event: e], asc: e.start_datetime)
          |> limit(8)
          |> Repo.all()
        end),
      for_you: if(user, do: for_you(user, %{"limit" => 8}), else: [])
    }
  end

  # Friday 17:00 to Monday 00:00, Nairobi time (UTC+3).
  defp next_weekend(now) do
    local = DateTime.add(now, 3 * 3600, :second) |> DateTime.to_date()
    days_to_friday = rem(5 - Date.day_of_week(local) + 7, 7)
    friday = Date.add(local, if(Date.day_of_week(local) in [6, 7], do: -(Date.day_of_week(local) - 5), else: days_to_friday))
    start = DateTime.new!(friday, ~T[14:00:00], "Etc/UTC")
    {start, DateTime.add(start, 58 * 3600, :second)}
  end

  ## Search helpers

  @doc "Typeahead: matching event titles, locations and categories."
  def suggestions(q, limit \\ 8) when is_binary(q) do
    term = String.trim(q)

    if String.length(term) < 2 do
      []
    else
      like = "%" <> String.replace(term, ~r/([\\%_])/, "\\\\\\1") <> "%"

      events =
        Events.upcoming_public_query()
        |> where([event: e], ilike(e.title, ^like))
        |> order_by([event: e], asc: e.start_datetime)
        |> limit(^limit)
        |> Repo.all()
        |> Enum.map(&%{type: "event", value: &1.slug, label: &1.title})

      locations =
        Repo.all(
          from e in Event,
            where: e.status == "published" and ilike(e.location, ^like),
            distinct: true,
            limit: 3,
            select: e.location
        )
        |> Enum.map(&%{type: "location", value: &1, label: &1})

      categories =
        Event.categories()
        |> Enum.filter(&String.contains?(&1, String.downcase(term)))
        |> Enum.map(&%{type: "category", value: &1, label: &1})

      events ++ locations ++ categories
    end
  end

  def suggestions(_, _), do: []

  @doc "How many upcoming events each category has."
  def facets do
    Cache.fetch({:recs, :facets}, @ttl, fn ->
      now = DateTime.utc_now()

      Repo.all(
        from e in Event,
          where: e.status == "published" and is_nil(e.flagged_at) and e.end_datetime > ^now,
          group_by: e.category,
          order_by: [desc: count(e.id)],
          select: %{field: "category", value: e.category, count: count(e.id)}
      )
    end)
  end

  @doc "Upcoming events within `radius_km` of a point, nearest first."
  def nearby(params) do
    with {lat, _} <- Float.parse(to_string(params["latitude"] || "")),
         {lng, _} <- Float.parse(to_string(params["longitude"] || "")) do
      radius =
        case Float.parse(to_string(params["radius_km"] || "25")) do
          {r, _} when r > 0 -> min(r, 200.0)
          _ -> 25.0
        end

      distance =
        dynamic(
          [event: e],
          fragment(
            "6371 * acos(least(1.0, cos(radians(?)) * cos(radians(?)) * cos(radians(?) - radians(?)) + sin(radians(?)) * sin(radians(?))))",
            ^lat,
            e.latitude,
            e.longitude,
            ^lng,
            ^lat,
            e.latitude
          )
        )

      Events.upcoming_public_query()
      |> where([event: e], not is_nil(e.latitude) and not is_nil(e.longitude))
      |> where(^dynamic([event: e], ^distance <= ^radius))
      |> order_by(^[asc: distance])
      |> limit(^limit_param(params, 20))
      |> Repo.all()
    else
      _ -> {:error, {:validation, "latitude and longitude are required"}}
    end
  end

  defp maybe_category(query, c) when c in [nil, ""], do: query
  defp maybe_category(query, c), do: where(query, [event: e], e.category == ^c)
end
