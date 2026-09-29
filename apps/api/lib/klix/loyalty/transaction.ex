defmodule Klix.Loyalty.Transaction do
  use Klix.Schema

  # earned / refunded / adjusted rows grant credits (positive, with `remaining`);
  # redeemed / expired rows consume them (negative).
  @types ~w(earned redeemed refunded expired adjusted)

  schema "loyalty_transactions" do
    field :transaction_type, :string
    field :credits, :integer
    field :remaining, :integer, default: 0
    field :description, :string
    field :reference_id, :binary_id
    field :expires_at, :utc_datetime_usec

    belongs_to :user, Klix.Accounts.User

    timestamps(updated_at: false)
  end

  def types, do: @types
end
