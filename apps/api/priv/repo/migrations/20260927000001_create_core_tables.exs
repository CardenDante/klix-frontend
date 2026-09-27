defmodule Klix.Repo.Migrations.CreateCoreTables do
  use Ecto.Migration

  def change do
    execute "CREATE EXTENSION IF NOT EXISTS citext", "DROP EXTENSION IF EXISTS citext"

    create table(:users) do
      add :email, :citext, null: false
      add :hashed_password, :string
      add :firebase_uid, :string
      add :first_name, :string
      add :last_name, :string
      add :phone_number, :string
      add :role, :string, null: false, default: "attendee"
      add :is_active, :boolean, null: false, default: true
      add :email_verified, :boolean, null: false, default: false
      add :profile_image_url, :text
      add :preferences, :map, null: false, default: %{}
      timestamps()
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:firebase_uid])

    create table(:refresh_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :expires_at, :utc_datetime_usec, null: false
      add :revoked_at, :utc_datetime_usec
      timestamps(updated_at: false)
    end

    create unique_index(:refresh_tokens, [:token_hash])
    create index(:refresh_tokens, [:user_id])

    create table(:organizers) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :business_name, :string, null: false
      add :business_registration, :string
      add :description, :text
      add :website, :string
      add :logo_url, :text
      add :status, :string, null: false, default: "pending"
      add :approved_at, :utc_datetime_usec
      add :approved_by_id, references(:users, on_delete: :nilify_all)
      add :rejection_reason, :text
      timestamps()
    end

    create unique_index(:organizers, [:user_id])
    create index(:organizers, [:status])

    create table(:events) do
      add :organizer_id, references(:organizers, on_delete: :restrict), null: false
      add :title, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :category, :string, null: false
      add :location, :string, null: false
      add :latitude, :float
      add :longitude, :float
      add :start_datetime, :utc_datetime_usec, null: false
      add :end_datetime, :utc_datetime_usec, null: false
      add :banner_image_url, :text
      add :portrait_image_url, :text
      add :additional_images, {:array, :text}, null: false, default: []
      add :status, :string, null: false, default: "draft"
      add :published_at, :utc_datetime_usec
      add :settings, :map, null: false, default: %{}
      timestamps()
    end

    create unique_index(:events, [:slug])
    create index(:events, [:organizer_id])
    # The public listing always filters on status and orders by start time.
    create index(:events, [:status, :start_datetime])
    create index(:events, [:category, :start_datetime], where: "status = 'published'")

    # Full-text search without an external search service.
    execute(
      """
      ALTER TABLE events ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(location, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(description, '')), 'C')
        ) STORED
      """,
      "ALTER TABLE events DROP COLUMN search_vector"
    )

    execute(
      "CREATE INDEX events_search_vector_index ON events USING GIN (search_vector)",
      "DROP INDEX events_search_vector_index"
    )

    create table(:ticket_types) do
      add :event_id, references(:events, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :description, :text
      add :price, :decimal, precision: 12, scale: 2, null: false
      add :quantity_total, :integer, null: false
      add :quantity_sold, :integer, null: false, default: 0
      add :quantity_reserved, :integer, null: false, default: 0
      add :max_per_order, :integer, null: false, default: 10
      add :sale_start, :utc_datetime_usec
      add :sale_end, :utc_datetime_usec
      add :is_active, :boolean, null: false, default: true
      add :sort_order, :integer, null: false, default: 0
      add :settings, :map, null: false, default: %{}
      timestamps()
    end

    create index(:ticket_types, [:event_id])

    # The database itself refuses to oversell, even if application code is wrong.
    create constraint(:ticket_types, :inventory_within_capacity,
             check:
               "quantity_sold >= 0 AND quantity_reserved >= 0 AND quantity_sold + quantity_reserved <= quantity_total"
           )

    create constraint(:ticket_types, :price_not_negative, check: "price >= 0")

    create table(:promoter_codes) do
      add :code, :citext, null: false
      add :promoter_id, references(:users, on_delete: :delete_all), null: false
      add :event_id, references(:events, on_delete: :delete_all), null: false
      add :code_type, :string, null: false
      add :discount_percentage, :decimal, precision: 5, scale: 2
      add :commission_percentage, :decimal, precision: 5, scale: 2
      add :usage_limit, :integer
      add :times_used, :integer, null: false, default: 0
      add :is_active, :boolean, null: false, default: true
      add :valid_from, :utc_datetime_usec
      add :valid_until, :utc_datetime_usec
      timestamps()
    end

    create unique_index(:promoter_codes, [:code])
    create index(:promoter_codes, [:event_id])
    create index(:promoter_codes, [:promoter_id])

    create table(:orders) do
      add :user_id, references(:users, on_delete: :nilify_all)
      add :event_id, references(:events, on_delete: :restrict), null: false
      add :promoter_code_id, references(:promoter_codes, on_delete: :nilify_all)
      add :status, :string, null: false, default: "pending"
      add :currency, :string, null: false, default: "KES"
      add :subtotal, :decimal, precision: 12, scale: 2, null: false
      add :discount_amount, :decimal, precision: 12, scale: 2, null: false, default: 0
      add :amount, :decimal, precision: 12, scale: 2, null: false
      add :platform_fee, :decimal, precision: 12, scale: 2, null: false, default: 0
      add :attendee_name, :string, null: false
      add :attendee_email, :citext, null: false
      add :attendee_phone, :string
      add :payment_method, :string, null: false, default: "mpesa"
      add :mpesa_phone, :string
      add :mpesa_checkout_request_id, :string
      add :mpesa_merchant_request_id, :string
      add :mpesa_receipt, :string
      add :expires_at, :utc_datetime_usec, null: false
      add :paid_at, :utc_datetime_usec
      add :failure_reason, :text
      timestamps()
    end

    create index(:orders, [:user_id])
    create index(:orders, [:event_id, :status])
    create index(:orders, [:status, :expires_at], where: "status = 'pending'")
    create unique_index(:orders, [:mpesa_checkout_request_id])
    create unique_index(:orders, [:mpesa_receipt])

    create table(:order_items) do
      add :order_id, references(:orders, on_delete: :delete_all), null: false
      add :ticket_type_id, references(:ticket_types, on_delete: :restrict), null: false
      add :quantity, :integer, null: false
      add :unit_price, :decimal, precision: 12, scale: 2, null: false
      add :discount_amount, :decimal, precision: 12, scale: 2, null: false, default: 0
      timestamps(updated_at: false)
    end

    create index(:order_items, [:order_id])
    create constraint(:order_items, :quantity_positive, check: "quantity > 0")

    create table(:tickets) do
      add :order_id, references(:orders, on_delete: :delete_all), null: false
      add :ticket_type_id, references(:ticket_types, on_delete: :restrict), null: false
      add :event_id, references(:events, on_delete: :restrict), null: false
      add :user_id, references(:users, on_delete: :nilify_all)
      add :ticket_number, :string, null: false
      add :attendee_name, :string, null: false
      add :attendee_email, :citext, null: false
      add :attendee_phone, :string
      add :status, :string, null: false, default: "pending_payment"
      add :original_price, :decimal, precision: 12, scale: 2, null: false
      add :discount_amount, :decimal, precision: 12, scale: 2, null: false, default: 0
      add :final_price, :decimal, precision: 12, scale: 2, null: false
      add :is_guest_purchase, :boolean, null: false, default: false
      add :purchased_at, :utc_datetime_usec
      add :checked_in_at, :utc_datetime_usec
      add :checked_in_by_id, references(:users, on_delete: :nilify_all)
      add :check_in_location, :string
      timestamps()
    end

    create unique_index(:tickets, [:ticket_number])
    create index(:tickets, [:order_id])
    create index(:tickets, [:user_id, :status])
    create index(:tickets, [:event_id, :status])
    create index(:tickets, [:attendee_email])

    create table(:staff_assignments) do
      add :event_id, references(:events, on_delete: :delete_all), null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :assigned_by_id, references(:users, on_delete: :nilify_all)
      add :role, :string, null: false, default: "scanner"
      add :permissions, :map, null: false, default: %{}
      add :is_active, :boolean, null: false, default: true
      timestamps()
    end

    create unique_index(:staff_assignments, [:event_id, :user_id])
    create index(:staff_assignments, [:user_id])

    # Append-only audit trail of everything the payment provider tells us.
    create table(:payment_events) do
      add :order_id, references(:orders, on_delete: :nilify_all)
      add :kind, :string, null: false
      add :payload, :map, null: false, default: %{}
      timestamps(updated_at: false)
    end

    create index(:payment_events, [:order_id])
  end
end
