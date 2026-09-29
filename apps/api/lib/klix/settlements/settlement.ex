defmodule Klix.Settlements.Settlement do
  use Klix.Schema

  schema "settlements" do
    field :gross, :decimal
    field :platform_fees, :decimal
    field :promoter_commissions, :decimal
    field :collected_by_organizer, :decimal
    field :net_payable, :decimal
    field :reference, :string
    field :note, :string
    field :paid_at, :utc_datetime_usec

    belongs_to :event, Klix.Events.Event
    belongs_to :organizer, Klix.Accounts.Organizer
    belongs_to :paid_by, Klix.Accounts.User

    timestamps()
  end
end
