defmodule Klix.OrdersTest do
  use Klix.DataCase, async: false

  alias Klix.Orders
  alias Klix.Orders.Workers.ExpireOrder
  alias Klix.Events.TicketType

  describe "create_order/2" do
    test "reserves inventory and creates pending tickets" do
      %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 10, "price" => "1500"})

      assert {:ok, order} = Orders.create_order(nil, order_params(tt, 3))
      assert order.status == "pending"
      assert Decimal.eq?(order.amount, 4500)
      assert length(order.tickets) == 3
      assert Enum.all?(order.tickets, &(&1.status == "pending_payment"))

      tt = Repo.reload!(tt)
      assert tt.quantity_reserved == 3
      assert tt.quantity_sold == 0

      assert_enqueued(worker: ExpireOrder, args: %{order_id: order.id})
    end

    test "refuses to sell more than is available" do
      %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 2})

      assert {:ok, _} = Orders.create_order(nil, order_params(tt, 2))
      assert {:error, {:sold_out, _}} = Orders.create_order(nil, order_params(tt, 1))
      assert Repo.reload!(tt).quantity_reserved == 2
    end

    test "concurrent checkouts never oversell" do
      %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 25, "max_per_order" => 5})

      results =
        1..40
        |> Task.async_stream(fn _ -> Orders.create_order(nil, order_params(tt, 1)) end,
          max_concurrency: 20
        )
        |> Enum.map(fn {:ok, result} -> result end)

      assert Enum.count(results, &match?({:ok, _}, &1)) == 25
      assert Enum.count(results, &match?({:error, {:sold_out, _}}, &1)) == 15

      tt = Repo.reload!(tt)
      assert tt.quantity_reserved == 25
      assert TicketType.available(tt) == 0
    end

    test "enforces the per-order limit" do
      %{ticket_type: tt} = on_sale_fixture(%{"max_per_order" => 4})
      assert {:error, {:validation, msg}} = Orders.create_order(nil, order_params(tt, 5))
      assert msg =~ "at most 4"
    end

    test "rejects draft events" do
      event = event_fixture()
      tt = ticket_type_fixture(event)
      assert {:error, {:validation, _}} = Orders.create_order(nil, order_params(tt, 1))
    end

    test "applies a promoter discount" do
      %{event: event, ticket_type: tt} = on_sale_fixture(%{"price" => "2000"})

      Repo.insert!(%Klix.Promoters.PromoterCode{
        code: "SAVE10",
        code_type: "discount",
        discount_percentage: Decimal.new(10),
        promoter_id: user_fixture().id,
        event_id: event.id
      })

      assert {:ok, order} =
               Orders.create_order(nil, order_params(tt, 2, %{"promoter_code" => "save10"}))

      assert Decimal.eq?(order.subtotal, 4000)
      assert Decimal.eq?(order.discount_amount, 400)
      assert Decimal.eq?(order.amount, 3600)
    end

    test "free tickets are confirmed immediately" do
      %{ticket_type: tt} = on_sale_fixture(%{"price" => "0"})

      assert {:ok, order} = Orders.create_order(nil, order_params(tt, 2))
      assert order.status == "completed"
      assert Enum.all?(order.tickets, &(&1.status == "confirmed"))
      assert Repo.reload!(tt).quantity_sold == 2
    end
  end

  describe "complete_order/2" do
    test "moves reserved to sold and is idempotent" do
      %{ticket_type: tt} = on_sale_fixture()
      {:ok, order} = Orders.create_order(nil, order_params(tt, 2))

      assert {:ok, %{status: "completed"}} = Orders.complete_order(order.id, %{mpesa_receipt: "ABC123"})
      assert {:ok, %{status: "completed"}} = Orders.complete_order(order.id, %{mpesa_receipt: "ABC123"})

      tt = Repo.reload!(tt)
      assert tt.quantity_sold == 2
      assert tt.quantity_reserved == 0
    end

    test "late payment after expiry still issues tickets when available" do
      %{ticket_type: tt} = on_sale_fixture()
      {:ok, order} = Orders.create_order(nil, order_params(tt, 1))
      {:ok, _} = Orders.release_order(order.id, "expired")

      assert {:ok, %{status: "completed"}} = Orders.complete_order(order.id)
      assert Repo.reload!(tt).quantity_sold == 1
    end

    test "late payment after sell-out is flagged for refund" do
      %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 1})
      {:ok, order} = Orders.create_order(nil, order_params(tt, 1))
      {:ok, _} = Orders.release_order(order.id, "expired")
      {:ok, other} = Orders.create_order(nil, order_params(tt, 1))
      {:ok, _} = Orders.complete_order(other.id)

      assert {:ok, %{status: "refund_required"}} = Orders.complete_order(order.id)
      assert Repo.reload!(tt).quantity_sold == 1
    end
  end

  describe "expiry" do
    test "the expire job releases the reservation" do
      %{ticket_type: tt} = on_sale_fixture()
      {:ok, order} = Orders.create_order(nil, order_params(tt, 2))

      Repo.update_all(from(o in Klix.Orders.Order, where: o.id == ^order.id),
        set: [expires_at: DateTime.add(DateTime.utc_now(), -1, :second)]
      )

      assert :ok = perform_job(ExpireOrder, %{order_id: order.id})
      assert Orders.get_order(order.id).status == "expired"
      assert Repo.reload!(tt).quantity_reserved == 0
    end

    test "the expire job snoozes while the expiry has been extended" do
      %{ticket_type: tt} = on_sale_fixture()
      {:ok, order} = Orders.create_order(nil, order_params(tt, 1))

      assert {:snooze, _} = perform_job(ExpireOrder, %{order_id: order.id})
      assert Orders.get_order(order.id).status == "pending"
    end

    test "sweep_expired/0 catches reservations whose job was lost" do
      %{ticket_type: tt} = on_sale_fixture()
      {:ok, order} = Orders.create_order(nil, order_params(tt, 1))

      Repo.update_all(from(o in Klix.Orders.Order, where: o.id == ^order.id),
        set: [expires_at: DateTime.add(DateTime.utc_now(), -60, :second)]
      )

      assert Orders.sweep_expired() == 1
      assert Repo.reload!(tt).quantity_reserved == 0
    end
  end
end
