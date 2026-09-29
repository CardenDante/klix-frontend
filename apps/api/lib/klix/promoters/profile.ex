defmodule Klix.Promoters.Profile do
  use Klix.Schema

  @statuses ~w(pending approved rejected suspended)

  schema "promoter_profiles" do
    field :display_name, :string
    field :bio, :string
    field :social_links, :string
    field :experience, :string
    field :payout_phone, :string
    field :status, :string, default: "pending"
    field :approved_at, :utc_datetime_usec
    field :rejection_reason, :string

    belongs_to :user, Klix.Accounts.User
    belongs_to :approved_by, Klix.Accounts.User

    timestamps()
  end

  def statuses, do: @statuses

  def changeset(profile, attrs) do
    profile
    |> cast(attrs, [:display_name, :bio, :social_links, :experience, :payout_phone])
    |> validate_required([:display_name])
    |> validate_length(:display_name, min: 2, max: 100)
    |> validate_length(:bio, max: 2000)
    |> validate_length(:social_links, max: 2000)
    |> validate_length(:experience, max: 5000)
    |> update_change(:payout_phone, &Klix.Phone.normalize/1)
    |> validate_format(:payout_phone, ~r/^254\d{9}$/, message: "must be a valid Kenyan phone number")
    |> unique_constraint(:user_id, message: "has already applied")
  end

  def review_changeset(profile, attrs) do
    profile
    |> cast(attrs, [:status, :approved_at, :approved_by_id, :rejection_reason])
    |> validate_inclusion(:status, @statuses)
  end
end
