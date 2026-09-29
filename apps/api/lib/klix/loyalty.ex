defmodule Klix.Loyalty do
  @moduledoc """
  Loyalty credits: signed-in buyers earn credits on paid orders and can
  spend them at checkout (1 credit = KES 1).

  The ledger is append-only. Credit-granting rows track how much of them is
  still `remaining`; spending draws from the soonest-expiring rows first
  under row locks, so two checkouts can't spend the same credits, and
  expiry only removes what was never spent.
  """

  import Ecto.Query
  require Logger
  alias Klix.Repo
  alias Klix.Accounts.User
  alias Klix.Loyalty.Transaction
  alias Klix.Orders.Order

  defp config, do: Application.get_env(:klix, :loyalty, [])
  defp earn_rate, do: Decimal.new(Keyword.get(config(), :earn_rate_percent, "1"))
  defp expiry_days, do: Keyword.get(config(), :expiry_days, 365)
  defp max_redeem_percent, do: Keyword.get(config(), :max_redeem_percent, 50)

  ## Reading

  def balance(%User{id: user_id}) do
    now = DateTime.utc_now()
    soon = DateTime.add(now, 30 * 86_400, :second)

    row =
      from(t in Transaction,
        where: t.user_id == ^user_id,
        select: %{
          available: filter(sum(t.remaining), is_nil(t.expires_at) or t.expires_at > ^now),
          expiring_soon: filter(sum(t.remaining), t.expires_at > ^now and t.expires_at <= ^soon),
          total_earned: filter(sum(t.credits), t.transaction_type in ["earned", "adjusted"] and t.credits > 0),
          redeemed: filter(sum(t.credits), t.transaction_type == "redeemed"),
          refunded: filter(sum(t.credits), t.transaction_type == "refunded"),
          expired: filter(sum(t.credits), t.transaction_type == "expired")
        }
      )
      |> Repo.one()

    %{
      user_id: user_id,
      available_credits: row.available || 0,
      expiring_soon: row.expiring_soon || 0,
      total_credits: row.total_earned || 0,
      redeemed_credits: -((row.redeemed || 0) + (row.refunded || 0)),
      expired_credits: -(row.expired || 0),
      max_redeem_percentage: max_redeem_percent()
    }
  end

  def available(%User{} = user), do: balance(user).available_credits

  def transactions(%User{id: user_id}, limit \\ 100) do
    Repo.all(
      from t in Transaction,
        where: t.user_id == ^user_id,
        order_by: [desc: t.inserted_at],
        limit: ^limit
    )
  end

  def expiring(%User{id: user_id}, days \\ 30) do
    now = DateTime.utc_now()
    until = DateTime.add(now, days * 86_400, :second)

    Repo.all(
      from t in Transaction,
        where: t.user_id == ^user_id and t.remaining > 0 and t.expires_at > ^now and t.expires_at <= ^until,
        order_by: [asc: t.expires_at]
    )
  end

  ## Checkout

  @doc """
  How many credits a user may apply to an order of `amount` (KES). Capped by
  the balance and by `max_redeem_percent` of the order.
  """
  def redeemable(%User{} = user, amount, requested \\ nil) do
    cap = amount |> Decimal.mult(max_redeem_percent()) |> Decimal.div(100) |> Decimal.round(0, :floor) |> Decimal.to_integer()
    available = available(user)
    wanted = if is_integer(requested) and requested >= 0, do: requested, else: available
    Enum.min([wanted, available, cap]) |> max(0)
  end

  @doc "Spends `credits` for an order inside the caller's transaction."
  def redeem(repo, user_id, credits, order_id) when is_integer(credits) and credits > 0 do
    now = DateTime.utc_now()

    lots =
      repo.all(
        from t in Transaction,
          where: t.user_id == ^user_id and t.remaining > 0 and (is_nil(t.expires_at) or t.expires_at > ^now),
          order_by: [asc_nulls_last: t.expires_at, asc: t.inserted_at],
          lock: "FOR UPDATE"
      )

    if Enum.reduce(lots, 0, &(&1.remaining + &2)) < credits do
      {:error, {:validation, "You don't have enough loyalty credits"}}
    else
      Enum.reduce_while(lots, credits, fn
        _lot, 0 ->
          {:halt, 0}

        lot, left ->
          take = min(lot.remaining, left)
          from(t in Transaction, where: t.id == ^lot.id) |> repo.update_all(inc: [remaining: -take])
          {:cont, left - take}
      end)

      repo.insert!(%Transaction{
        user_id: user_id,
        transaction_type: "redeemed",
        credits: -credits,
        description: "Used at checkout",
        reference_id: order_id
      })

      {:ok, credits}
    end
  end

  def redeem(_repo, _user_id, _credits, _order_id), do: {:ok, 0}

  @doc "Gives back the credits a cancelled or expired order had reserved."
  def refund_redemption(repo, %Order{user_id: user_id, credits_applied: credits, id: order_id})
      when is_binary(user_id) and credits > 0 do
    already? =
      repo.exists?(from t in Transaction, where: t.reference_id == ^order_id and t.transaction_type == "refunded")

    unless already? do
      repo.insert!(%Transaction{
        user_id: user_id,
        transaction_type: "refunded",
        credits: credits,
        remaining: credits,
        description: "Returned from an unpaid order",
        reference_id: order_id,
        expires_at: DateTime.add(DateTime.utc_now(), 90 * 86_400, :second)
      })
    end

    :ok
  end

  def refund_redemption(_repo, _order), do: :ok

  @doc "Awards credits for a paid order. Idempotent per order."
  def earn(repo, %Order{user_id: user_id, id: order_id, amount: amount}) when is_binary(user_id) do
    credits = amount |> Decimal.mult(earn_rate()) |> Decimal.div(100) |> Decimal.round(0, :floor) |> Decimal.to_integer()

    already? =
      repo.exists?(from t in Transaction, where: t.reference_id == ^order_id and t.transaction_type == "earned")

    if credits > 0 and not already? do
      repo.insert!(%Transaction{
        user_id: user_id,
        transaction_type: "earned",
        credits: credits,
        remaining: credits,
        description: "Earned on a ticket purchase",
        reference_id: order_id,
        expires_at: DateTime.add(DateTime.utc_now(), expiry_days() * 86_400, :second)
      })
    end

    :ok
  end

  def earn(_repo, _order), do: :ok

  @doc "Admin adjustment (positive grants, negative removes from the balance)."
  def adjust(%User{id: user_id} = user, credits, description) when is_integer(credits) and credits != 0 do
    if credits > 0 do
      Repo.insert(%Transaction{
        user_id: user_id,
        transaction_type: "adjusted",
        credits: credits,
        remaining: credits,
        description: description,
        expires_at: DateTime.add(DateTime.utc_now(), expiry_days() * 86_400, :second)
      })
    else
      Repo.transaction(fn ->
        case redeem(Repo, user.id, -credits, nil) do
          {:ok, _} -> :ok
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
    end
  end

  ## Expiry

  @doc "Writes off unspent credits past their expiry. Returns how many lots expired."
  def expire_due(limit \\ 1_000) do
    now = DateTime.utc_now()

    lots =
      Repo.all(
        from t in Transaction,
          where: t.remaining > 0 and t.expires_at <= ^now,
          limit: ^limit,
          select: t.id
      )

    Enum.each(lots, fn id ->
      Repo.transaction(fn ->
        case Repo.one(from t in Transaction, where: t.id == ^id and t.remaining > 0, lock: "FOR UPDATE") do
          nil ->
            :ok

          lot ->
            from(t in Transaction, where: t.id == ^lot.id) |> Repo.update_all(set: [remaining: 0])

            Repo.insert!(%Transaction{
              user_id: lot.user_id,
              transaction_type: "expired",
              credits: -lot.remaining,
              description: "Credits expired",
              reference_id: lot.id
            })
        end
      end)
    end)

    length(lots)
  end
end
