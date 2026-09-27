defmodule KlixWeb.TicketController do
  use KlixWeb, :controller

  alias Klix.{Staff, Tickets}
  alias KlixWeb.JSON

  def index(conn, params) do
    tickets = Tickets.list_user_tickets(current_user(conn), params)
    json(conn, Enum.map(tickets, &JSON.ticket/1))
  end

  def show(conn, %{"id" => id}) do
    user = current_user(conn)

    with %{} = ticket <- Tickets.get_ticket(id),
         true <- Tickets.owns?(ticket, user) or Staff.can_scan?(user, ticket.event_id) do
      json(conn, JSON.ticket(ticket))
    else
      _ -> {:error, {:not_found, "Ticket not found"}}
    end
  end

  def validate_qr(conn, params) do
    with {:ok, event_id} <- authorize_door(conn, params) do
      result = Tickets.validate(params["qr_data"], event_id)
      json(conn, door_response(result, "Valid ticket"))
    end
  end

  def checkin(conn, params) do
    with {:ok, event_id} <- authorize_door(conn, params) do
      result = Tickets.check_in(params["qr_data"], event_id, current_user(conn), params["location"])
      status = if match?({:ok, _}, result), do: 200, else: 409
      conn |> put_status(status) |> json(door_response(result, "Checked in"))
    end
  end

  def checkin_stats(conn, %{"event_id" => event_id}) do
    with {:ok, event_id} <- authorize_door(conn, %{"event_id" => event_id}) do
      ok(conn, Tickets.checkin_stats(event_id))
    end
  end

  defp authorize_door(conn, params) do
    with {:ok, event_id} <- Ecto.UUID.cast(params["event_id"] || ""),
         true <- Staff.can_scan?(current_user(conn), event_id) do
      {:ok, event_id}
    else
      :error -> {:error, {:validation, "event_id is required"}}
      false -> {:error, :forbidden}
    end
  end

  # Scanners get a flat, easy-to-render answer for every outcome.
  defp door_response({:ok, ticket}, message) do
    %{valid: true, success: true, message: message, ticket: JSON.ticket(ticket)}
  end

  defp door_response({:error, reason, ticket}, _message) do
    message =
      case reason do
        :invalid_qr -> "Not a Klix ticket"
        :not_found -> "Ticket not found"
        :wrong_event -> "This ticket is for a different event"
        :already_used -> "Already checked in"
        :not_valid -> "Ticket is not valid (#{ticket.status})"
      end

    %{
      valid: false,
      success: false,
      reason: reason,
      message: message,
      detail: message,
      ticket: ticket && JSON.ticket(ticket)
    }
  end
end
