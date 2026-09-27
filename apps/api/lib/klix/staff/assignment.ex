defmodule Klix.Staff.Assignment do
  use Klix.Schema

  schema "staff_assignments" do
    field :role, :string, default: "scanner"
    field :permissions, :map, default: %{}
    field :is_active, :boolean, default: true

    belongs_to :event, Klix.Events.Event
    belongs_to :user, Klix.Accounts.User
    belongs_to :assigned_by, Klix.Accounts.User

    timestamps()
  end

  def changeset(assignment, attrs) do
    assignment
    |> cast(attrs, [:role, :permissions, :is_active])
    |> validate_inclusion(:role, ~w(scanner supervisor))
    |> unique_constraint([:event_id, :user_id], message: "is already assigned to this event")
  end
end
