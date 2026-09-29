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

  @doc "An approved promoter (user with an approved profile)."
  def promoter_fixture do
    user = user_fixture(%{"first_name" => "Pat"})
    {:ok, profile} = Klix.Promoters.apply_as_promoter(user, %{"display_name" => "Pat Promotes", "payout_phone" => "0711000111"})
    {:ok, _} = Klix.Promoters.approve_profile(profile, admin_fixture())
    Repo.get!(User, user.id)
  end

  @doc "A promoter approved for `event` with the given terms, plus a code."
  def promoter_code_fixture(event, terms \\ %{"commission_percentage" => "10", "discount_percentage" => "5"}) do
    promoter = promoter_fixture()
    {:ok, approval} = Klix.Promoters.request_event(promoter, event.id, "Let me sell this")
    {:ok, _} = Klix.Promoters.approve_request(approval, terms)
    {:ok, code} = Klix.Promoters.create_code(promoter, %{"event_id" => event.id, "code" => "PAT#{System.unique_integer([:positive])}"})
    %{promoter: promoter, code: code}
  end

  @doc "Moves an event into the past (for payouts that wait until the event ends)."
  def end_event(event) do
    past_end = DateTime.add(DateTime.utc_now(), -3600, :second)

    event
    |> Ecto.Changeset.change(start_datetime: DateTime.add(past_end, -7200, :second), end_datetime: past_end)
    |> Repo.update!()
  end

  @doc "Creates and pays an order."
  def paid_order_fixture(ticket_type, user \\ nil, quantity \\ 1, extra \\ %{}) do
    {:ok, order} = Klix.Orders.create_order(user, order_params(ticket_type, quantity, extra))
    {:ok, order} = Klix.Orders.complete_order(order.id, %{mpesa_receipt: "R#{System.unique_integer([:positive])}"})
    order
  end
end
