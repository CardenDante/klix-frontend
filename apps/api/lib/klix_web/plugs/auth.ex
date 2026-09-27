defmodule KlixWeb.Plugs.Auth do
  @moduledoc """
  Reads the bearer token, if any, and assigns `:current_user`.

  The token is verified without the database; the user row is then loaded
  once so role changes and deactivations take effect immediately.
  """
  import Plug.Conn
  alias Klix.Accounts

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user_id, _claims} <- Accounts.Token.verify_access(String.trim(token)),
         %{is_active: true} = user <- Accounts.get_user(user_id) do
      Logger.metadata(user_id: user.id)
      assign(conn, :current_user, user)
    else
      _ -> assign(conn, :current_user, nil)
    end
  end
end

defmodule KlixWeb.Plugs.RequireAuth do
  @moduledoc "Halts with 401 unless a user is signed in, optionally requiring roles."
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  def init(opts), do: Keyword.get(opts, :roles)

  def call(%{assigns: %{current_user: nil}} = conn, _roles) do
    conn |> put_status(401) |> json(%{detail: "Not authenticated"}) |> halt()
  end

  def call(conn, nil), do: conn

  def call(%{assigns: %{current_user: user}} = conn, roles) do
    if user.role in roles or user.role == "admin" do
      conn
    else
      conn |> put_status(403) |> json(%{detail: "You don't have permission to do that"}) |> halt()
    end
  end
end
