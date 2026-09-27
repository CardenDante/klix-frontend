defmodule KlixWeb.OrganizerController do
  use KlixWeb, :controller

  alias Klix.Accounts
  alias KlixWeb.JSON

  def create_application(conn, params) do
    with {:ok, organizer} <- Accounts.apply_as_organizer(current_user(conn), params) do
      conn |> put_status(201) |> json(JSON.organizer(organizer))
    end
  end

  def me(conn, _params) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil -> {:error, {:not_found, "You have not applied to be an organizer"}}
      organizer -> json(conn, JSON.organizer(organizer))
    end
  end

  def update(conn, params) do
    with %{} = organizer <- Accounts.get_organizer_for_user(current_user(conn)),
         {:ok, organizer} <- Accounts.update_organizer(organizer, params) do
      json(conn, JSON.organizer(organizer))
    end
  end
end
