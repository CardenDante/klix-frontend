defmodule KlixWeb.PromoterController do
  use KlixWeb, :controller

  alias Klix.Promoters
  alias KlixWeb.JSON

  def validate_code(conn, %{"code" => code, "event_id" => event_id}) do
    case Promoters.validate_code(code, event_id) do
      {:ok, promoter_code} ->
        json(conn, %{success: true, valid: true, data: JSON.promoter_code_validation(promoter_code)})

      {:error, message} ->
        json(conn, %{success: true, valid: false, data: %{message: message}})
    end
  end

  def validate_code(_conn, _params), do: {:error, {:validation, "code and event_id are required"}}
end
