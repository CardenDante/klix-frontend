defmodule KlixWeb.ControllerHelpers do
  @moduledoc false

  def current_user(conn), do: conn.assigns[:current_user]

  def ok(conn, data, message \\ nil) do
    body = %{success: true, data: data}
    body = if message, do: Map.put(body, :message, message), else: body
    Phoenix.Controller.json(conn, body)
  end
end
