defmodule Klix.Orders.Ticket do
  use Klix.Schema

  @statuses ~w(pending_payment confirmed cancelled used)

  schema "tickets" do
    field :ticket_number, :string
    field :attendee_name, :string
    field :attendee_email, :string
    field :attendee_phone, :string
    field :status, :string, default: "pending_payment"
    field :original_price, :decimal
    field :discount_amount, :decimal, default: Decimal.new(0)
    field :final_price, :decimal
    field :is_guest_purchase, :boolean, default: false
    field :purchased_at, :utc_datetime_usec
    field :checked_in_at, :utc_datetime_usec
    field :check_in_location, :string

    belongs_to :order, Klix.Orders.Order
    belongs_to :ticket_type, Klix.Events.TicketType
    belongs_to :event, Klix.Events.Event
    belongs_to :user, Klix.Accounts.User
    belongs_to :checked_in_by, Klix.Accounts.User

    timestamps()
  end

  def statuses, do: @statuses

  @doc "Human-friendly, unguessable ticket number, e.g. KLX-7QH2M9XK4D."
  def generate_number do
    "KLX-" <> (:crypto.strong_rand_bytes(7) |> Base.encode32(padding: false) |> binary_part(0, 10))
  end
end
