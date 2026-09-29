defmodule Klix.Promoters.Withdrawal do
  use Klix.Schema

  @statuses ~w(requested paid rejected)

  schema "promoter_withdrawals" do
    field :amount, :decimal
    field :phone, :string
    field :status, :string, default: "requested"
    field :reference, :string
    field :note, :string
    field :processed_at, :utc_datetime_usec

    belongs_to :promoter, Klix.Accounts.User
    belongs_to :processed_by, Klix.Accounts.User

    timestamps()
  end

  def statuses, do: @statuses
end
