defmodule KlixWeb.CheckoutController do
  use KlixWeb, :controller

  alias Klix.Orders
  alias KlixWeb.JSON

  @doc "Reserves tickets for a cart and returns the pending transaction."
  def purchase_cart(conn, params) do
    with {:ok, order} <- Orders.create_order(current_user(conn), params) do
      conn
      |> put_status(201)
      |> ok(checkout_payload(order), "Tickets reserved. Complete payment to confirm them.")
    end
  end

  @doc "Single ticket type purchase, kept for older clients."
  def purchase(conn, %{"ticket_type_id" => id, "quantity" => qty} = params) do
    purchase_cart(conn, Map.put(params, "items", [%{"ticket_type_id" => id, "quantity" => qty}]))
  end

  def purchase(_conn, _params),
    do: {:error, {:validation, "ticket_type_id and quantity are required"}}

  def cancel(conn, %{"transaction_id" => id}) do
    with %{} = order <- Orders.get_order(id),
         true <- Orders.can_view?(order, current_user(conn)) || {:error, :not_found},
         {:ok, order} <- Orders.release_order(order.id, "cancelled", "Cancelled by customer") do
      ok(conn, JSON.order(order), "Order cancelled")
    end
  end

  defp checkout_payload(order) do
    order
    |> JSON.order()
    |> Map.put(:tickets, Enum.map(order.tickets, &JSON.ticket/1))
  end
end
