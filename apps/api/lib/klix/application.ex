defmodule Klix.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      KlixWeb.Telemetry,
      Klix.Repo,
      {DNSCluster, query: Application.get_env(:klix, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Klix.PubSub},
      Klix.Cache,
      Klix.RateLimiter,
      {Oban, Application.fetch_env!(:klix, Oban)},
      KlixWeb.Endpoint
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: Klix.Supervisor)
  end

  @impl true
  def config_change(changed, _new, removed) do
    KlixWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
