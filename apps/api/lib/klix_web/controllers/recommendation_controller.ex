defmodule KlixWeb.RecommendationController do
  use KlixWeb, :controller

  alias Klix.{Accounts, Recommendations}
  alias KlixWeb.JSON

  @cache "public, max-age=60, stale-while-revalidate=120"

  def trending(conn, params), do: events(conn, Recommendations.trending(params), @cache)
  def popular(conn, params), do: events(conn, Recommendations.popular(params), @cache)

  def similar(conn, %{"event_id" => id} = params) do
    limit =
      case Integer.parse(to_string(params["limit"] || "6")) do
        {n, _} when n > 0 -> min(n, 20)
        _ -> 6
      end

    events(conn, Recommendations.similar(id, limit), @cache)
  end

  def for_you(conn, params) do
    case current_user(conn) do
      nil -> events(conn, Recommendations.trending(params), @cache)
      user -> events(conn, Recommendations.for_you(user, params), "private, no-store")
    end
  end

  def discovery(conn, _params) do
    sections = Recommendations.discovery(current_user(conn))
    json(conn, %{success: true, data: Map.new(sections, fn {k, list} -> {k, Enum.map(list, &JSON.event/1)} end)})
  end

  def preferences(conn, _params) do
    json(conn, %{success: true, data: current_user(conn).preferences || %{}})
  end

  def update_preferences(conn, params) do
    prefs = Map.take(params, ~w(preferred_categories preferred_location notification_email notification_sms marketing_emails))

    with {:ok, user} <- Accounts.update_preferences(current_user(conn), prefs) do
      json(conn, %{success: true, data: user.preferences})
    end
  end

  ## Search helpers

  def suggestions(conn, params) do
    limit =
      case Integer.parse(to_string(params["limit"] || "8")) do
        {n, _} when n > 0 -> min(n, 20)
        _ -> 8
      end

    json(conn, %{success: true, data: Recommendations.suggestions(params["q"] || "", limit)})
  end

  def facets(conn, _params), do: json(conn, %{success: true, data: Recommendations.facets()})

  def nearby(conn, params) do
    with list when is_list(list) <- Recommendations.nearby(params) do
      events(conn, list, "public, max-age=60")
    end
  end

  defp events(conn, list, cache) do
    conn
    |> put_resp_header("cache-control", cache)
    |> json(%{success: true, data: Enum.map(list, &JSON.event/1)})
  end
end
