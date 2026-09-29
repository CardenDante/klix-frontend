defmodule KlixWeb.AnalyticsController do
  use KlixWeb, :controller

  alias Klix.{Accounts, Analytics, Events, Promoters}

  def organizer_dashboard(conn, _params) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil -> {:error, :organizer_not_approved}
      organizer -> json(conn, Analytics.organizer_dashboard(organizer))
    end
  end

  def event_stats(conn, %{"event_id" => event_id}) do
    with %{} = event <- Events.get_event(event_id),
         true <- Events.can_manage?(current_user(conn), event) || {:error, :forbidden} do
      json(conn, Analytics.event_analytics(event))
    end
  end

  def promoter_dashboard(conn, _params) do
    ok(conn, Promoters.dashboard(current_user(conn)))
  end

  def admin_overview(conn, _params), do: json(conn, Analytics.admin_overview())
end
