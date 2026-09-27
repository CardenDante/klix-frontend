defmodule Klix.Cache do
  @moduledoc """
  A small node-local ETS cache with per-entry TTLs.

  Popular event pages get hammered when tickets go on sale. Caching the
  public event payload for a few seconds absorbs most of those reads without
  touching Postgres, while the purchase path always reads the database, so
  slightly stale availability numbers can never cause an oversell.
  """
  use GenServer

  @table __MODULE__
  @sweep_interval :timer.seconds(30)

  def start_link(_opts), do: GenServer.start_link(__MODULE__, nil, name: __MODULE__)

  @doc "Returns the cached value for `key`, computing and storing it on a miss."
  def fetch(key, ttl_ms, fun) when is_function(fun, 0) do
    if Application.get_env(:klix, :cache_enabled, true),
      do: cached_fetch(key, ttl_ms, fun),
      else: fun.()
  end

  defp cached_fetch(key, ttl_ms, fun) do
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(@table, key) do
      [{^key, value, expires_at}] when expires_at > now ->
        value

      _ ->
        value = fun.()
        :ets.insert(@table, {key, value, now + ttl_ms})
        value
    end
  end

  def delete(key) do
    :ets.delete(@table, key)
    :ok
  end

  @doc "Drops every entry whose key is a tuple starting with `prefix`."
  def delete_prefix(prefix) do
    :ets.match_delete(@table, {{prefix, :_}, :_, :_})
    :ok
  end

  def clear do
    :ets.delete_all_objects(@table)
    :ok
  end

  @impl true
  def init(_) do
    :ets.new(@table, [:set, :public, :named_table, read_concurrency: true, write_concurrency: true])
    schedule_sweep()
    {:ok, nil}
  end

  @impl true
  def handle_info(:sweep, state) do
    now = System.monotonic_time(:millisecond)
    :ets.select_delete(@table, [{{:_, :_, :"$1"}, [{:<, :"$1", now}], [true]}])
    schedule_sweep()
    {:noreply, state}
  end

  defp schedule_sweep, do: Process.send_after(self(), :sweep, @sweep_interval)
end
