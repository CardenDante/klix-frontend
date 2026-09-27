defmodule KlixWeb.TicketTypeController do
  use KlixWeb, :controller

  alias Klix.Events
  alias KlixWeb.JSON

  def index(conn, %{"event_id" => event_id} = params) do
    with {:ok, event_id} <- cast_id(event_id) do
      include_inactive? =
        params["include_inactive"] in ["true", "1"] and can_manage_event?(conn, event_id)

      types = Events.list_ticket_types(event_id, include_inactive: include_inactive?)
      json(conn, Enum.map(types, &JSON.ticket_type/1))
    end
  end

  def create(conn, %{"event_id" => event_id} = params) do
    with {:ok, event_id} <- cast_id(event_id),
         %{} = event <- Events.get_event(event_id),
         true <- Events.can_manage?(current_user(conn), event) || {:error, :forbidden},
         {:ok, ticket_type} <- Events.create_ticket_type(event, params) do
      conn |> put_status(201) |> json(JSON.ticket_type(ticket_type))
    end
  end

  def update(conn, %{"id" => id} = params) do
    with {:ok, ticket_type} <- fetch_managed(conn, id),
         {:ok, ticket_type} <- Events.update_ticket_type(ticket_type, Map.drop(params, ["id"])) do
      json(conn, JSON.ticket_type(ticket_type))
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, ticket_type} <- fetch_managed(conn, id),
         {:ok, _} <- Events.delete_ticket_type(ticket_type) do
      json(conn, %{success: true, message: "Ticket type removed"})
    end
  end

  defp fetch_managed(conn, id) do
    case Events.get_ticket_type(id) do
      nil ->
        {:error, {:not_found, "Ticket type not found"}}

      ticket_type ->
        if Events.can_manage?(current_user(conn), ticket_type.event),
          do: {:ok, ticket_type},
          else: {:error, :forbidden}
    end
  end

  defp can_manage_event?(conn, event_id) do
    with %{} = user <- current_user(conn),
         %{} = event <- Events.get_event(event_id) do
      Events.can_manage?(user, event)
    else
      _ -> false
    end
  end

  defp cast_id(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> {:ok, id}
      :error -> {:error, {:not_found, "Event not found"}}
    end
  end
end
