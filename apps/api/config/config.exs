import Config

config :klix,
  ecto_repos: [Klix.Repo],
  generators: [timestamp_type: :utc_datetime_usec, binary_id: true]

config :klix, Klix.Repo,
  migration_primary_key: [type: :binary_id],
  migration_foreign_key: [type: :binary_id],
  migration_timestamps: [type: :utc_datetime_usec]

config :klix, KlixWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [formats: [json: KlixWeb.ErrorJSON], layout: false],
  pubsub_server: Klix.PubSub

config :klix, Oban,
  engine: Oban.Engines.Basic,
  repo: Klix.Repo,
  queues: [default: 10, payments: 20, reservations: 20, notifications: 10],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},
    {Oban.Plugins.Cron,
     crontab: [
       # Safety net: release any reservation whose expiry job was lost.
       {"* * * * *", Klix.Orders.Workers.SweepExpiredOrders},
       {"15 0 * * *", Klix.Loyalty.Workers.ExpireCredits}
     ]}
  ]

# How long a checkout holds tickets before they return to the pool.
config :klix, :reservation_ttl_seconds, 10 * 60

config :klix, :auth,
  access_token_ttl_seconds: 15 * 60,
  refresh_token_ttl_seconds: 30 * 24 * 60 * 60

# The platform takes this share of every paid order.
# (A string: config.exs is evaluated before dependencies such as Decimal load.)
config :klix, :platform_fee_percentage, "2.5"

config :klix, Klix.Payments.Mpesa, adapter: Klix.Payments.Mpesa.Sandbox

# Loyalty: credits earned per KES spent, how long they last, and how much
# of an order they can pay for.
config :klix, :loyalty, earn_rate_percent: "1", expiry_days: 365, max_redeem_percent: 50

config :klix, Klix.Notifications,
  mailer: Klix.Notifications.LogMailer,
  sms: Klix.Notifications.LogSMS,
  from_email: "Klix <tickets@e-klix.com>",
  web_url: "http://localhost:3000"

config :klix, Klix.Uploads, storage: Klix.Uploads.LocalStorage

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :order_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
