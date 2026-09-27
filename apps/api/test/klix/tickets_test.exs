defmodule Klix.TicketsTest do
  use Klix.DataCase, async: true

  alias Klix.{Orders, Tickets}

  setup do
    %{event: event, ticket_type: tt} = on_sale_fixture()
    {:ok, order} = Orders.create_order(nil, order_params(tt, 1))
    {:ok, _} = Orders.complete_order(order.id)
    [ticket] = Repo.preload(Orders.get_order(order.id), :tickets).tickets
    %{event: event, ticket: ticket, staff: user_fixture()}
  end

  test "QR codes verify and reject tampering", %{ticket: ticket} do
    qr = Tickets.qr_code(ticket)
    assert {:ok, id} = Tickets.verify_qr(qr)
    assert id == ticket.id

    [prefix, _id, sig] = String.split(qr, ".")
    assert {:error, :invalid_qr} = Tickets.verify_qr("#{prefix}.#{Ecto.UUID.generate()}.#{sig}")
    assert {:error, :invalid_qr} = Tickets.verify_qr("garbage")
  end

  test "a ticket is admitted exactly once", %{event: event, ticket: ticket, staff: staff} do
    qr = Tickets.qr_code(ticket)

    assert {:ok, admitted} = Tickets.check_in(qr, event.id, staff, "Gate A")
    assert admitted.status == "used"
    assert admitted.check_in_location == "Gate A"

    assert {:error, :already_used, _} = Tickets.check_in(qr, event.id, staff)
  end

  test "tickets for another event are rejected", %{ticket: ticket, staff: staff} do
    other = event_fixture()
    assert {:error, :wrong_event, _} = Tickets.check_in(Tickets.qr_code(ticket), other.id, staff)
  end

  test "unpaid tickets are not valid", %{event: event} do
    tt = ticket_type_fixture(event, %{"name" => "Late"})
    {:ok, order} = Orders.create_order(nil, order_params(tt, 1))
    [ticket] = order.tickets
    assert {:error, :not_valid, _} = Tickets.validate(Tickets.qr_code(ticket), event.id)
  end
end
