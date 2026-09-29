defmodule KlixWeb.LoyaltyController do
  use KlixWeb, :controller

  alias Klix.Loyalty
  alias KlixWeb.JSON

  def balance(conn, _params), do: json(conn, Loyalty.balance(current_user(conn)))

  def transactions(conn, _params) do
    json(conn, Enum.map(Loyalty.transactions(current_user(conn)), &JSON.loyalty_transaction/1))
  end

  def available(conn, _params) do
    json(conn, %{available_credits: Loyalty.available(current_user(conn))})
  end

  def expiring(conn, _params) do
    json(conn, Enum.map(Loyalty.expiring(current_user(conn)), &JSON.loyalty_transaction/1))
  end

  def summary(conn, _params) do
    user = current_user(conn)

    json(conn, %{
      balance: Loyalty.balance(user),
      recent_transactions: user |> Loyalty.transactions(10) |> Enum.map(&JSON.loyalty_transaction/1),
      expiring_soon: user |> Loyalty.expiring() |> Enum.map(&JSON.loyalty_transaction/1)
    })
  end
end
