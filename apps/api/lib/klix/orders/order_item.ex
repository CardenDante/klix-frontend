defmodule Klix.Orders.OrderItem do
  use Klix.Schema

  schema "order_items" do
    field :quantity, :integer
    field :unit_price, :decimal
    field :discount_amount, :decimal, default: Decimal.new(0)

    belongs_to :order, Klix.Orders.Order
    belongs_to :ticket_type, Klix.Events.TicketType

    timestamps(updated_at: false)
  end
end
