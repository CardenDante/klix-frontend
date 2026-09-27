import Config

if System.get_env("PHX_SERVER") do
  config :klix, KlixWeb.Endpoint, server: true
end

# M-Pesa: the real Daraja adapter is used whenever credentials are present.
if System.get_env("MPESA_CONSUMER_KEY") do
  config :klix, Klix.Payments.Mpesa,
    adapter: Klix.Payments.Mpesa.Daraja,
    environment: System.get_env("MPESA_ENV", "sandbox"),
    consumer_key: System.fetch_env!("MPESA_CONSUMER_KEY"),
    consumer_secret: System.fetch_env!("MPESA_CONSUMER_SECRET"),
    shortcode: System.fetch_env!("MPESA_SHORTCODE"),
    passkey: System.fetch_env!("MPESA_PASSKEY"),
    transaction_type: System.get_env("MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline"),
    # Safaricom doesn't sign callbacks, so the callback URL carries a secret:
    # MPESA_CALLBACK_URL=https://<host>/api/v1/payments/mpesa/callback/<token>
    callback_url: System.fetch_env!("MPESA_CALLBACK_URL"),
    callback_token: System.fetch_env!("MPESA_CALLBACK_TOKEN")
end

# Demo / staging without Safaricom: the fake M-Pesa "pays" automatically.
if System.get_env("ALLOW_SANDBOX_PAYMENTS") == "true" and !System.get_env("MPESA_CONSUMER_KEY") do
  config :klix, Klix.Payments.Mpesa,
    adapter: Klix.Payments.Mpesa.Sandbox,
    auto_callback_ms: 4_000
end

if project_id = System.get_env("FIREBASE_PROJECT_ID") do
  config :klix, :firebase_project_id, project_id
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "environment variable DATABASE_URL is missing (ecto://USER:PASS@HOST/DATABASE)"

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :klix, Klix.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "20"),
    queue_target: 500,
    queue_interval: 2_000,
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "environment variable SECRET_KEY_BASE is missing (mix phx.gen.secret)"

  host = System.get_env("PHX_HOST") || "api.klix.co.ke"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :klix, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :klix, KlixWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base,
    check_origin: String.split(System.get_env("CORS_ORIGINS", "https://klix.co.ke"), ",")

  config :klix,
         :cors_origins,
         String.split(System.get_env("CORS_ORIGINS", "https://klix.co.ke"), ",")

  config :klix, :auth, signing_secret: System.fetch_env!("JWT_SIGNING_SECRET")
  config :klix, :qr_secret, System.fetch_env!("QR_SIGNING_SECRET")

  if System.get_env("MPESA_CONSUMER_KEY") == nil and System.get_env("ALLOW_SANDBOX_PAYMENTS") != "true" do
    raise "M-Pesa credentials are missing; set MPESA_* or ALLOW_SANDBOX_PAYMENTS=true"
  end
end
