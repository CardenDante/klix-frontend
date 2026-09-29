defmodule Klix.Accounts.User do
  use Klix.Schema

  @roles ~w(attendee promoter organizer event_staff admin)

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :firebase_uid, :string
    field :first_name, :string
    field :last_name, :string
    field :phone_number, :string
    field :role, :string, default: "attendee"
    field :is_active, :boolean, default: true
    field :email_verified, :boolean, default: false
    field :profile_image_url, :string
    field :preferences, :map, default: %{}

    has_one :organizer, Klix.Accounts.Organizer

    timestamps()
  end

  def roles, do: @roles

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :first_name, :last_name, :phone_number])
    |> validate_email()
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
    |> validate_profile()
    |> hash_password()
  end

  def firebase_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :firebase_uid, :first_name, :last_name, :email_verified, :profile_image_url])
    |> validate_email()
    |> validate_required([:firebase_uid])
    |> unique_constraint(:firebase_uid)
  end

  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
    |> hash_password()
  end

  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:first_name, :last_name, :phone_number, :profile_image_url, :preferences])
    |> validate_profile()
  end

  def role_changeset(user, role) do
    user
    |> change(role: role)
    |> validate_inclusion(:role, @roles)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> update_change(:email, &(&1 |> String.trim() |> String.downcase()))
    |> validate_format(:email, ~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "must be a valid email")
    |> validate_length(:email, max: 160)
    |> unique_constraint(:email)
  end

  defp validate_profile(changeset) do
    changeset
    |> validate_length(:first_name, max: 100)
    |> validate_length(:last_name, max: 100)
    |> update_change(:phone_number, &Klix.Phone.normalize/1)
    |> validate_format(:phone_number, ~r/^254\d{9}$/,
      message: "must be a valid Kenyan phone number"
    )
  end

  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil ->
        changeset

      password when changeset.valid? ->
        changeset
        |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(password))
        |> delete_change(:password)

      _ ->
        changeset
    end
  end

  def valid_password?(%__MODULE__{hashed_password: hashed}, password)
      when is_binary(hashed) and is_binary(password),
      do: Bcrypt.verify_pass(password, hashed)

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end

  def full_name(%__MODULE__{first_name: first, last_name: last}) do
    [first, last] |> Enum.reject(&(&1 in [nil, ""])) |> Enum.join(" ")
  end
end
