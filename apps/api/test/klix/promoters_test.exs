defmodule Klix.PromotersTest do
  use Klix.DataCase, async: true

  alias Klix.Promoters
  alias Klix.Promoters.{Commission, PromoterCode}

  setup do
    %{event: event, ticket_type: tt} = on_sale_fixture(%{"price" => "2000", "quantity_total" => 100})
    %{event: event, ticket_type: tt}
  end

  test "unapproved promoters can't request events", %{event: event} do
    user = user_fixture()
    {:ok, _} = Promoters.apply_as_promoter(user, %{"display_name" => "Newbie"})
    assert {:error, :promoter_not_approved} = Promoters.request_event(user, event.id, nil)
  end

  test "codes need the organizer's approval, and inherit its terms", %{event: event} do
    promoter = promoter_fixture()
    assert {:error, {:validation, _}} = Promoters.create_code(promoter, %{"event_id" => event.id})

    {:ok, approval} = Promoters.request_event(promoter, event.id, "Big following")
    {:ok, _} = Promoters.approve_request(approval, %{"commission_percentage" => "12", "discount_percentage" => "0"})

    # Terms in the request are ignored; the approval decides.
    {:ok, code} = Promoters.create_code(promoter, %{"event_id" => event.id, "commission_percentage" => "90"})
    assert code.code_type == "commission"
    assert Decimal.eq?(code.commission_percentage, 12)
  end

  test "a paid order with a code applies the discount and earns commission", %{event: event, ticket_type: tt} do
    %{promoter: promoter, code: code} = promoter_code_fixture(event)

    order = paid_order_fixture(tt, nil, 2, %{"promoter_code" => code.code})

    # 2 × 2000 with 5% off = 3800; 10% commission on 3800 = 380
    assert Decimal.eq?(order.amount, 3800)
    assert [%Commission{} = c] = Repo.all(Commission)
    assert c.promoter_id == promoter.id
    assert Decimal.eq?(c.amount, 380)
    assert c.tickets == 2
    assert Repo.reload!(code).times_used == 1

    # Completing again (duplicate callback) doesn't double-count.
    {:ok, _} = Klix.Orders.complete_order(order.id)
    assert Repo.aggregate(Commission, :count) == 1
  end

  test "commission is held until the event ends, then withdrawable", %{event: event, ticket_type: tt} do
    %{promoter: promoter, code: code} = promoter_code_fixture(event, %{"commission_percentage" => "10"})
    paid_order_fixture(tt, nil, 5, %{"promoter_code" => code.code})

    earnings = Promoters.earnings(promoter)
    assert Decimal.eq?(earnings.pending, 1000)
    assert Decimal.eq?(earnings.available, 0)
    assert {:error, {:validation, _}} = Promoters.request_withdrawal(promoter, %{"amount" => "500"})

    end_event(event)
    assert Decimal.eq?(Promoters.earnings(promoter).available, 1000)

    assert {:error, {:validation, msg}} = Promoters.request_withdrawal(promoter, %{"amount" => "5000"})
    assert msg =~ "up to"
    assert {:error, {:validation, _}} = Promoters.request_withdrawal(promoter, %{"amount" => "50"})

    assert {:ok, w} = Promoters.request_withdrawal(promoter, %{"amount" => "600"})
    assert w.phone == "254711000111"
    assert Decimal.eq?(Promoters.earnings(promoter).available, 400)

    {:ok, _} = Promoters.reject_withdrawal(w, admin_fixture(), "Wrong number")
    assert Decimal.eq?(Promoters.earnings(promoter).available, 1000)
  end

  test "revoking a promoter switches off their codes", %{event: event} do
    %{promoter: promoter, code: code} = promoter_code_fixture(event)
    [approval] = Promoters.list_my_requests(promoter)
    {:ok, _} = Promoters.revoke_request(approval, "Campaign over")

    refute Repo.reload!(code).is_active
    assert {:error, "This promoter code is no longer active"} = Promoters.validate_code(code.code, event.id)
  end

  test "changing terms updates existing codes", %{event: event} do
    %{promoter: promoter, code: code} = promoter_code_fixture(event)
    [approval] = Promoters.list_my_requests(promoter)
    {:ok, _} = Promoters.update_terms(approval, %{"commission_percentage" => "20", "discount_percentage" => "0"})

    code = Repo.reload!(code)
    assert Decimal.eq?(code.commission_percentage, 20)
    assert code.code_type == "commission"
  end

  test "clicks, stats and leaderboard", %{event: event, ticket_type: tt} do
    %{promoter: promoter, code: code} = promoter_code_fixture(event)
    :ok = Promoters.track_click(String.downcase(code.code))
    :ok = Promoters.track_click(code.code)
    paid_order_fixture(tt, nil, 3, %{"promoter_code" => code.code})

    [listed] = Promoters.list_codes(promoter)
    assert listed.clicks == 2
    assert listed.stats.tickets_sold == 3
    assert listed.stats.conversion_rate == 50.0

    assert [%{display_name: "Pat Promotes", tickets_sold: 3, rank: 1}] = Promoters.leaderboard()
    assert %{total_tickets_sold: 3, active_codes: 1} = Promoters.dashboard(promoter)
  end

  test "suspending a promoter deactivates all their codes", %{event: event} do
    %{promoter: promoter} = promoter_code_fixture(event)
    profile = Promoters.get_profile(promoter)
    {:ok, _} = Promoters.suspend_profile(profile, "Spam")
    refute Repo.exists?(from c in PromoterCode, where: c.promoter_id == ^promoter.id and c.is_active)
  end
end
