defmodule KlixWeb.PromoterRequestController do
  @moduledoc "Promoters asking to sell events, and organizers answering."
  use KlixWeb, :controller

  alias Klix.{Accounts, Audit, Events, Promoters}
  alias KlixWeb.JSON

  ## Promoter side

  def request_event(conn, params) do
    with {:ok, approval} <- Promoters.request_event(current_user(conn), params["event_id"], params["message"]) do
      conn |> put_status(201) |> json(JSON.event_approval(Klix.Repo.preload(approval, :event)))
    end
  end

  def my_requests(conn, params) do
    requests = Promoters.list_my_requests(current_user(conn), params["status_filter"] || params["status"])
    json(conn, Enum.map(requests, &JSON.event_approval/1))
  end

  def approved_events(conn, _params) do
    json(conn, Enum.map(Promoters.approved_events(current_user(conn)), &JSON.event_approval/1))
  end

  ## Organizer side

  def organizer_requests(conn, params) do
    with {:ok, organizer} <- organizer(conn) do
      requests = Promoters.list_requests_for_organizer(organizer, params)
      json(conn, %{success: true, requests: Enum.map(requests, &JSON.event_approval/1)})
    end
  end

  def approve(conn, %{"id" => id} = params) do
    with {:ok, approval} <- fetch(conn, id),
         {:ok, approval} <- Promoters.approve_request(approval, params) do
      Audit.log(current_user(conn), "promoter_request.approve", approval, Map.take(params, ["commission_percentage", "discount_percentage"]))
      ok(conn, JSON.event_approval(approval), "Promoter approved")
    end
  end

  def reject(conn, %{"id" => id} = params) do
    with {:ok, approval} <- fetch(conn, id),
         {:ok, approval} <- Promoters.reject_request(approval, params["response_message"]) do
      ok(conn, JSON.event_approval(approval), "Request declined")
    end
  end

  def revoke(conn, %{"id" => id} = params) do
    with {:ok, approval} <- fetch(conn, id),
         {:ok, approval} <- Promoters.revoke_request(approval, params["response_message"]) do
      Audit.log(current_user(conn), "promoter_request.revoke", approval)
      ok(conn, JSON.event_approval(approval), "Promoter removed and their codes switched off")
    end
  end

  def update_terms(conn, %{"id" => id} = params) do
    with {:ok, approval} <- fetch(conn, id),
         {:ok, approval} <- Promoters.update_terms(approval, params) do
      ok(conn, JSON.event_approval(approval), "Terms updated")
    end
  end

  def approved_promoters(conn, %{"event_id" => event_id}) do
    with %{} = event <- Events.get_event(event_id),
         true <- Events.can_manage?(current_user(conn), event) || {:error, :forbidden} do
      json(conn, %{success: true, promoters: Enum.map(Promoters.approved_promoters_for_event(event.id), &JSON.event_approval/1)})
    end
  end

  defp organizer(conn) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil -> {:error, :organizer_not_approved}
      organizer -> {:ok, organizer}
    end
  end

  defp fetch(conn, id) do
    with {:ok, organizer} <- organizer(conn) do
      case Promoters.get_request_for_organizer(organizer, id) do
        nil -> {:error, {:not_found, "Request not found"}}
        approval -> {:ok, Klix.Repo.preload(approval, :event)}
      end
    end
  end
end
