defmodule KlixWeb.PromoterController do
  use KlixWeb, :controller

  alias Klix.Promoters
  alias KlixWeb.JSON

  ## Public

  def validate_code(conn, %{"code" => code, "event_id" => event_id}) do
    case Promoters.validate_code(code, event_id) do
      {:ok, promoter_code} ->
        json(conn, %{success: true, valid: true, data: JSON.promoter_code_validation(promoter_code)})

      {:error, message} ->
        json(conn, %{success: true, valid: false, data: %{message: message}})
    end
  end

  def validate_code(_conn, _params), do: {:error, {:validation, "code and event_id are required"}}

  @doc "Counts a visit from a shared promoter link (?ref=CODE)."
  def track_click(conn, %{"code" => code}) do
    _ = Promoters.track_click(code)
    json(conn, %{success: true})
  end

  def track_click(conn, _params), do: json(conn, %{success: true})

  def leaderboard(conn, params) do
    ok(conn, Promoters.leaderboard(params))
  end

  ## Profile

  def create_application(conn, params) do
    with {:ok, profile} <- Promoters.apply_as_promoter(current_user(conn), params) do
      conn |> put_status(201) |> json(JSON.promoter_profile(profile))
    end
  end

  def me(conn, _params) do
    case Promoters.get_profile(current_user(conn)) do
      nil -> {:error, {:not_found, "You have not applied to be a promoter"}}
      profile -> json(conn, JSON.promoter_profile(profile))
    end
  end

  def update_me(conn, params) do
    with %{} = profile <- Promoters.get_profile(current_user(conn)),
         {:ok, profile} <- Promoters.update_profile(profile, params) do
      json(conn, JSON.promoter_profile(profile))
    end
  end

  ## Codes (approved promoters)

  def create_code(conn, params) do
    with {:ok, code} <- Promoters.create_code(current_user(conn), params) do
      code = Klix.Repo.preload(code, :event)
      conn |> put_status(201) |> json(JSON.promoter_code(Map.put(code, :stats, empty_stats())))
    end
  end

  defp empty_stats,
    do: %{tickets_sold: 0, revenue_generated: "0", total_discount_given: "0", total_commission_earned: "0", conversion_rate: nil}

  def my_codes(conn, params) do
    codes = Promoters.list_codes(current_user(conn), params)
    json(conn, Enum.map(codes, &JSON.promoter_code/1))
  end

  def code_analytics(conn, %{"id" => id}) do
    case Promoters.get_code_for_promoter(current_user(conn), id) do
      nil -> {:error, {:not_found, "Code not found"}}
      code -> ok(conn, JSON.promoter_code(code))
    end
  end

  def deactivate_code(conn, %{"id" => id}) do
    with %{} = code <- Promoters.get_code_for_promoter(current_user(conn), id),
         {:ok, _} <- Promoters.deactivate_code(code) do
      json(conn, %{success: true, message: "Code deactivated"})
    end
  end

  ## Money

  def earnings(conn, _params), do: ok(conn, Promoters.earnings(current_user(conn)))

  def withdraw(conn, params) do
    with {:ok, withdrawal} <- Promoters.request_withdrawal(current_user(conn), params) do
      conn |> put_status(201) |> ok(JSON.withdrawal(withdrawal), "Withdrawal requested")
    end
  end

  def withdrawals(conn, params) do
    limit =
      case Integer.parse(to_string(params["limit"] || "50")) do
        {n, _} when n > 0 -> min(n, 200)
        _ -> 50
      end

    ok(conn, Enum.map(Promoters.list_withdrawals(current_user(conn), limit), &JSON.withdrawal/1))
  end

  def dashboard(conn, _params) do
    ok(conn, Promoters.dashboard(current_user(conn)))
  end
end
