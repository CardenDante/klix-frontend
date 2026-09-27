defmodule Klix.Promoters.PromoterCode do
  use Klix.Schema

  schema "promoter_codes" do
    field :code, :string
    field :code_type, :string
    field :discount_percentage, :decimal
    field :commission_percentage, :decimal
    field :usage_limit, :integer
    field :times_used, :integer, default: 0
    field :is_active, :boolean, default: true
    field :valid_from, :utc_datetime_usec
    field :valid_until, :utc_datetime_usec

    belongs_to :promoter, Klix.Accounts.User
    belongs_to :event, Klix.Events.Event

    timestamps()
  end

  def changeset(code, attrs) do
    code
    |> cast(attrs, [
      :code,
      :code_type,
      :discount_percentage,
      :commission_percentage,
      :usage_limit,
      :is_active,
      :valid_from,
      :valid_until
    ])
    |> validate_required([:code, :code_type])
    |> update_change(:code, &String.upcase(String.trim(&1)))
    |> validate_format(:code, ~r/^[A-Z0-9_-]{3,32}$/)
    |> validate_inclusion(:code_type, ~w(discount commission))
    |> validate_number(:discount_percentage, greater_than: 0, less_than_or_equal_to: 100)
    |> validate_number(:commission_percentage, greater_than: 0, less_than_or_equal_to: 100)
    |> validate_number(:usage_limit, greater_than: 0)
    |> unique_constraint(:code)
  end
end
