defmodule Klix.EventsTest do
  use Klix.DataCase, async: true

  alias Klix.Events

  test "only published, upcoming events are listed publicly" do
    %{event: published} = on_sale_fixture()
    _draft = event_fixture(nil, %{"title" => "Secret Draft"})

    {events, meta} = Events.list_public_events(%{})
    assert Enum.map(events, & &1.id) == [published.id]
    assert meta.total == 1
  end

  test "listing includes inventory totals and minimum price" do
    %{event: event} = on_sale_fixture(%{"price" => "2500", "quantity_total" => 40})
    ticket_type_fixture(event, %{"name" => "VIP", "price" => "9000", "quantity_total" => 10})

    {[listed], _} = Events.list_public_events(%{})
    assert listed.total_capacity == 50
    assert listed.tickets_available == 50
    assert Decimal.eq?(listed.min_price, 2500)
  end

  test "search matches word prefixes" do
    organizer = organizer_fixture()

    for title <- ["Nairobi Jazz Festival", "Mombasa Beach Party"] do
      event = event_fixture(organizer, %{"title" => title})
      ticket_type_fixture(event)
      {:ok, _} = Events.publish_event(event)
    end

    {events, _} = Events.list_public_events(%{"q" => "jaz nai"})
    assert Enum.map(events, & &1.title) == ["Nairobi Jazz Festival"]
  end

  test "publishing requires a ticket type" do
    event = event_fixture()
    assert {:error, :no_ticket_types} = Events.publish_event(event)
  end

  test "slugs are unique and stable across title edits" do
    event = event_fixture(nil, %{"title" => "Café Night!"})
    assert event.slug =~ ~r/^cafe-night-[a-z2-7]+$/

    {:ok, updated} = Events.update_event(event, %{"title" => "Renamed"})
    assert updated.slug == event.slug
  end

  test "capacity can't drop below what's sold" do
    %{ticket_type: tt} = on_sale_fixture(%{"quantity_total" => 5})
    {:ok, _} = Klix.Orders.create_order(nil, order_params(tt, 3))

    assert {:error, cs} = Events.update_ticket_type(tt, %{"quantity_total" => 2})
    assert %{quantity_total: [_]} = errors_on(cs)
  end
end
