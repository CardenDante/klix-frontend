defmodule KlixWeb.HealthController do
  use KlixWeb, :controller

  def show(conn, _params) do
    db =
      case Ecto.Adapters.SQL.query(Klix.Repo, "SELECT 1", [], timeout: 2_000) do
        {:ok, _} -> "ok"
        _ -> "error"
      end

    status = if db == "ok", do: 200, else: 503

    conn
    |> put_status(status)
    |> json(%{status: if(db == "ok", do: "ok", else: "degraded"), database: db, node: node()})
  end
end
