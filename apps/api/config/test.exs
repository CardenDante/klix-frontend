import Config

config :klix, Klix.Repo,
  username: System.get_env("PGUSER", "postgres"),
  password: System.get_env("PGPASSWORD", "postgres"),
  hostname: System.get_env("PGHOST", "localhost"),
  database: "klix_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

config :klix, KlixWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test-only-secret-key-base-0123456789abcdef0123456789abcdef0123456789",
  server: false

config :klix, Oban, testing: :manual

config :klix, :cors_origins, ["http://localhost:3000"]
config :klix, :auth, signing_secret: "test-only-jwt-signing-secret"
config :klix, :qr_secret, "test-only-qr-secret"

# Rate limits get in the way of most tests; the limiter has its own test.
config :klix, :rate_limiting_enabled, false

config :bcrypt_elixir, :log_rounds, 1
config :logger, level: :warning
config :phoenix, :plug_init_mode, :runtime
config :klix, :cache_enabled, false
config :klix, Klix.Payments.Mpesa, adapter: Klix.Payments.Mpesa.Sandbox, callback_token: "test-callback-token"

# 32-byte key for encrypting secrets at rest (test only).
config :klix, :encryption_key, "dGVzdC1vbmx5LWVuY3J5cHRpb24ta2V5LTMyYnl0ZXM="
