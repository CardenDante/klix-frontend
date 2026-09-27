defmodule Klix.Accounts.RefreshToken do
  use Klix.Schema

  schema "refresh_tokens" do
    field :token_hash, :binary, redact: true
    field :expires_at, :utc_datetime_usec
    field :revoked_at, :utc_datetime_usec
    belongs_to :user, Klix.Accounts.User

    timestamps(updated_at: false)
  end

  def hash(token), do: :crypto.hash(:sha256, token)
end
