defmodule Klix.Accounts.Organizer do
  use Klix.Schema

  @statuses ~w(pending approved rejected suspended)

  schema "organizers" do
    field :business_name, :string
    field :business_registration, :string
    field :description, :string
    field :website, :string
    field :logo_url, :string
    field :status, :string, default: "pending"
    field :approved_at, :utc_datetime_usec
    field :rejection_reason, :string

    belongs_to :user, Klix.Accounts.User
    belongs_to :approved_by, Klix.Accounts.User

    timestamps()
  end

  def statuses, do: @statuses

  def changeset(organizer, attrs) do
    organizer
    |> cast(attrs, [:business_name, :business_registration, :description, :website, :logo_url])
    |> validate_required([:business_name])
    |> validate_length(:business_name, min: 2, max: 200)
    |> validate_length(:description, max: 5000)
    |> unique_constraint(:user_id, message: "has already applied")
  end

  def review_changeset(organizer, attrs) do
    organizer
    |> cast(attrs, [:status, :approved_at, :approved_by_id, :rejection_reason])
    |> validate_inclusion(:status, @statuses)
  end
end
