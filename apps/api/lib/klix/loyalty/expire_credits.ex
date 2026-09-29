defmodule Klix.Loyalty.Workers.ExpireCredits do
  @moduledoc "Daily write-off of loyalty credits past their expiry date."
  use Oban.Worker, queue: :default, max_attempts: 3, unique: [period: 3_600]

  @impl Oban.Worker
  def perform(_job) do
    Klix.Loyalty.expire_due()
    :ok
  end
end
