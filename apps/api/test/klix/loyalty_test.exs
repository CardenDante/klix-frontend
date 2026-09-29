defmodule Klix.LoyaltyTest do
  use Klix.DataCase, async: true

  alias Klix.{Loyalty, Orders}

  setup do
    %{ticket_type: tt} = on_sale_fixture(%{"price" => "5000"})
    %{ticket_type: tt, user: user_fixture()}
  end

  test "paid orders earn 1% as credits, once", %{ticket_type: tt, user: user} do
    order = paid_order_fixture(tt, user, 2)
    assert Loyalty.available(user) == 100

    {:ok, _} = Orders.complete_order(order.id)
    assert Loyalty.available(user) == 100
  end

  test "guests don't earn credits", %{ticket_type: tt} do
    paid_order_fixture(tt, nil, 1)
    assert Repo.aggregate(Klix.Loyalty.Transaction, :count) == 0
  end

  test "credits pay part of an order, capped at half", %{ticket_type: tt, user: user} do
    {:ok, _} = Loyalty.adjust(user, 4000, "Welcome gift")

    {:ok, order} = Orders.create_order(user, order_params(tt, 1, %{"use_loyalty_credits" => true}))
    assert order.credits_applied == 2500
    assert Decimal.eq?(order.amount, 2500)
    assert Loyalty.available(user) == 1500
  end

  test "a specific amount can be requested", %{ticket_type: tt, user: user} do
    {:ok, _} = Loyalty.adjust(user, 4000, "Gift")

    {:ok, order} =
      Orders.create_order(user, order_params(tt, 1, %{"use_loyalty_credits" => "true", "loyalty_credits_amount" => "300"}))

    assert order.credits_applied == 300
    assert Decimal.eq?(order.amount, 4700)
  end

  test "credits come back when an order lapses", %{ticket_type: tt, user: user} do
    {:ok, _} = Loyalty.adjust(user, 1000, "Gift")
    {:ok, order} = Orders.create_order(user, order_params(tt, 1, %{"use_loyalty_credits" => true}))
    assert Loyalty.available(user) == 0

    {:ok, _} = Orders.release_order(order.id, "expired")
    assert Loyalty.available(user) == 1000

    # Releasing twice doesn't refund twice.
    {:ok, _} = Orders.release_order(order.id, "expired")
    assert Loyalty.available(user) == 1000
  end

  test "spending draws from the soonest-expiring credits first", %{user: user} do
    {:ok, later} = Loyalty.adjust(user, 100, "Later")
    {:ok, sooner} = Loyalty.adjust(user, 100, "Sooner")

    Repo.update_all(from(t in Klix.Loyalty.Transaction, where: t.id == ^sooner.id),
      set: [expires_at: DateTime.add(DateTime.utc_now(), 86_400, :second)]
    )

    {:ok, 150} = Repo.transaction(fn -> Loyalty.redeem(Repo, user.id, 150, nil) |> elem(1) end)

    assert Repo.reload!(sooner).remaining == 0
    assert Repo.reload!(later).remaining == 50
  end

  test "expiry writes off only unspent credits", %{user: user} do
    {:ok, lot} = Loyalty.adjust(user, 100, "Gift")
    {:ok, _} = Repo.transaction(fn -> Loyalty.redeem(Repo, user.id, 30, nil) end)

    Repo.update_all(from(t in Klix.Loyalty.Transaction, where: t.id == ^lot.id),
      set: [expires_at: DateTime.add(DateTime.utc_now(), -1, :second)]
    )

    assert Loyalty.expire_due() == 1
    balance = Loyalty.balance(user)
    assert balance.available_credits == 0
    assert balance.expired_credits == 70
    assert balance.redeemed_credits == 30
  end
end
