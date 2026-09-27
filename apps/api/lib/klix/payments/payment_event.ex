defmodule Klix.Payments.PaymentEvent do
  use Klix.Schema

  schema "payment_events" do
    field :kind, :string
    field :payload, :map, default: %{}
    belongs_to :order, Klix.Orders.Order

    timestamps(updated_at: false)
  end
end
