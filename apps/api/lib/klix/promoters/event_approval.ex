defmodule Klix.Promoters.EventApproval do
  @moduledoc "A promoter's request to sell an event, and the organizer's terms."
  use Klix.Schema

  schema "promoter_event_approvals" do
    field :status, :string, default: "pending"
    field :message, :string
    field :response_message, :string
    field :commission_percentage, :decimal
    field :discount_percentage, :decimal
    field :approved_at, :utc_datetime_usec
    field :rejected_at, :utc_datetime_usec
    field :revoked_at, :utc_datetime_usec

    belongs_to :promoter, Klix.Accounts.User
    belongs_to :event, Klix.Events.Event
    belongs_to :organizer, Klix.Accounts.Organizer

    timestamps()
  end

  def request_changeset(approval, attrs) do
    approval
    |> cast(attrs, [:message])
    |> validate_length(:message, max: 2000)
    |> unique_constraint([:promoter_id, :event_id], message: "you have already requested this event")
  end

  def terms_changeset(approval, attrs) do
    approval
    |> cast(attrs, [:commission_percentage, :discount_percentage, :response_message])
    |> validate_number(:commission_percentage, greater_than_or_equal_to: 0, less_than_or_equal_to: 50)
    |> validate_number(:discount_percentage, greater_than_or_equal_to: 0, less_than_or_equal_to: 50)
    |> validate_length(:response_message, max: 2000)
  end
end
