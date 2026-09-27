defmodule KlixWeb.AuthController do
  use KlixWeb, :controller

  alias Klix.Accounts
  alias KlixWeb.JSON

  def register(conn, params) do
    with {:ok, user} <- Accounts.register_user(params) do
      conn |> put_status(201) |> json(session(user))
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    with {:ok, user} <- Accounts.authenticate(email, password) do
      json(conn, session(user))
    end
  end

  def login(_conn, _params), do: {:error, {:validation, "email and password are required"}}

  def firebase_login(conn, %{"id_token" => id_token}) do
    with {:ok, user} <- Accounts.login_with_firebase(id_token) do
      json(conn, session(user))
    else
      {:error, :firebase_not_configured} = error -> error
      {:error, :account_disabled} = error -> error
      {:error, %Ecto.Changeset{}} = error -> error
      {:error, _} -> {:error, :invalid_token}
    end
  end

  def firebase_login(_conn, _params), do: {:error, {:validation, "id_token is required"}}

  def refresh(conn, %{"refresh_token" => token}) do
    with {:ok, tokens} <- Accounts.refresh_session(token) do
      json(conn, tokens)
    end
  end

  def refresh(_conn, _params), do: {:error, {:validation, "refresh_token is required"}}

  def logout(conn, params) do
    Accounts.revoke_refresh_token(params["refresh_token"])
    json(conn, %{success: true, message: "Logged out"})
  end

  # Token fields at the top level, as the previous API returned them, plus
  # the user so clients don't need a second request.
  defp session(user) do
    user |> Accounts.create_session() |> Map.put(:user, JSON.user(user))
  end
end
