defmodule Klix.Accounts.UserToken do
  @moduledoc "Single-use emailed tokens. Only a hash is stored."
  use Klix.Schema
  import Ecto.Query

  @validity %{"reset_password" => 60 * 60, "verify_email" => 7 * 24 * 60 * 60}

  schema "user_tokens" do
    field :token_hash, :binary, redact: true
    field :context, :string
    field :sent_to, :string
    field :used_at, :utc_datetime_usec
    belongs_to :user, Klix.Accounts.User

    timestamps(updated_at: false)
  end

  @doc "Returns `{plain_token, struct}`; send the plain token, store the struct."
  def build(user, context) when is_map_key(@validity, context) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    {token, %__MODULE__{user_id: user.id, token_hash: hash(token), context: context, sent_to: user.email}}
  end

  def hash(token), do: :crypto.hash(:sha256, token)

  @doc "Query for an unused, unexpired token of `context` whose email still matches."
  def valid_query(token, context) do
    cutoff = DateTime.add(DateTime.utc_now(), -Map.fetch!(@validity, context), :second)
    hash = hash(token)

    from t in __MODULE__,
      join: u in assoc(t, :user),
      where:
        t.token_hash == ^hash and t.context == ^context and is_nil(t.used_at) and
          t.inserted_at > ^cutoff and t.sent_to == u.email,
      select: {t, u}
  end
end
