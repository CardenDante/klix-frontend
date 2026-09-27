defmodule Klix.Orders.Workers.ExpireOrder do
  @moduledoc "Returns a checkout's reserved tickets to the pool once it lapses."
  use Oban.Worker, queue: :reservations, max_attempts: 10

  alias Klix.Orders

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"order_id" => order_id}}) do
    case Orders.get_order(order_id) do
      %{status: "pending", expires_at: expires_at} ->
        # The expiry may have been extended while an M-Pesa prompt was open.
        case DateTime.diff(expires_at, DateTime.utc_now()) do
          wait when wait > 0 ->
            {:snooze, wait + 1}

          _ ->
            {:ok, _} = Orders.release_order(order_id, "expired", "Reservation expired")
            :ok
        end

      _ ->
        :ok
    end
  end
end
