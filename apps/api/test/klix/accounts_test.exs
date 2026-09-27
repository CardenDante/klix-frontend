defmodule Klix.AccountsTest do
  use Klix.DataCase, async: true

  alias Klix.Accounts

  test "register and authenticate" do
    {:ok, user} =
      Accounts.register_user(%{"email" => " Mixed@Case.test ", "password" => "password123"})

    assert user.email == "mixed@case.test"
    assert {:ok, _} = Accounts.authenticate("MIXED@case.test", "password123")
    assert {:error, :invalid_credentials} = Accounts.authenticate("mixed@case.test", "wrong")
    assert {:error, :invalid_credentials} = Accounts.authenticate("nobody@case.test", "password123")
  end

  test "rejects short passwords and duplicate emails" do
    assert {:error, cs} = Accounts.register_user(%{"email" => "a@b.co", "password" => "short"})
    assert %{password: [_]} = errors_on(cs)

    user = user_fixture()
    assert {:error, cs} = Accounts.register_user(%{"email" => user.email, "password" => "password123"})
    assert %{email: ["has already been taken"]} = errors_on(cs)
  end

  test "normalizes Kenyan phone numbers" do
    user = user_fixture(%{"phone_number" => "+254 712 345 678"})
    assert user.phone_number == "254712345678"
  end

  test "refresh tokens rotate and cannot be replayed" do
    user = user_fixture()
    %{refresh_token: first} = Accounts.create_session(user)

    assert {:ok, %{refresh_token: second}} = Accounts.refresh_session(first)
    assert {:error, :invalid_token} = Accounts.refresh_session(first)
    assert {:ok, _} = Accounts.refresh_session(second)
  end

  test "access tokens round-trip" do
    user = user_fixture()
    %{access_token: token} = Accounts.create_session(user)
    assert {:ok, user_id, %{"role" => "attendee"}} = Accounts.Token.verify_access(token)
    assert user_id == user.id
    assert {:error, _} = Accounts.Token.verify_access(token <> "x")
  end

  test "approving an organizer promotes the user" do
    user = user_fixture()
    {:ok, organizer} = Accounts.apply_as_organizer(user, %{"business_name" => "Acme Events"})
    assert organizer.status == "pending"

    {:ok, organizer} = Accounts.approve_organizer(organizer, admin_fixture())
    assert organizer.status == "approved"
    assert Accounts.get_user!(user.id).role == "organizer"
  end
end
