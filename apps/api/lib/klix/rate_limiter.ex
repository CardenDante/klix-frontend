defmodule Klix.RateLimiter do
  @moduledoc """
  Fixed-window rate limiter backed by ETS atomic counters.

  Limits are per node; behind a load balancer with N nodes the effective
  limit is roughly N times the configured one, which is fine for abuse
  protection on login and checkout endpoints.
  """
  use GenServer

  @table __MODULE__

  def start_link(_opts), do: GenServer.start_link(__MODULE__, nil, name: __MODULE__)

  @doc """
  Records a hit for `key` and returns `:ok` or `{:error, retry_after_seconds}`
  once more than `limit` hits land inside the current `window_seconds`.
  """
  def hit(key, limit, window_seconds) do
    if enabled?() do
      now = System.system_time(:second)
      window = div(now, window_seconds)
      bucket = {key, window}
      expires_at = (window + 1) * window_seconds

      count = :ets.update_counter(@table, bucket, {2, 1}, {bucket, 0, expires_at})

      if count > limit, do: {:error, expires_at - now}, else: :ok
    else
      :ok
    end
  end

  defp enabled?, do: Application.get_env(:klix, :rate_limiting_enabled, true)

  @impl true
  def init(_) do
    :ets.new(@table, [:set, :public, :named_table, write_concurrency: true])
    schedule_sweep()
    {:ok, nil}
  end

  @impl true
  def handle_info(:sweep, state) do
    now = System.system_time(:second)
    :ets.select_delete(@table, [{{:_, :_, :"$1"}, [{:<, :"$1", now}], [true]}])
    schedule_sweep()
    {:noreply, state}
  end

  defp schedule_sweep, do: Process.send_after(self(), :sweep, :timer.minutes(1))
end
