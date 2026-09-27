defmodule Klix.Staff do
  @moduledoc "People an organizer lets scan tickets at their events."

  import Ecto.Query
  alias Klix.Repo
  alias Klix.Accounts
  alias Klix.Accounts.User
  alias Klix.Events
  alias Klix.Events.Event
  alias Klix.Staff.Assignment

  def list_for_event(event_id, opts \\ []) do
    from(a in Assignment, where: a.event_id == ^event_id, preload: [:user], order_by: a.inserted_at)
    |> then(fn q -> if opts[:include_inactive], do: q, else: where(q, [a], a.is_active) end)
    |> Repo.all()
  end

  def list_for_user(%User{id: user_id}) do
    from(a in Assignment,
      join: e in assoc(a, :event),
      where: a.user_id == ^user_id and a.is_active,
      order_by: [asc: e.start_datetime],
      preload: [event: e]
    )
    |> Repo.all()
  end

  def get_assignment(event_id, id) do
    with {:ok, id} <- Ecto.UUID.cast(id) do
      Repo.one(from a in Assignment, where: a.id == ^id and a.event_id == ^event_id, preload: [:user])
    else
      _ -> nil
    end
  end

  @doc "Assigns an existing user (looked up by email or id) to an event."
  def assign(%Event{} = event, %User{} = assigned_by, attrs) do
    user =
      cond do
        attrs["email"] -> Accounts.get_user_by_email(attrs["email"])
        attrs["user_id"] -> Accounts.get_user(attrs["user_id"])
        true -> nil
      end

    case user do
      nil ->
        {:error, {:not_found, "No Klix account with that email. Ask them to sign up first."}}

      user ->
        %Assignment{event_id: event.id, user_id: user.id, assigned_by_id: assigned_by.id}
        |> Assignment.changeset(attrs)
        |> Repo.insert()
        |> case do
          {:ok, assignment} ->
            if user.role == "attendee", do: user |> User.role_changeset("event_staff") |> Repo.update()
            {:ok, Repo.preload(assignment, :user)}

          error ->
            error
        end
    end
  end

  def update_assignment(%Assignment{} = assignment, attrs) do
    assignment |> Assignment.changeset(attrs) |> Repo.update()
  end

  def remove_assignment(%Assignment{} = assignment), do: Repo.delete(assignment)

  @doc "Staff assigned to the event, its organizer and admins may scan tickets."
  def can_scan?(%User{role: "admin"}, _event_id), do: true

  def can_scan?(%User{} = user, event_id) do
    Repo.exists?(
      from a in Assignment,
        where: a.user_id == ^user.id and a.event_id == ^event_id and a.is_active
    ) or
      case Events.get_event(event_id) do
        nil -> false
        event -> Events.can_manage?(user, event)
      end
  end

  def can_scan?(_, _), do: false
end
