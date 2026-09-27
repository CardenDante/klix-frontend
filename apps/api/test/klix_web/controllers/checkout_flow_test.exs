defmodule KlixWeb.CheckoutFlowTest do
  use KlixWeb.ConnCase, async: false

  alias Klix.Payments.Mpesa.Sandbox
  alias Klix.Payments.Workers.ReconcilePayment

  test "guest buys tickets, pays with M-Pesa and gets scannable tickets", %{conn: conn} do
    %{event: event, ticket_type: tt} = on_sale_fixture(%{"price" => "1200", "quantity_total" => 50})

    # 1. Browse
    conn1 = get(conn, "/api/v1/events/slug/#{event.slug}")
    assert %{"id" => event_id, "tickets_available" => 50} = json_response(conn1, 200)

    conn1 = get(conn, "/api/v1/tickets/events/#{event_id}/ticket-types")
    assert [%{"id" => tt_id, "price" => "1200.00", "quantity_available" => 50}] = json_response(conn1, 200)

    # 2. Reserve
    conn1 =
      post(conn, "/api/v1/tickets/purchase-cart", %{
        "items" => [%{"ticket_type_id" => tt_id, "quantity" => 2}],
        "attendee_name" => "Wanjiru",
        "attendee_email" => "wanjiru@example.com",
        "attendee_phone" => "0722000111"
      })

    assert %{"success" => true, "data" => %{"transaction_id" => tx, "amount" => "2400.00", "tickets" => tickets}} =
             json_response(conn1, 201)

    assert length(tickets) == 2
    assert Enum.all?(tickets, &is_nil(&1["qr_code"]))

    # 3. Pay
    conn1 = post(conn, "/api/v1/payments/initiate-mpesa", %{"transaction_id" => tx})
    assert %{"data" => %{"checkout_request_id" => checkout_id}} = json_response(conn1, 200)
    assert_enqueued(worker: ReconcilePayment, args: %{order_id: tx})

    conn1 = get(conn, "/api/v1/payments/transaction/#{tx}")
    assert %{"data" => %{"status" => "pending"} = pending} = json_response(conn1, 200)
    refute Map.has_key?(pending, "tickets")

    # 4. Safaricom calls back
    payload = Sandbox.callback_payload(checkout_id, "m-1", "254722000111", 2400)
    conn1 = post(conn, "/api/v1/payments/mpesa/callback/test-callback-token", payload)
    assert %{"ResultCode" => 0} = json_response(conn1, 200)

    conn1 = get(conn, "/api/v1/payments/transaction/#{tx}")
    assert %{"data" => %{"status" => "completed", "mpesa_receipt" => "SBX" <> _, "tickets" => paid}} =
             json_response(conn1, 200)

    assert Enum.all?(paid, &(&1["status"] == "confirmed" and is_binary(&1["qr_code"])))

    tt = Klix.Repo.reload!(tt)
    assert tt.quantity_sold == 2 and tt.quantity_reserved == 0

    # 5. Door
    staff = user_fixture()
    {:ok, _} = Klix.Staff.assign(event, staff, %{"email" => staff.email})
    qr = hd(paid)["qr_code"]

    conn1 = conn |> authenticate(staff) |> post("/api/v1/tickets/checkin", %{"qr_data" => qr, "event_id" => event.id})
    assert %{"valid" => true, "message" => "Checked in"} = json_response(conn1, 200)

    conn1 = conn |> authenticate(staff) |> post("/api/v1/tickets/checkin", %{"qr_data" => qr, "event_id" => event.id})
    assert %{"valid" => false, "reason" => "already_used"} = json_response(conn1, 409)
  end

  test "callbacks with a bad token are ignored", %{conn: conn} do
    %{ticket_type: tt} = on_sale_fixture()
    {:ok, order} = Klix.Orders.create_order(nil, order_params(tt, 1))
    {:ok, order} = Klix.Payments.initiate_mpesa(order)

    payload = Sandbox.callback_payload(order.mpesa_checkout_request_id, "m", "254712345678", 1000)
    conn = post(conn, "/api/v1/payments/mpesa/callback/wrong-token", payload)

    assert json_response(conn, 200)
    assert Klix.Orders.get_order(order.id).status == "pending"
  end

  test "a cancelled prompt releases the tickets", %{conn: conn} do
    %{ticket_type: tt} = on_sale_fixture()
    {:ok, order} = Klix.Orders.create_order(nil, order_params(tt, 1, %{"attendee_phone" => "0700000002"}))
    {:ok, order} = Klix.Payments.initiate_mpesa(order)

    payload = Sandbox.callback_payload(order.mpesa_checkout_request_id, "m", "254700000002", 1000)
    post(conn, "/api/v1/payments/mpesa/callback/test-callback-token", payload)

    assert Klix.Orders.get_order(order.id).status == "cancelled"
    assert Klix.Repo.reload!(tt).quantity_reserved == 0
  end

  test "orders placed while signed in are private", %{conn: conn} do
    %{ticket_type: tt} = on_sale_fixture()
    buyer = user_fixture()
    {:ok, order} = Klix.Orders.create_order(buyer, order_params(tt, 1))

    assert conn |> get("/api/v1/payments/transaction/#{order.id}") |> json_response(404)

    assert conn
           |> authenticate(user_fixture())
           |> get("/api/v1/payments/transaction/#{order.id}")
           |> json_response(404)

    assert conn
           |> authenticate(buyer)
           |> get("/api/v1/payments/transaction/#{order.id}")
           |> json_response(200)
  end

  test "sold out returns 409", %{conn: conn} do
    %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 1})
    post(conn, "/api/v1/tickets/purchase-cart", order_params(tt, 1))

    conn = post(conn, "/api/v1/tickets/purchase-cart", order_params(tt, 1))
    assert %{"detail" => "Not enough Regular tickets left"} = json_response(conn, 409)
  end
end
