defmodule KlixWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :klix

  socket "/socket", KlixWeb.UserSocket,
    websocket: [compress: true],
    longpoll: false

  # Locally stored uploads (development; production uses S3-compatible storage).
  plug Plug.Static, at: "/uploads", from: {:klix, "priv/uploads"}, gzip: false

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]
  plug KlixWeb.Plugs.CORS

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    # Room for 5 MB image uploads plus multipart overhead.
    length: 8_000_000

  plug Plug.MethodOverride
  plug Plug.Head
  plug KlixWeb.Router
end
