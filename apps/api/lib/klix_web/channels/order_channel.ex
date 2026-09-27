defmodule KlixWeb.OrderChannel do
  @moduledoc """
  Live payment status for one checkout. Clients join `order:<transaction id>`
  and receive a `payment_status` push when the order leaves `pending`.

  Status changes are broadcast through Phoenix.PubSub, so this works across
  a cluster: the M-Pesa callback can land on any node.
  """
  use KlixWeb, :channel

  alias Klix.{Accounts, Orders}

  @impl true
  def join("order:" <> order_id, _params, socket) do
    user = socket.assigns.user_id && Accounts.get_user(socket.assigns.user_id)

    case Orders.get_order(order_id) do
      nil ->
        {:error, %{reason: "not_found"}}

      order ->
        if Orders.can_view?(order, user) do
          Phoenix.PubSub.subscribe(Klix.PubSub, Orders.status_topic(order.id))
          # Reply with the current state so a late joiner doesn't miss the result.
          {:ok, status_payload(order), socket}
        else
          {:error, %{reason: "not_found"}}
        end
    end
  end

  @impl true
  def handle_info({:order_status, payload}, socket) do
    push(socket, "payment_status", Map.put(payload, :type, "payment_status"))
    {:noreply, socket}
  end

  defp status_payload(order) do
    %{
      type: "payment_status",
      transaction_id: order.id,
      status: order.status,
      message: order.failure_reason
    }
  end
end
