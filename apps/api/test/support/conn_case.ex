defmodule KlixWeb.ConnCase do
  @moduledoc "Test case for controller tests."
  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint KlixWeb.Endpoint

      import Plug.Conn
      import Phoenix.ConnTest
      import KlixWeb.ConnCase
      import Klix.Fixtures
      use Oban.Testing, repo: Klix.Repo
    end
  end

  setup tags do
    Klix.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn() |> Plug.Conn.put_req_header("accept", "application/json")}
  end

  @doc "Adds a bearer token for `user` to the conn."
  def authenticate(conn, user) do
    {:ok, token, _} = Klix.Accounts.Token.sign_access(user)
    Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> token)
  end
end
