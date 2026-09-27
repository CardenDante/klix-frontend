defmodule KlixWeb.AdminController do
  use KlixWeb, :controller

  alias Klix.Accounts
  alias KlixWeb.JSON

  def list_organizers(conn, params) do
    {organizers, meta} = Accounts.list_organizers(params)
    json(conn, JSON.paginated(organizers, meta, &JSON.organizer/1))
  end

  def pending_organizers(conn, params) do
    list_organizers(conn, Map.put(params, "status", "pending"))
  end

  def approve_organizer(conn, %{"id" => id}) do
    with %{} = organizer <- fetch(id),
         {:ok, organizer} <- Accounts.approve_organizer(organizer, current_user(conn)) do
      ok(conn, JSON.organizer(organizer), "Organizer approved")
    end
  end

  def reject_organizer(conn, %{"id" => id} = params) do
    with %{} = organizer <- fetch(id),
         {:ok, organizer} <- Accounts.reject_organizer(organizer, params["reason"]) do
      ok(conn, JSON.organizer(organizer), "Organizer rejected")
    end
  end

  def suspend_organizer(conn, %{"id" => id} = params) do
    with %{} = organizer <- fetch(id),
         {:ok, organizer} <- Accounts.suspend_organizer(organizer, params["reason"]) do
      ok(conn, JSON.organizer(organizer), "Organizer suspended")
    end
  end

  defp fetch(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Accounts.get_organizer(id)
      :error -> nil
    end
  end
end
