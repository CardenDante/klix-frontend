defmodule KlixWeb.AdminController do
  @moduledoc "Platform administration. Every state change is written to the audit log."
  use KlixWeb, :controller

  alias Klix.{Accounts, Audit, Events, Loyalty, Notifications, Promoters, Settlements}
  alias Klix.Accounts.User
  alias KlixWeb.JSON

  ## Organizers

  def list_organizers(conn, params) do
    {organizers, meta} = Accounts.list_organizers(params)
    json(conn, JSON.paginated(organizers, meta, &JSON.organizer/1))
  end

  def pending_organizers(conn, params) do
    list_organizers(conn, Map.put(params, "status", "pending"))
  end

  def approve_organizer(conn, %{"id" => id}) do
    with %{} = organizer <- fetch_organizer(id),
         {:ok, organizer} <- Accounts.approve_organizer(organizer, current_user(conn)) do
      audit(conn, "organizer.approve", organizer)
      notify_organizer(organizer)
      ok(conn, JSON.organizer(organizer), "Organizer approved")
    end
  end

  def reject_organizer(conn, %{"id" => id} = params) do
    with %{} = organizer <- fetch_organizer(id),
         {:ok, organizer} <- Accounts.reject_organizer(organizer, params["reason"]) do
      audit(conn, "organizer.reject", organizer, %{reason: params["reason"]})
      notify_organizer(organizer)
      ok(conn, JSON.organizer(organizer), "Organizer rejected")
    end
  end

  def suspend_organizer(conn, %{"id" => id} = params) do
    with %{} = organizer <- fetch_organizer(id),
         {:ok, organizer} <- Accounts.suspend_organizer(organizer, params["reason"]) do
      audit(conn, "organizer.suspend", organizer, %{reason: params["reason"]})
      ok(conn, JSON.organizer(organizer), "Organizer suspended")
    end
  end

  defp fetch_organizer(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Accounts.get_organizer(id)
      :error -> nil
    end
  end

  defp notify_organizer(organizer) do
    if user = Accounts.get_user(organizer.user_id), do: Notifications.organizer_reviewed(user, organizer)
  end

  ## Promoters

  def list_promoters(conn, params) do
    {profiles, meta} = Promoters.list_profiles(params)
    json(conn, JSON.paginated(profiles, meta, &JSON.promoter_profile/1))
  end

  def pending_promoters(conn, params), do: list_promoters(conn, Map.put(params, "status", "pending"))

  def approve_promoter(conn, %{"id" => id}) do
    with %{} = profile <- Promoters.get_profile_by_id(id),
         {:ok, profile} <- Promoters.approve_profile(profile, current_user(conn)) do
      audit(conn, "promoter.approve", profile)
      Notifications.promoter_reviewed(profile.user, profile)
      ok(conn, JSON.promoter_profile(profile), "Promoter approved")
    end
  end

  def reject_promoter(conn, %{"id" => id} = params) do
    with %{} = profile <- Promoters.get_profile_by_id(id),
         {:ok, profile} <- Promoters.reject_profile(profile, params["reason"]) do
      audit(conn, "promoter.reject", profile, %{reason: params["reason"]})
      if user = Accounts.get_user(profile.user_id), do: Notifications.promoter_reviewed(user, profile)
      ok(conn, JSON.promoter_profile(profile), "Promoter rejected")
    end
  end

  def suspend_promoter(conn, %{"id" => id} = params) do
    with %{} = profile <- Promoters.get_profile_by_id(id),
         {:ok, profile} <- Promoters.suspend_profile(profile, params["reason"]) do
      audit(conn, "promoter.suspend", profile, %{reason: params["reason"]})
      ok(conn, JSON.promoter_profile(profile), "Promoter suspended and their codes switched off")
    end
  end

  ## Users

  def list_users(conn, params) do
    {users, meta} = Accounts.list_users(params)
    json(conn, JSON.paginated(users, meta, &JSON.user/1))
  end

  def show_user(conn, %{"id" => id}) do
    with %{} = user <- fetch_user(id) do
      json(conn, %{
        user: JSON.user(user),
        loyalty: Loyalty.balance(user),
        organizer: (org = Accounts.get_organizer_for_user(user)) && JSON.organizer(org),
        promoter: (p = Promoters.get_profile(user)) && JSON.promoter_profile(p)
      })
    end
  end

  def update_role(conn, %{"id" => id, "role" => role}) do
    with %{} = user <- fetch_user(id),
         :ok <- not_self(conn, user),
         {:ok, user} <- Accounts.set_role(user, role) do
      audit(conn, "user.role", user, %{role: role})
      ok(conn, JSON.user(user), "Role updated")
    end
  end

  def update_role(_conn, _params), do: {:error, {:validation, "role is required"}}

  def suspend_user(conn, %{"id" => id} = params) do
    with %{} = user <- fetch_user(id),
         :ok <- not_self(conn, user),
         {:ok, user} <- Accounts.set_active(user, false) do
      audit(conn, "user.suspend", user, %{reason: params["reason"]})
      ok(conn, JSON.user(user), "User suspended")
    end
  end

  def unsuspend_user(conn, %{"id" => id}) do
    with %{} = user <- fetch_user(id),
         {:ok, user} <- Accounts.set_active(user, true) do
      audit(conn, "user.unsuspend", user)
      ok(conn, JSON.user(user), "User reactivated")
    end
  end

  def delete_user(conn, %{"id" => id} = params) do
    with %{} = user <- fetch_user(id),
         :ok <- not_self(conn, user),
         {:ok, _} <- Accounts.anonymize_user(user) do
      audit(conn, "user.delete", user, %{reason: params["reason"]})
      json(conn, %{success: true, message: "User deleted"})
    end
  end

  def adjust_loyalty(conn, %{"id" => id} = params) do
    with %{} = user <- fetch_user(id),
         {:ok, credits} <- parse_credits(params["credits"]),
         {:ok, _} <- Loyalty.adjust(user, credits, params["description"] || "Adjusted by Klix") do
      audit(conn, "loyalty.adjust", user, %{credits: credits, description: params["description"]})
      json(conn, Loyalty.balance(user))
    end
  end

  defp parse_credits(value) do
    case Integer.parse(to_string(value || "")) do
      {credits, ""} when credits != 0 -> {:ok, credits}
      _ -> {:error, {:validation, "credits must be a non-zero whole number"}}
    end
  end

  defp fetch_user(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Accounts.get_user(id)
      :error -> nil
    end
  end

  defp not_self(conn, %User{id: id}) do
    if current_user(conn).id == id, do: {:error, {:validation, "You can't do that to your own account"}}, else: :ok
  end

  ## Events

  def list_events(conn, params) do
    {events, meta} = Events.list_all_events(params)
    json(conn, JSON.paginated(events, meta, &JSON.event/1))
  end

  def flag_event(conn, %{"id" => id} = params) do
    with %{} = event <- Events.get_event(id),
         {:ok, event} <- Events.flag_event(event, params["reason"]) do
      audit(conn, "event.flag", event, %{reason: params["reason"]})
      ok(conn, JSON.event(event), "Event hidden from the public")
    end
  end

  def unflag_event(conn, %{"id" => id}) do
    with %{} = event <- Events.get_event(id),
         {:ok, event} <- Events.unflag_event(event) do
      audit(conn, "event.unflag", event)
      ok(conn, JSON.event(event), "Event restored")
    end
  end

  @doc "Deletes an event outright if it never sold anything; otherwise cancels and hides it."
  def force_delete_event(conn, %{"id" => id} = params) do
    with %{} = event <- Events.get_event(id) do
      audit(conn, "event.force_delete", event, %{reason: params["reason"], title: event.title})

      case Events.delete_event(event) do
        {:ok, _} ->
          json(conn, %{success: true, message: "Event deleted"})

        {:error, :has_orders} ->
          {:ok, event} = Events.cancel_event(event)
          {:ok, _} = Events.flag_event(event, params["reason"] || "Removed by Klix")
          json(conn, %{success: true, message: "Event had orders, so it was cancelled and hidden instead"})

        error ->
          error
      end
    end
  end

  ## Promoter payouts

  def list_withdrawals(conn, params) do
    {withdrawals, meta} = Promoters.list_all_withdrawals(params)
    json(conn, JSON.paginated(withdrawals, meta, &JSON.withdrawal/1))
  end

  def pay_withdrawal(conn, %{"id" => id} = params) do
    with %{} = w <- Promoters.get_withdrawal(id),
         {:ok, w} <- Promoters.mark_withdrawal_paid(w, current_user(conn), params["reference"]) do
      audit(conn, "withdrawal.paid", w, %{amount: w.amount, reference: params["reference"]})
      if user = Accounts.get_user(w.promoter_id), do: Notifications.withdrawal_paid(user, w)
      ok(conn, JSON.withdrawal(w), "Marked as paid")
    end
  end

  def reject_withdrawal(conn, %{"id" => id} = params) do
    with %{} = w <- Promoters.get_withdrawal(id),
         {:ok, w} <- Promoters.reject_withdrawal(w, current_user(conn), params["note"]) do
      audit(conn, "withdrawal.reject", w, %{note: params["note"]})
      ok(conn, JSON.withdrawal(w), "Withdrawal rejected")
    end
  end

  ## Organizer settlements

  def pending_settlements(conn, params), do: ok(conn, Settlements.pending(params))

  def paid_settlements(conn, params) do
    {settlements, meta} = Settlements.list_paid(params)
    json(conn, JSON.paginated(settlements, meta, &JSON.settlement/1))
  end

  def settle_event(conn, %{"event_id" => event_id} = params) do
    with %{} = event <- Events.get_event(event_id),
         {:ok, settlement} <- Settlements.mark_paid(event, current_user(conn), params) do
      audit(conn, "settlement.paid", event, %{net_payable: settlement.net_payable, reference: params["reference"]})
      ok(conn, JSON.settlement(settlement), "Settlement recorded")
    end
  end

  ## Audit log

  def audit_logs(conn, params) do
    {logs, meta} = Audit.list(params)
    json(conn, JSON.paginated(logs, meta, &JSON.audit_log/1))
  end

  defp audit(conn, action, target, metadata \\ %{}) do
    ip = conn.remote_ip |> :inet.ntoa() |> to_string()
    Audit.log(current_user(conn), action, target, metadata, ip)
  end
end
