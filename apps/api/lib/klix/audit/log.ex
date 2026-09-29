defmodule Klix.Audit.Log do
  use Klix.Schema

  schema "audit_logs" do
    field :action, :string
    field :target_type, :string
    field :target_id, :binary_id
    field :metadata, :map, default: %{}
    field :ip, :string

    belongs_to :actor, Klix.Accounts.User

    timestamps(updated_at: false)
  end
end
