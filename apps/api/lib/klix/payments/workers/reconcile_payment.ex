defmodule Klix.Payments.Workers.ReconcilePayment do
  @moduledoc """
  Polls Safaricom for orders still pending after an STK push, in case the
  callback was lost. Gives up once the order leaves `pending` (callback
  arrived, or the reservation expired).
  """
  use Oban.Worker, queue: :payments, max_attempts: 20

  alias Klix.{Orders, Payments}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"order_id" => order_id}, attempt: attempt}) do
    case Orders.get_order(order_id) do
      %{status: "pending"} = order ->
        {:ok, order} = Payments.query_status(order)

        if order.status == "pending" and attempt < 8, do: {:snooze, 30}, else: :ok

      _ ->
        :ok
    end
  end
end
