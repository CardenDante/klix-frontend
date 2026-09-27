defmodule KlixWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :klix

  socket "/socket", KlixWeb.UserSocket,
    websocket: [compress: true],
    longpoll: false

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]
  plug KlixWeb.Plugs.CORS

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: 1_000_000

  plug Plug.MethodOverride
  plug Plug.Head
  plug KlixWeb.Router
end
