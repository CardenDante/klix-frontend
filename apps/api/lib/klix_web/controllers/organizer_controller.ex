defmodule KlixWeb.OrganizerController do
  use KlixWeb, :controller

  alias Klix.{Accounts, Audit, Payments, Settlements}
  alias KlixWeb.JSON

  def create_application(conn, params) do
    with {:ok, organizer} <- Accounts.apply_as_organizer(current_user(conn), params) do
      conn |> put_status(201) |> json(JSON.organizer(organizer))
    end
  end

  def me(conn, _params) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil -> {:error, {:not_found, "You have not applied to be an organizer"}}
      organizer -> json(conn, JSON.organizer(organizer))
    end
  end

  def update(conn, params) do
    with %{} = organizer <- Accounts.get_organizer_for_user(current_user(conn)),
         {:ok, organizer} <- Accounts.update_organizer(organizer, params) do
      json(conn, JSON.organizer(organizer))
    end
  end

  ## M-Pesa: organizers can be paid straight into their own paybill or till

  def mpesa(conn, _params) do
    with {:ok, organizer} <- organizer(conn) do
      case Payments.get_credential(organizer) do
        nil -> json(conn, %{success: true, data: nil})
        credential -> ok(conn, JSON.mpesa_credential(credential))
      end
    end
  end

  def save_mpesa(conn, params) do
    with {:ok, organizer} <- organizer(conn),
         {:ok, credential} <- Payments.save_credential(organizer, params) do
      Audit.log(current_user(conn), "mpesa_credential.save", credential, %{shortcode: JSON.mpesa_credential(credential).shortcode_masked})
      ok(conn, JSON.mpesa_credential(credential), "Saved. Verify the credentials to start receiving payments.")
    end
  end

  def verify_mpesa(conn, _params) do
    with {:ok, organizer} <- organizer(conn),
         %{} = credential <- Payments.get_credential(organizer) || {:error, {:not_found, "Add your M-Pesa credentials first"}},
         {:ok, credential} <- Payments.verify_credential(credential) do
      Audit.log(current_user(conn), "mpesa_credential.verify", credential)
      ok(conn, JSON.mpesa_credential(credential), "Verified. New payments for your events go straight to your account.")
    end
  end

  def delete_mpesa(conn, _params) do
    with {:ok, organizer} <- organizer(conn),
         %{} = credential <- Payments.get_credential(organizer) || {:error, {:not_found, "No credentials saved"}},
         {:ok, _} <- Payments.delete_credential(credential) do
      Audit.log(current_user(conn), "mpesa_credential.delete", credential)
      json(conn, %{success: true, message: "Removed. Payments go to the Klix account again."})
    end
  end

  def settlements(conn, _params) do
    with {:ok, organizer} <- organizer(conn) do
      ok(conn, Settlements.organizer_statements(organizer))
    end
  end

  defp organizer(conn) do
    case Accounts.get_organizer_for_user(current_user(conn)) do
      nil -> {:error, {:not_found, "You have not applied to be an organizer"}}
      organizer -> {:ok, organizer}
    end
  end
end
