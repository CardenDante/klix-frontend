defmodule KlixWeb.Plugs.CORS do
  @moduledoc "Minimal CORS for the web app's origins, read at runtime."
  import Plug.Conn

  @allow_headers "authorization, content-type, x-requested-with"
  @allow_methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"

  def init(opts), do: opts

  def call(conn, _opts) do
    origin = conn |> get_req_header("origin") |> List.first()

    if origin && allowed?(origin) do
      conn =
        conn
        |> put_resp_header("access-control-allow-origin", origin)
        |> put_resp_header("access-control-allow-credentials", "true")
        |> put_resp_header("vary", "origin")

      if conn.method == "OPTIONS" do
        conn
        |> put_resp_header("access-control-allow-methods", @allow_methods)
        |> put_resp_header("access-control-allow-headers", @allow_headers)
        |> put_resp_header("access-control-max-age", "86400")
        |> send_resp(204, "")
        |> halt()
      else
        conn
      end
    else
      conn
    end
  end

  defp allowed?(origin), do: origin in Application.get_env(:klix, :cors_origins, [])
end
