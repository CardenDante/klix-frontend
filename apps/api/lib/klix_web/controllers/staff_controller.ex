defmodule KlixWeb.StaffController do
  use KlixWeb, :controller

  alias Klix.{Events, Staff}
  alias KlixWeb.JSON

  def mine(conn, _params) do
    assignments = Staff.list_for_user(current_user(conn))
    json(conn, %{success: true, assignments: Enum.map(assignments, &JSON.staff_assignment/1)})
  end

  def index(conn, %{"event_id" => event_id} = params) do
    with {:ok, event} <- fetch_managed_event(conn, event_id) do
      staff = Staff.list_for_event(event.id, include_inactive: params["include_inactive"] == "true")
      json(conn, %{success: true, staff: Enum.map(staff, &JSON.staff_assignment/1)})
    end
  end

  def create(conn, %{"event_id" => event_id} = params) do
    with {:ok, event} <- fetch_managed_event(conn, event_id),
         {:ok, assignment} <- Staff.assign(event, current_user(conn), params) do
      conn |> put_status(201) |> json(JSON.staff_assignment(assignment))
    end
  end

  def update(conn, %{"event_id" => event_id, "id" => id} = params) do
    with {:ok, event} <- fetch_managed_event(conn, event_id),
         %{} = assignment <- Staff.get_assignment(event.id, id),
         {:ok, assignment} <- Staff.update_assignment(assignment, params) do
      json(conn, JSON.staff_assignment(assignment))
    end
  end

  def delete(conn, %{"event_id" => event_id, "id" => id}) do
    with {:ok, event} <- fetch_managed_event(conn, event_id),
         %{} = assignment <- Staff.get_assignment(event.id, id),
         {:ok, _} <- Staff.remove_assignment(assignment) do
      json(conn, %{success: true, message: "Staff member removed"})
    end
  end

  defp fetch_managed_event(conn, event_id) do
    case Events.get_event(event_id) do
      nil ->
        {:error, {:not_found, "Event not found"}}

      event ->
        if Events.can_manage?(current_user(conn), event), do: {:ok, event}, else: {:error, :forbidden}
    end
  end
end
