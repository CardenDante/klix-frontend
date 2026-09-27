defmodule KlixWeb.Plugs.RateLimit do
  @moduledoc """
  Per-client rate limiting.

      plug KlixWeb.Plugs.RateLimit, name: :login, limit: 10, window: 60

  `anonymous_limit` (defaults to `limit`) applies to requests without a
  signed-in user, which are keyed by IP.
  """
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  def init(opts), do: Map.new(opts)

  def call(conn, %{name: name, limit: limit, window: window} = opts) do
    key = client_key(conn)
    limit = if match?({:ip, _}, key), do: Map.get(opts, :anonymous_limit, limit), else: limit

    case Klix.RateLimiter.hit({name, key}, limit, window) do
      :ok ->
        conn

      {:error, retry_after} ->
        conn
        |> put_resp_header("retry-after", Integer.to_string(retry_after))
        |> put_status(429)
        |> json(%{detail: "Too many requests, please try again in #{retry_after} seconds"})
        |> halt()
    end
  end

  # Signed-in users are limited per account, everyone else per IP. Behind a
  # proxy, set up Plug.RewriteOn or RemoteIp so remote_ip is the client.
  defp client_key(%{assigns: %{current_user: %{id: id}}}), do: {:user, id}
  defp client_key(conn), do: {:ip, conn.remote_ip}
end
