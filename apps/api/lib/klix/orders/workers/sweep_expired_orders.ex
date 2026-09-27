defmodule Klix.Orders.Workers.SweepExpiredOrders do
  @moduledoc "Cron safety net for reservations whose expiry job never ran."
  use Oban.Worker, queue: :reservations, max_attempts: 1, unique: [period: 55]

  @impl Oban.Worker
  def perform(_job) do
    Klix.Orders.sweep_expired()
    :ok
  end
end
