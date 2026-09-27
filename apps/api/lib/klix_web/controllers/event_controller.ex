defmodule KlixWeb.EventController do
  use KlixWeb, :controller

  alias Klix.{Accounts, Events}
  alias KlixWeb.JSON

  # Public listing and detail responses may be cached by CDNs briefly.
  @public_cache "public, max-age=10, stale-while-revalidate=30"

  def index(conn, params) do
    {events, meta} = Events.list_public_events(params)

    conn
    |> put_resp_header("cache-control", @public_cache)
    |> json(JSON.paginated(events, meta, &JSON.event/1))
  end

  def show_by_slug(conn, %{"slug" => slug}), do: show_event(conn, slug)
  def show(conn, %{"id" => id}), do: show_event(conn, id)

  # Published events are public. Owners and admins can also preview drafts.
  defp show_event(conn, slug_or_id) do
    case Events.get_public_event(slug_or_id) do
      nil ->
        user = current_user(conn)

        event =
          user &&
            (Events.get_event(slug_or_id) || Events.get_event_by_slug(slug_or_id))

        if event && Events.can_manage?(user, event),
          do: conn |> put_resp_header("cache-control", "private, no-store") |> json(JSON.event(event)),
          else: {:error, {:not_found, "Event not found"}}

      event ->
        conn |> put_resp_header("cache-control", @public_cache) |> json(JSON.event(event))
    end
  end

  def mine(conn, params) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil ->
        json(conn, JSON.paginated([], %{total: 0, page: 1, page_size: 20, total_pages: 1}, & &1))

      organizer ->
        {events, meta} = Events.list_organizer_events(organizer, params)
        json(conn, JSON.paginated(events, meta, &JSON.event/1))
    end
  end

  def create(conn, params) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil ->
        {:error, :organizer_not_approved}

      organizer ->
        with {:ok, event} <- Events.create_event(organizer, params) do
          conn |> put_status(201) |> json(JSON.event(event))
        end
    end
  end

  def update(conn, %{"id" => id} = params) do
    with {:ok, event} <- fetch_managed(conn, id),
         {:ok, event} <- Events.update_event(event, Map.drop(params, ["id"])) do
      json(conn, JSON.event(event))
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, event} <- fetch_managed(conn, id),
         {:ok, _} <- Events.delete_event(event) do
      json(conn, %{success: true, message: "Event deleted"})
    end
  end

  def publish(conn, %{"id" => id}), do: transition(conn, id, &Events.publish_event/1)
  def unpublish(conn, %{"id" => id}), do: transition(conn, id, &Events.unpublish_event/1)
  def cancel(conn, %{"id" => id}), do: transition(conn, id, &Events.cancel_event/1)

  defp transition(conn, id, fun) do
    with {:ok, event} <- fetch_managed(conn, id),
         {:ok, event} <- fun.(event) do
      json(conn, JSON.event(event))
    end
  end

  defp fetch_managed(conn, id) do
    case Events.get_event(id) do
      nil ->
        {:error, {:not_found, "Event not found"}}

      event ->
        if Events.can_manage?(current_user(conn), event), do: {:ok, event}, else: {:error, :forbidden}
    end
  end
end
