defmodule Klix.Accounts do
  @moduledoc "Users, sessions and organizer profiles."

  import Ecto.Query
  alias Ecto.Multi
  alias Klix.Repo
  alias Klix.Accounts.{User, Organizer, RefreshToken, Token, Firebase}

  ## Users

  def get_user(id), do: Repo.get(User, id)
  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: String.downcase(String.trim(email)))
  end

  def register_user(attrs) do
    %User{} |> User.registration_changeset(attrs) |> Repo.insert()
  end

  def authenticate(email, password) when is_binary(email) and is_binary(password) do
    user = get_user_by_email(email)

    cond do
      !User.valid_password?(user, password) -> {:error, :invalid_credentials}
      !user.is_active -> {:error, :account_disabled}
      true -> {:ok, user}
    end
  end

  def authenticate(_, _), do: {:error, :invalid_credentials}

  @doc """
  Signs a user in with a Firebase ID token, creating the account on first
  login and linking it to an existing email/password account if one exists.
  """
  def login_with_firebase(id_token) do
    with {:ok, claims} <- Firebase.verify_id_token(id_token) do
      uid = claims["sub"]
      email = claims["email"]
      {first, last} = split_name(claims["name"])

      # Only link to an existing account by email when Google vouches for
      # the address; otherwise anyone could claim someone else's account.
      user =
        Repo.get_by(User, firebase_uid: uid) ||
          (email && claims["email_verified"] == true && get_user_by_email(email)) ||
          nil

      result =
        case user do
          nil ->
            %User{}
            |> User.firebase_changeset(%{
              email: email,
              firebase_uid: uid,
              first_name: first,
              last_name: last,
              email_verified: claims["email_verified"] == true,
              profile_image_url: claims["picture"]
            })
            |> Repo.insert()

          %User{firebase_uid: nil} = user ->
            user
            |> Ecto.Changeset.change(
              firebase_uid: uid,
              email_verified: user.email_verified or claims["email_verified"] == true
            )
            |> Repo.update()

          user ->
            {:ok, user}
        end

      with {:ok, user} <- result do
        if user.is_active, do: {:ok, user}, else: {:error, :account_disabled}
      end
    end
  end

  defp split_name(nil), do: {nil, nil}

  defp split_name(name) do
    case String.split(String.trim(name), " ", parts: 2) do
      [first, last] -> {first, last}
      [first] -> {first, nil}
    end
  end

  def update_profile(%User{} = user, attrs) do
    user |> User.profile_changeset(attrs) |> Repo.update()
  end

  def update_preferences(%User{} = user, prefs) when is_map(prefs) do
    user
    |> User.profile_changeset(%{preferences: Map.merge(user.preferences || %{}, prefs)})
    |> Repo.update()
  end

  ## Sessions

  @doc "Issues a fresh access/refresh token pair."
  def create_session(%User{} = user) do
    refresh = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    ttl = Application.fetch_env!(:klix, :auth)[:refresh_token_ttl_seconds]

    Repo.insert!(%RefreshToken{
      user_id: user.id,
      token_hash: RefreshToken.hash(refresh),
      expires_at: DateTime.add(DateTime.utc_now(), ttl, :second)
    })

    {:ok, access, _claims} = Token.sign_access(user)

    %{
      access_token: access,
      refresh_token: refresh,
      token_type: "bearer",
      expires_in: Token.ttl()
    }
  end

  @doc """
  Exchanges a refresh token for a new pair. Refresh tokens are single use:
  the old one is revoked atomically, so a stolen token that is replayed
  after the real client refreshed simply stops working.
  """
  def refresh_session(refresh) when is_binary(refresh) do
    now = DateTime.utc_now()
    hash = RefreshToken.hash(refresh)

    query =
      from t in RefreshToken,
        where: t.token_hash == ^hash and is_nil(t.revoked_at) and t.expires_at > ^now,
        select: t.user_id

    case Repo.update_all(query, set: [revoked_at: now]) do
      {1, [user_id]} ->
        case get_user(user_id) do
          %User{is_active: true} = user -> {:ok, create_session(user)}
          _ -> {:error, :invalid_token}
        end

      _ ->
        {:error, :invalid_token}
    end
  end

  def refresh_session(_), do: {:error, :invalid_token}

  def revoke_refresh_token(refresh) when is_binary(refresh) do
    hash = RefreshToken.hash(refresh)

    from(t in RefreshToken, where: t.token_hash == ^hash and is_nil(t.revoked_at))
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  def revoke_refresh_token(_), do: :ok

  def revoke_all_sessions(%User{id: user_id}) do
    from(t in RefreshToken, where: t.user_id == ^user_id and is_nil(t.revoked_at))
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  ## Organizers

  def get_organizer(id), do: Repo.get(Organizer, id)
  def get_organizer_for_user(%User{id: user_id}), do: Repo.get_by(Organizer, user_id: user_id)

  def apply_as_organizer(%User{} = user, attrs) do
    %Organizer{user_id: user.id}
    |> Organizer.changeset(attrs)
    |> Repo.insert()
  end

  def update_organizer(%Organizer{} = organizer, attrs) do
    organizer |> Organizer.changeset(attrs) |> Repo.update()
  end

  def list_organizers(params) do
    Organizer
    |> maybe_filter_status(params["status"])
    |> order_by(desc: :inserted_at)
    |> preload(:user)
    |> Repo.paginate(params)
  end

  defp maybe_filter_status(query, status) when status in [nil, ""], do: query
  defp maybe_filter_status(query, status), do: where(query, status: ^status)

  @doc "Approves an organizer and promotes the owning user to the organizer role."
  def approve_organizer(%Organizer{} = organizer, %User{} = admin) do
    Multi.new()
    |> Multi.update(
      :organizer,
      Organizer.review_changeset(organizer, %{
        status: "approved",
        approved_at: DateTime.utc_now(),
        approved_by_id: admin.id,
        rejection_reason: nil
      })
    )
    |> Multi.run(:user, fn repo, %{organizer: org} ->
      user = repo.get!(User, org.user_id)

      if user.role == "admin",
        do: {:ok, user},
        else: user |> User.role_changeset("organizer") |> repo.update()
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{organizer: organizer}} -> {:ok, organizer}
      {:error, _step, reason, _} -> {:error, reason}
    end
  end

  def reject_organizer(%Organizer{} = organizer, reason) do
    organizer
    |> Organizer.review_changeset(%{status: "rejected", rejection_reason: reason})
    |> Repo.update()
  end

  def suspend_organizer(%Organizer{} = organizer, reason) do
    organizer
    |> Organizer.review_changeset(%{status: "suspended", rejection_reason: reason})
    |> Repo.update()
  end
end
