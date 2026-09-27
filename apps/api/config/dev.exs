import Config

config :klix, Klix.Repo,
  username: System.get_env("PGUSER", "postgres"),
  password: System.get_env("PGPASSWORD", "postgres"),
  hostname: System.get_env("PGHOST", "localhost"),
  database: "klix_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :klix, KlixWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT", "4000"))],
  check_origin: false,
  code_reloader: true,
  debug_errors: false,
  secret_key_base: "dev-only-secret-key-base-please-change-me-0123456789abcdef0123456789abcdef"

config :klix, :cors_origins, ["http://localhost:3000"]

config :klix, :auth, signing_secret: "dev-only-jwt-signing-secret-change-me"
config :klix, :qr_secret, "dev-only-qr-secret-change-me"

config :logger, :default_formatter, format: "[$level] $message\n"
config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime

# Fake M-Pesa that "pays" a few seconds after the prompt is sent.
config :klix, Klix.Payments.Mpesa,
  adapter: Klix.Payments.Mpesa.Sandbox,
  auto_callback_ms: 4_000,
  callback_token: "dev-callback-token"
