defmodule KlixWeb.Telemetry do
  @moduledoc """
  Metrics definitions. Attach a reporter (Prometheus, StatsD, ...) to
  `metrics/0` to export them.
  """
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg), do: Supervisor.start_link(__MODULE__, arg, name: __MODULE__)

  @impl true
  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      summary("phoenix.endpoint.stop.duration", unit: {:native, :millisecond}),
      summary("phoenix.router_dispatch.stop.duration",
        tags: [:route],
        unit: {:native, :millisecond}
      ),
      counter("phoenix.router_dispatch.exception.duration", tags: [:route]),
      summary("klix.repo.query.total_time", unit: {:native, :millisecond}),
      summary("klix.repo.query.queue_time", unit: {:native, :millisecond}),
      counter("oban.job.exception.duration", tags: [:worker]),
      summary("oban.job.stop.duration", tags: [:worker], unit: {:native, :millisecond}),
      last_value("vm.memory.total", unit: {:byte, :kilobyte}),
      last_value("vm.total_run_queue_lengths.total"),
      last_value("vm.total_run_queue_lengths.cpu")
    ]
  end

  defp periodic_measurements, do: []
end
