defmodule Klix.Repo.Migrations.AddPromotersLoyaltyAndPlatform do
  use Ecto.Migration

  def change do
    ## Promoter programme

    create table(:promoter_profiles) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :display_name, :string, null: false
      add :bio, :text
      add :social_links, :text
      add :experience, :text
      add :payout_phone, :string
      add :status, :string, null: false, default: "pending"
      add :approved_at, :utc_datetime_usec
      add :approved_by_id, references(:users, on_delete: :nilify_all)
      add :rejection_reason, :text
      timestamps()
    end

    create unique_index(:promoter_profiles, [:user_id])
    create index(:promoter_profiles, [:status])

    # A promoter asks an organizer for permission to sell a specific event.
    create table(:promoter_event_approvals) do
      add :promoter_id, references(:users, on_delete: :delete_all), null: false
      add :event_id, references(:events, on_delete: :delete_all), null: false
      add :organizer_id, references(:organizers, on_delete: :delete_all), null: false
      add :status, :string, null: false, default: "pending"
      add :message, :text
      add :response_message, :text
      add :commission_percentage, :decimal, precision: 5, scale: 2
      add :discount_percentage, :decimal, precision: 5, scale: 2
      add :approved_at, :utc_datetime_usec
      add :rejected_at, :utc_datetime_usec
      add :revoked_at, :utc_datetime_usec
      timestamps()
    end

    create unique_index(:promoter_event_approvals, [:promoter_id, :event_id])
    create index(:promoter_event_approvals, [:organizer_id, :status])

    alter table(:promoter_codes) do
      add :clicks, :integer, null: false, default: 0
    end

    # One row per paid order that used a commission-earning code.
    create table(:promoter_commissions) do
      add :order_id, references(:orders, on_delete: :delete_all), null: false
      add :promoter_id, references(:users, on_delete: :delete_all), null: false
      add :promoter_code_id, references(:promoter_codes, on_delete: :nilify_all)
      add :event_id, references(:events, on_delete: :delete_all), null: false
      add :tickets, :integer, null: false
      add :order_amount, :decimal, precision: 12, scale: 2, null: false
      add :discount_amount, :decimal, precision: 12, scale: 2, null: false, default: 0
      add :commission_percentage, :decimal, precision: 5, scale: 2, null: false
      add :amount, :decimal, precision: 12, scale: 2, null: false
      add :status, :string, null: false, default: "earned"
      timestamps()
    end

    create unique_index(:promoter_commissions, [:order_id])
    create index(:promoter_commissions, [:promoter_id, :status])
    create index(:promoter_commissions, [:event_id])

    create table(:promoter_withdrawals) do
      add :promoter_id, references(:users, on_delete: :delete_all), null: false
      add :amount, :decimal, precision: 12, scale: 2, null: false
      add :phone, :string, null: false
      add :status, :string, null: false, default: "requested"
      add :reference, :string
      add :note, :text
      add :processed_at, :utc_datetime_usec
      add :processed_by_id, references(:users, on_delete: :nilify_all)
      timestamps()
    end

    create index(:promoter_withdrawals, [:promoter_id])
    create index(:promoter_withdrawals, [:status])
    create constraint(:promoter_withdrawals, :withdrawal_positive, check: "amount > 0")

    ## Loyalty credits (1 credit = KES 1), spent oldest-expiring first

    create table(:loyalty_transactions) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :transaction_type, :string, null: false
      add :credits, :integer, null: false
      # For credit-granting rows: how much of it is still unspent.
      add :remaining, :integer, null: false, default: 0
      add :description, :string, null: false
      add :reference_id, :binary_id
      add :expires_at, :utc_datetime_usec
      timestamps(updated_at: false)
    end

    create index(:loyalty_transactions, [:user_id, :inserted_at])
    create index(:loyalty_transactions, [:expires_at], where: "remaining > 0")
    create constraint(:loyalty_transactions, :remaining_not_negative, check: "remaining >= 0")

    alter table(:orders) do
      add :credits_applied, :integer, null: false, default: 0
      add :payment_account, :string, null: false, default: "platform"
      add :mpesa_shortcode, :string
    end

    ## Moderation, audit, accounts

    alter table(:events) do
      add :flagged_at, :utc_datetime_usec
      add :flag_reason, :text
    end

    create table(:audit_logs) do
      add :actor_id, references(:users, on_delete: :nilify_all)
      add :action, :string, null: false
      add :target_type, :string
      add :target_id, :binary_id
      add :metadata, :map, null: false, default: %{}
      add :ip, :string
      timestamps(updated_at: false)
    end

    create index(:audit_logs, [:inserted_at])
    create index(:audit_logs, [:actor_id])
    create index(:audit_logs, [:target_type, :target_id])

    # Single-use tokens for password reset and email verification.
    create table(:user_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :string
      add :used_at, :utc_datetime_usec
      timestamps(updated_at: false)
    end

    create unique_index(:user_tokens, [:token_hash])
    create index(:user_tokens, [:user_id, :context])

    create table(:file_uploads) do
      add :uploader_id, references(:users, on_delete: :nilify_all)
      add :entity_id, :binary_id
      add :upload_type, :string, null: false
      add :file_name, :string, null: false
      add :key, :string, null: false
      add :url, :text, null: false
      add :byte_size, :integer, null: false
      add :mime_type, :string, null: false
      timestamps(updated_at: false)
    end

    create index(:file_uploads, [:uploader_id])
    create index(:file_uploads, [:entity_id])

    ## Per-organizer M-Pesa and settlement

    create table(:mpesa_credentials) do
      add :organizer_id, references(:organizers, on_delete: :delete_all), null: false
      add :credential_type, :string, null: false
      add :environment, :string, null: false, default: "production"
      add :shortcode, :string, null: false
      # For till numbers, STK pushes are signed with the store number.
      add :store_number, :string
      add :encrypted_consumer_key, :binary, null: false
      add :encrypted_consumer_secret, :binary, null: false
      add :encrypted_passkey, :binary, null: false
      add :is_active, :boolean, null: false, default: false
      add :verified_at, :utc_datetime_usec
      timestamps()
    end

    create unique_index(:mpesa_credentials, [:organizer_id])

    create table(:settlements) do
      add :event_id, references(:events, on_delete: :restrict), null: false
      add :organizer_id, references(:organizers, on_delete: :restrict), null: false
      add :gross, :decimal, precision: 14, scale: 2, null: false
      add :platform_fees, :decimal, precision: 14, scale: 2, null: false
      add :promoter_commissions, :decimal, precision: 14, scale: 2, null: false
      add :collected_by_organizer, :decimal, precision: 14, scale: 2, null: false, default: 0
      add :net_payable, :decimal, precision: 14, scale: 2, null: false
      add :reference, :string
      add :note, :text
      add :paid_at, :utc_datetime_usec, null: false
      add :paid_by_id, references(:users, on_delete: :nilify_all)
      timestamps()
    end

    create unique_index(:settlements, [:event_id])
    create index(:settlements, [:organizer_id])

    # Analytics and recommendations scan paid tickets by time.
    create index(:tickets, [:event_id, :purchased_at], where: "status IN ('confirmed', 'used')")
    create index(:orders, [:paid_at], where: "status = 'completed'")
  end
end
