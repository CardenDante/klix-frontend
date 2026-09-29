defmodule Klix.Promoters.Commission do
  use Klix.Schema

  schema "promoter_commissions" do
    field :tickets, :integer
    field :order_amount, :decimal
    field :discount_amount, :decimal
    field :commission_percentage, :decimal
    field :amount, :decimal
    # earned | cancelled
    field :status, :string, default: "earned"

    belongs_to :order, Klix.Orders.Order
    belongs_to :promoter, Klix.Accounts.User
    belongs_to :promoter_code, Klix.Promoters.PromoterCode
    belongs_to :event, Klix.Events.Event

    timestamps()
  end
end
