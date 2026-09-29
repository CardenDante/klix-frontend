defmodule Klix.Payments.MpesaCredential do
  @moduledoc """
  An organizer's own Daraja app. When active, their buyers pay straight
  into the organizer's paybill or till instead of the platform's.
  """
  use Klix.Schema
  alias Klix.Vault

  schema "mpesa_credentials" do
    field :credential_type, :string
    field :environment, :string, default: "production"
    field :shortcode, :string
    field :store_number, :string
    field :encrypted_consumer_key, :binary, redact: true
    field :encrypted_consumer_secret, :binary, redact: true
    field :encrypted_passkey, :binary, redact: true
    field :is_active, :boolean, default: false
    field :verified_at, :utc_datetime_usec

    field :consumer_key, :string, virtual: true, redact: true
    field :consumer_secret, :string, virtual: true, redact: true
    field :passkey, :string, virtual: true, redact: true

    belongs_to :organizer, Klix.Accounts.Organizer

    timestamps()
  end

  def changeset(credential, attrs) do
    credential
    |> cast(attrs, [:credential_type, :environment, :shortcode, :store_number, :consumer_key, :consumer_secret, :passkey])
    |> validate_required([:credential_type, :shortcode])
    |> validate_inclusion(:credential_type, ~w(paybill till_number))
    |> validate_inclusion(:environment, ~w(sandbox production))
    |> validate_format(:shortcode, ~r/^\d{5,8}$/, message: "must be 5–8 digits")
    |> validate_format(:store_number, ~r/^\d{5,8}$/, message: "must be 5–8 digits")
    |> then(fn cs ->
      if get_field(cs, :credential_type) == "till_number",
        do: validate_required(cs, [:store_number], message: "is required for till numbers"),
        else: cs
    end)
    |> encrypt(:consumer_key, :encrypted_consumer_key)
    |> encrypt(:consumer_secret, :encrypted_consumer_secret)
    |> encrypt(:passkey, :encrypted_passkey)
    |> validate_required([:encrypted_consumer_key, :encrypted_consumer_secret, :encrypted_passkey],
      message: "is required"
    )
    # Any change must be re-verified before payments use it.
    |> then(fn cs -> if cs.changes == %{}, do: cs, else: change(cs, is_active: false, verified_at: nil) end)
    |> unique_constraint(:organizer_id)
  end

  defp encrypt(changeset, virtual, stored) do
    case get_change(changeset, virtual) do
      value when is_binary(value) and value != "" -> put_change(changeset, stored, Vault.encrypt(String.trim(value)))
      _ -> changeset
    end
  end

  @doc "The Daraja config for this credential, as the M-Pesa adapters expect it."
  def to_config(%__MODULE__{} = c, platform) do
    till? = c.credential_type == "till_number"

    [
      environment: c.environment,
      consumer_key: Vault.decrypt!(c.encrypted_consumer_key),
      consumer_secret: Vault.decrypt!(c.encrypted_consumer_secret),
      passkey: Vault.decrypt!(c.encrypted_passkey),
      # Tills sign with the store number and receive into the till.
      shortcode: if(till?, do: c.store_number, else: c.shortcode),
      party_b: c.shortcode,
      transaction_type: if(till?, do: "CustomerBuyGoodsOnline", else: "CustomerPayBillOnline"),
      callback_url: platform[:callback_url]
    ]
  end

  def masked_shortcode(%__MODULE__{shortcode: code}) when is_binary(code) do
    String.duplicate("•", max(String.length(code) - 3, 0)) <> String.slice(code, -3, 3)
  end
end
