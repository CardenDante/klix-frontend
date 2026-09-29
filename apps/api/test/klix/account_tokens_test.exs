defmodule Klix.AccountTokensTest do
  use Klix.DataCase, async: true

  alias Klix.Accounts
  alias Klix.Notifications.Workers.Deliver

  # The plain token only exists in the queued email; fish it out of there.
  defp token_from_email(to, path) do
    [job | _] = all_enqueued(worker: Deliver) |> Enum.filter(&(&1.args["to"] == to))
    [_, token] = Regex.run(~r{#{path}\?token=([\w-]+)}, job.args["text"])
    token
  end

  test "password reset: token works once, signs out everywhere, verifies email" do
    user = user_fixture()
    %{refresh_token: refresh} = Accounts.create_session(user)

    :ok = Accounts.request_password_reset(user.email)
    token = token_from_email(user.email, "/reset-password")

    assert {:error, %Ecto.Changeset{}} = Accounts.reset_password(token, "short")
    assert {:ok, updated} = Accounts.reset_password(token, "a-brand-new-password")
    assert updated.email_verified
    assert {:ok, _} = Accounts.authenticate(user.email, "a-brand-new-password")
    assert {:error, :invalid_token} = Accounts.refresh_session(refresh)
    assert {:error, :invalid_token} = Accounts.reset_password(token, "another-password")
  end

  test "unknown emails get the same answer and no email" do
    assert :ok = Accounts.request_password_reset("nobody@nowhere.test")
    assert all_enqueued(worker: Deliver) == []
  end

  test "email verification" do
    user = user_fixture()
    :ok = Accounts.request_email_verification(user)
    token = token_from_email(user.email, "/verify-email")

    assert {:ok, verified} = Accounts.verify_email(token)
    assert verified.email_verified
    assert {:error, :invalid_token} = Accounts.verify_email(token)
    assert {:error, {:validation, _}} = Accounts.request_email_verification(verified)
  end

  test "suspending revokes sessions and anonymizing scrubs personal data" do
    user = user_fixture()
    %{refresh_token: refresh} = Accounts.create_session(user)

    {:ok, suspended} = Accounts.set_active(user, false)
    refute suspended.is_active
    assert {:error, :invalid_token} = Accounts.refresh_session(refresh)

    {:ok, gone} = Accounts.anonymize_user(user)
    assert gone.email =~ "@deleted.klix"
    assert is_nil(gone.phone_number)
  end
end
