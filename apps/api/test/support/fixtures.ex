defmodule Klix.Fixtures do
  @moduledoc "Builders for test data."

  alias Klix.{Accounts, Events, Repo}
  alias Klix.Accounts.User

  def unique_email, do: "user#{System.unique_integer([:positive])}@klix.test"

  def user_fixture(attrs \\ %{}) do
    {role, attrs} = Map.pop(Map.new(attrs), :role, "attendee")
    {verified, attrs} = Map.pop(attrs, :email_verified, false)

    {:ok, user} =
      attrs
      |> Enum.into(%{
        "email" => unique_email(),
        "password" => "password123",
        "first_name" => "Test",
        "last_name" => "User",
        "phone_number" => "0712345678"
      })
      |> Accounts.register_user()

    user |> Ecto.Changeset.change(role: role, email_verified: verified) |> Repo.update!()
  end

  def admin_fixture, do: user_fixture(role: "admin")

  def organizer_fixture(attrs \\ %{}) do
    user = user_fixture()
    {:ok, organizer} = Accounts.apply_as_organizer(user, Map.merge(%{"business_name" => "Test Events Ltd"}, attrs))
    {:ok, organizer} = Accounts.approve_organizer(organizer, admin_fixture())
    %{organizer | user: Repo.get!(User, user.id)}
  end

  def event_fixture(organizer \\ nil, attrs \\ %{}) do
    organizer = organizer || organizer_fixture()
    now = DateTime.utc_now()

    {:ok, event} =
      Events.create_event(
        organizer,
        Map.merge(
          %{
            "title" => "Test Concert",
            "category" => "music",
            "location" => "Nairobi",
            "start_datetime" => DateTime.add(now, 7 * 86_400, :second),
            "end_datetime" => DateTime.add(now, 7 * 86_400 + 4 * 3600, :second)
          },
          attrs
        )
      )

    event
  end

  def ticket_type_fixture(event, attrs \\ %{}) do
    {:ok, tt} =
      Events.create_ticket_type(
        event,
        Map.merge(%{"name" => "Regular", "price" => "1000", "quantity_total" => 100}, attrs)
      )

    tt
  end

  @doc "A published event with one ticket type."
  def on_sale_fixture(ticket_attrs \\ %{}) do
    organizer = organizer_fixture()
    event = event_fixture(organizer)
    tt = ticket_type_fixture(event, ticket_attrs)
    {:ok, event} = Events.publish_event(event)
    %{organizer: organizer, event: event, ticket_type: Repo.reload!(tt)}
  end

  def order_params(ticket_type, quantity \\ 1, extra \\ %{}) do
    Map.merge(
      %{
        "items" => [%{"ticket_type_id" => ticket_type.id, "quantity" => quantity}],
        "attendee_name" => "Jane Doe",
        "attendee_email" => "jane@example.com",
        "attendee_phone" => "0712345678"
      },
      extra
    )
  end
end
