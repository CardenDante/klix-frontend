defmodule KlixWeb.OrderChannelTest do
  use Klix.DataCase, async: false
  import Phoenix.ChannelTest

  @endpoint KlixWeb.Endpoint

  test "pushes the payment result to the checkout page" do
    %{ticket_type: tt} = on_sale_fixture()
    {:ok, order} = Klix.Orders.create_order(nil, order_params(tt, 1))

    {:ok, socket} = connect(KlixWeb.UserSocket, %{})
    {:ok, reply, _socket} = subscribe_and_join(socket, "order:#{order.id}", %{})
    assert reply.status == "pending"

    {:ok, _} = Klix.Orders.complete_order(order.id)
    assert_push "payment_status", %{status: "completed", transaction_id: tx}
    assert tx == order.id
  end

  test "signed-in orders can't be watched by strangers" do
    %{ticket_type: tt} = on_sale_fixture()
    {:ok, order} = Klix.Orders.create_order(user_fixture(), order_params(tt, 1))

    {:ok, socket} = connect(KlixWeb.UserSocket, %{})
    assert {:error, %{reason: "not_found"}} = subscribe_and_join(socket, "order:#{order.id}", %{})
  end
end
