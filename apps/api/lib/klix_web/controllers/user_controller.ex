defmodule KlixWeb.UserController do
  use KlixWeb, :controller

  alias Klix.Accounts
  alias KlixWeb.JSON

  def me(conn, _params), do: json(conn, JSON.user(current_user(conn)))

  def update(conn, params) do
    with {:ok, user} <- Accounts.update_profile(current_user(conn), params) do
      json(conn, JSON.user(user))
    end
  end

  def update_preferences(conn, params) do
    prefs = Map.take(params, ~w(preferred_categories preferred_location notification_email notification_sms marketing_emails))

    with {:ok, user} <- Accounts.update_preferences(current_user(conn), prefs) do
      json(conn, JSON.user(user))
    end
  end
end
