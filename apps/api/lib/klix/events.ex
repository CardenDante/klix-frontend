defmodule Klix.Events do
  @moduledoc "Events and their ticket types."

  import Ecto.Query
  alias Klix.Repo
  alias Klix.Cache
  alias Klix.Accounts.{User, Organizer}
  alias Klix.Events.{Event, TicketType}

  @public_cache_ttl :timer.seconds(5)

  ## Queries

  defp inventory_subquery do
    from tt in TicketType,
      where: tt.is_active,
      group_by: tt.event_id,
      select: %{
        event_id: tt.event_id,
        total: sum(tt.quantity_total),
        sold: sum(tt.quantity_sold),
        reserved: sum(tt.quantity_reserved),
        min_price: min(tt.price)
      }
  end

  defp with_inventory(query) do
    from e in query,
      left_join: inv in subquery(inventory_subquery()),
      on: inv.event_id == e.id,
      as: :inventory,
      select_merge: %{
        total_capacity: coalesce(inv.total, 0),
        tickets_sold: coalesce(inv.sold, 0),
        tickets_available: coalesce(inv.total - inv.sold - inv.reserved, 0),
        min_price: inv.min_price
      }
  end

  # Events flagged by moderators disappear from public pages until cleared.
  defp public_events do
    from e in Event,
      as: :event,
      where: e.status == "published" and is_nil(e.flagged_at),
      preload: [:organizer]
  end

  @doc "Published, upcoming, unflagged events with inventory totals (a base for other queries)."
  def upcoming_public_query do
    public_events() |> with_inventory() |> filter_upcoming(nil)
  end

  @doc """
  Lists published events. Supports the same filters as the old API:
  `q`, `category`, `location`, `start_date`, `end_date`, `min_price`,
  `max_price`, `sort_by`, `page`, `page_size`, and `include_past`.
  """
  def list_public_events(params) do
    public_events()
    |> with_inventory()
    |> filter_upcoming(params["include_past"])
    |> filter_search(params["q"])
    |> filter_category(params["category"])
    |> filter_location(params["location"])
    |> filter_date(:start, params["start_date"])
    |> filter_date(:end, params["end_date"])
    |> filter_price(:min, params["min_price"])
    |> filter_price(:max, params["max_price"])
    |> filter_organizer(params["organizer_id"])
    |> sort(params["sort_by"], params["q"])
    |> Repo.paginate(params)
  end

  defp filter_upcoming(query, include_past) when include_past in ["true", true], do: query

  defp filter_upcoming(query, _) do
    now = DateTime.utc_now()
    where(query, [event: e], e.end_datetime > ^now)
  end

  defp filter_search(query, q) when q in [nil, ""], do: query

  defp filter_search(query, q) do
    case prefix_tsquery(q) do
      nil ->
        query

      tsquery ->
        where(query, [event: e], fragment("? @@ to_tsquery('simple', ?)", e.search_vector, ^tsquery))
    end
  end

  # "nairobi jaz" becomes "nairobi:* & jaz:*" so partially typed words match,
  # and the query can still use the GIN index.
  defp prefix_tsquery(q) when is_binary(q) do
    q
    |> String.downcase()
    |> String.split(~r/[^[:alnum:]]+/u, trim: true)
    |> Enum.take(8)
    |> case do
      [] -> nil
      words -> Enum.map_join(words, " & ", &(&1 <> ":*"))
    end
  end

  defp prefix_tsquery(_), do: nil

  defp filter_category(query, c) when c in [nil, ""], do: query
  defp filter_category(query, c), do: where(query, [event: e], e.category == ^c)

  defp filter_location(query, l) when l in [nil, ""], do: query

  defp filter_location(query, l),
    do: where(query, [event: e], ilike(e.location, ^"%#{escape_like(l)}%"))

  defp filter_organizer(query, id) when id in [nil, ""], do: query
  defp filter_organizer(query, id), do: where(query, [event: e], e.organizer_id == ^id)

  defp filter_date(query, _side, value) when value in [nil, ""], do: query

  defp filter_date(query, side, value) do
    case parse_date_boundary(value, side) do
      {:ok, dt} when side == :start -> where(query, [event: e], e.start_datetime >= ^dt)
      {:ok, dt} when side == :end -> where(query, [event: e], e.start_datetime <= ^dt)
      :error -> query
    end
  end

  defp parse_date_boundary(value, side) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} ->
        {:ok, dt}

      _ ->
        case Date.from_iso8601(value) do
          {:ok, date} ->
            time = if side == :start, do: ~T[00:00:00], else: ~T[23:59:59.999999]
            {:ok, DateTime.new!(date, time, "Etc/UTC")}

          _ ->
            :error
        end
    end
  end

  defp filter_price(query, _bound, value) when value in [nil, ""], do: query

  defp filter_price(query, bound, value) do
    case Decimal.parse(to_string(value)) do
      {price, ""} when bound == :min ->
        where(query, [inventory: inv], inv.min_price >= ^price)

      {price, ""} when bound == :max ->
        where(query, [inventory: inv], inv.min_price <= ^price)

      _ ->
        query
    end
  end

  defp sort(query, "date_desc", _), do: order_by(query, [event: e], desc: e.start_datetime)
  defp sort(query, "newest", _), do: order_by(query, [event: e], desc: e.published_at)

  defp sort(query, "price_asc", _),
    do: order_by(query, [inventory: inv], asc_nulls_last: inv.min_price)

  defp sort(query, "price_desc", _),
    do: order_by(query, [inventory: inv], desc_nulls_last: inv.min_price)

  defp sort(query, "popularity", _),
    do: order_by(query, [inventory: inv], desc_nulls_last: inv.sold)

  defp sort(query, "relevance", q) when is_binary(q) do
    case prefix_tsquery(q) do
      nil ->
        sort(query, nil, nil)

      tsquery ->
        order_by(query, [event: e],
          desc: fragment("ts_rank(?, to_tsquery('simple', ?))", e.search_vector, ^tsquery),
          asc: e.start_datetime
        )
    end
  end

  defp sort(query, _, _), do: order_by(query, [event: e], asc: e.start_datetime, asc: e.id)

  defp escape_like(term), do: String.replace(term, ~r/([\\%_])/, "\\\\\\1")

  @doc "A published event by slug (or id), cached briefly for traffic spikes."
  def get_public_event(slug_or_id) do
    Cache.fetch({:public_event, slug_or_id}, @public_cache_ttl, fn ->
      public_events()
      |> with_inventory()
      |> where_slug_or_id(slug_or_id)
      |> Repo.one()
    end)
  end

  defp where_slug_or_id(query, value) do
    case Ecto.UUID.cast(value) do
      {:ok, id} -> where(query, [event: e], e.id == ^id)
      :error -> where(query, [event: e], e.slug == ^value)
    end
  end

  @doc "Any event (any status) with inventory totals, for owners and admins."
  def get_event(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} ->
        from(e in Event, as: :event, where: e.id == ^id, preload: [:organizer])
        |> with_inventory()
        |> Repo.one()

      :error ->
        nil
    end
  end

  def get_event_by_slug(slug) do
    from(e in Event, as: :event, where: e.slug == ^slug, preload: [:organizer])
    |> with_inventory()
    |> Repo.one()
  end

  def list_organizer_events(%Organizer{id: organizer_id}, params) do
    from(e in Event, as: :event, where: e.organizer_id == ^organizer_id, preload: [:organizer])
    |> with_inventory()
    |> then(fn q ->
      case params["status"] do
        s when s in [nil, ""] -> q
        s -> where(q, [event: e], e.status == ^s)
      end
    end)
    |> order_by([event: e], desc: e.start_datetime)
    |> Repo.paginate(params)
  end

  ## Authorization

  @doc "Admins, and the organizer who owns the event, can manage it."
  def can_manage?(%User{role: "admin"}, _event), do: true

  def can_manage?(%User{id: user_id}, %Event{organizer: %Organizer{user_id: owner_id}}),
    do: user_id == owner_id

  def can_manage?(%User{} = user, %Event{} = event),
    do: can_manage?(user, Repo.preload(event, :organizer))

  def can_manage?(_, _), do: false

  ## Commands

  def create_event(%Organizer{status: "approved"} = organizer, attrs) do
    %Event{organizer_id: organizer.id}
    |> Event.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, event} -> {:ok, get_event(event.id)}
      error -> error
    end
  end

  def create_event(%Organizer{}, _attrs), do: {:error, :organizer_not_approved}

  def update_event(%Event{} = event, attrs) do
    event
    |> Event.changeset(attrs)
    |> Repo.update()
    |> after_change()
  end

  def publish_event(%Event{} = event) do
    event = Repo.preload(event, [:organizer, :ticket_types], force: true)

    cond do
      event.organizer.status != "approved" ->
        {:error, :organizer_not_approved}

      not Enum.any?(event.ticket_types, & &1.is_active) ->
        {:error, :no_ticket_types}

      DateTime.compare(event.end_datetime, DateTime.utc_now()) != :gt ->
        {:error, :event_in_past}

      true ->
        event |> Event.status_changeset("published") |> Repo.update() |> after_change()
    end
  end

  def unpublish_event(%Event{} = event) do
    event |> Event.status_changeset("draft") |> Repo.update() |> after_change()
  end

  def cancel_event(%Event{} = event) do
    event |> Event.status_changeset("cancelled") |> Repo.update() |> after_change()
  end

  @doc "Only events that never took an order can be deleted; others are cancelled."
  def delete_event(%Event{} = event) do
    has_orders? = Repo.exists?(from o in Klix.Orders.Order, where: o.event_id == ^event.id)

    if has_orders? do
      {:error, :has_orders}
    else
      Repo.transaction(fn ->
        Repo.delete_all(from tt in TicketType, where: tt.event_id == ^event.id)
        Repo.delete!(event)
      end)
      |> tap(fn _ -> invalidate(event) end)
    end
  end

  defp after_change({:ok, %Event{} = event}) do
    invalidate(event)
    {:ok, get_event(event.id)}
  end

  defp after_change(error), do: error

  def invalidate(%Event{id: id, slug: slug}) do
    Cache.delete({:public_event, id})
    Cache.delete({:public_event, slug})
    Cache.delete({:ticket_types, id})
  end

  def invalidate_event_id(event_id) do
    case Repo.get(Event, event_id) do
      nil -> Cache.delete({:ticket_types, event_id})
      event -> invalidate(event)
    end
  end

  ## Moderation (admins)

  def list_all_events(params) do
    from(e in Event, as: :event, preload: [:organizer])
    |> with_inventory()
    |> filter_search(params["q"])
    |> then(fn q ->
      case params["status"] do
        st when st in [nil, ""] -> q
        st -> where(q, [event: e], e.status == ^st)
      end
    end)
    |> then(fn q -> if params["flagged"] == "true", do: where(q, [event: e], not is_nil(e.flagged_at)), else: q end)
    |> order_by([event: e], desc: e.inserted_at)
    |> Repo.paginate(params)
  end

  @doc "Hides an event from public pages until an admin clears it."
  def flag_event(%Event{} = event, reason) do
    event
    |> Ecto.Changeset.change(flagged_at: DateTime.utc_now(), flag_reason: reason)
    |> Repo.update()
    |> after_change()
  end

  def unflag_event(%Event{} = event) do
    event
    |> Ecto.Changeset.change(flagged_at: nil, flag_reason: nil)
    |> Repo.update()
    |> after_change()
  end

  ## Ticket types

  def list_ticket_types(event_id, opts \\ []) do
    include_inactive? = Keyword.get(opts, :include_inactive, false)

    fetch = fn ->
      from(tt in TicketType,
        where: tt.event_id == ^event_id,
        order_by: [asc: tt.sort_order, asc: tt.price, asc: tt.inserted_at]
      )
      |> then(fn q -> if include_inactive?, do: q, else: where(q, [tt], tt.is_active) end)
      |> Repo.all()
    end

    if include_inactive?,
      do: fetch.(),
      else: Cache.fetch({:ticket_types, event_id}, @public_cache_ttl, fetch)
  end

  def get_ticket_type(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> TicketType |> Repo.get(id) |> Repo.preload(event: :organizer)
      :error -> nil
    end
  end

  def create_ticket_type(%Event{} = event, attrs) do
    %TicketType{event_id: event.id}
    |> TicketType.changeset(attrs)
    |> Repo.insert()
    |> tap(fn _ -> invalidate(event) end)
  end

  def update_ticket_type(%TicketType{} = ticket_type, attrs) do
    ticket_type
    |> TicketType.changeset(attrs)
    |> Repo.update()
    |> tap(fn _ -> invalidate_event_id(ticket_type.event_id) end)
  end

  @doc "Ticket types that already sold tickets are deactivated instead of deleted."
  def delete_ticket_type(%TicketType{} = ticket_type) do
    in_use? =
      Repo.exists?(from i in Klix.Orders.OrderItem, where: i.ticket_type_id == ^ticket_type.id)

    result =
      if in_use?,
        do: ticket_type |> Ecto.Changeset.change(is_active: false) |> Repo.update(),
        else: Repo.delete(ticket_type)

    invalidate_event_id(ticket_type.event_id)
    result
  end
end
