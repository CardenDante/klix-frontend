defmodule Klix.Orders.Order do
  @moduledoc """
  A checkout. Exposed as a "transaction" in the `/api/v1` contract.

  Lifecycle: `pending` -> `completed` | `failed` | `cancelled` | `expired`.
  `refund_required` marks the rare case where money arrived after the
  reservation lapsed and the tickets had meanwhile sold out.
  """
  use Klix.Schema

  @statuses ~w(pending completed failed cancelled expired refund_required)

  schema "orders" do
    field :status, :string, default: "pending"
    field :currency, :string, default: "KES"
    field :subtotal, :decimal
    field :discount_amount, :decimal, default: Decimal.new(0)
    field :amount, :decimal
    field :platform_fee, :decimal, default: Decimal.new(0)
    field :attendee_name, :string
    field :attendee_email, :string
    field :attendee_phone, :string
    field :payment_method, :string, default: "mpesa"
    field :mpesa_phone, :string
    field :mpesa_checkout_request_id, :string
    field :mpesa_merchant_request_id, :string
    field :mpesa_receipt, :string
    field :expires_at, :utc_datetime_usec
    field :paid_at, :utc_datetime_usec
    field :failure_reason, :string

    belongs_to :user, Klix.Accounts.User
    belongs_to :event, Klix.Events.Event
    belongs_to :promoter_code, Klix.Promoters.PromoterCode
    has_many :items, Klix.Orders.OrderItem
    has_many :tickets, Klix.Orders.Ticket

    timestamps()
  end

  def statuses, do: @statuses
  def final?(%__MODULE__{status: status}), do: status != "pending"
end
