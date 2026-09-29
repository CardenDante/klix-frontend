defmodule KlixWeb.FallbackController do
  @moduledoc """
  Turns `{:error, ...}` results into responses. Errors always carry a
  human-readable `detail`, like the previous API.
  """
  use Phoenix.Controller, formats: [:json]
  import Plug.Conn

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    errors = KlixWeb.JSON.changeset_errors(changeset)

    detail =
      case Enum.at(errors, 0) do
        {field, [msg | _]} -> "#{Phoenix.Naming.humanize(field)} #{msg}"
        _ -> "Validation failed"
      end

    conn |> put_status(422) |> json(%{detail: detail, errors: errors})
  end

  def call(conn, {:error, {:validation, message}}), do: error(conn, 400, message)
  def call(conn, {:error, {:not_found, message}}), do: error(conn, 404, message)
  def call(conn, {:error, {:sold_out, message}}), do: error(conn, 409, message)
  def call(conn, {:error, {:payment_provider, message}}), do: error(conn, 502, message)

  def call(conn, {:error, :not_found}), do: error(conn, 404, "Not found")
  def call(conn, :error), do: error(conn, 404, "Not found")

  def call(conn, {:error, :promoter_not_approved}),
    do: error(conn, 403, "Your promoter account has not been approved yet")
  def call(conn, nil), do: error(conn, 404, "Not found")
  def call(conn, {:error, :forbidden}), do: error(conn, 403, "You don't have permission to do that")
  def call(conn, {:error, :invalid_credentials}), do: error(conn, 401, "Incorrect email or password")
  def call(conn, {:error, :account_disabled}), do: error(conn, 403, "This account has been disabled")
  def call(conn, {:error, :invalid_token}), do: error(conn, 401, "Invalid or expired token")

  def call(conn, {:error, :organizer_not_approved}),
    do: error(conn, 403, "Your organizer account has not been approved yet")

  def call(conn, {:error, :no_ticket_types}),
    do: error(conn, 400, "Add at least one active ticket type before publishing")

  def call(conn, {:error, :event_in_past}), do: error(conn, 400, "This event has already ended")

  def call(conn, {:error, :has_orders}),
    do: error(conn, 409, "This event already has orders; cancel it instead of deleting it")

  def call(conn, {:error, :firebase_not_configured}),
    do: error(conn, 503, "Google sign-in is not configured")

  def call(conn, {:error, reason}) when is_atom(reason) do
    error(conn, 400, reason |> Atom.to_string() |> String.replace("_", " ") |> String.capitalize())
  end

  defp error(conn, status, detail) do
    conn |> put_status(status) |> json(%{detail: detail})
  end
end
