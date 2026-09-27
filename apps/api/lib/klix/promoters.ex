defmodule Klix.Promoters do
  @moduledoc """
  Promoter codes. This phase covers validating codes and applying them at
  checkout; promoter applications, code creation and payouts come next.
  """
  import Ecto.Query
  alias Klix.Repo
  alias Klix.Promoters.PromoterCode

  def get_code(code, event_id) when is_binary(code) and is_binary(event_id) do
    code = code |> String.trim() |> String.upcase()

    with {:ok, event_id} <- Ecto.UUID.cast(event_id) do
      Repo.one(from c in PromoterCode, where: c.code == ^code and c.event_id == ^event_id)
    else
      _ -> nil
    end
  end

  def get_code(_, _), do: nil

  @doc "Returns `{:ok, code}` if the code can be used for the event right now."
  def validate_code(code, event_id, now \\ DateTime.utc_now()) do
    case get_code(code, event_id) do
      nil ->
        {:error, "Invalid promoter code"}

      %PromoterCode{is_active: false} ->
        {:error, "This promoter code is no longer active"}

      %PromoterCode{valid_from: from} = c when not is_nil(from) ->
        if DateTime.compare(now, from) == :lt,
          do: {:error, "This promoter code is not active yet"},
          else: check_expiry_and_limit(c, now)

      c ->
        check_expiry_and_limit(c, now)
    end
  end

  defp check_expiry_and_limit(%PromoterCode{} = c, now) do
    cond do
      c.valid_until && DateTime.compare(now, c.valid_until) != :lt ->
        {:error, "This promoter code has expired"}

      c.usage_limit && c.times_used >= c.usage_limit ->
        {:error, "This promoter code has reached its usage limit"}

      true ->
        {:ok, c}
    end
  end

  @doc "The discount a code gives, as a percentage (zero for commission-only codes)."
  def discount_percentage(%PromoterCode{code_type: "discount", discount_percentage: %Decimal{} = pct}),
    do: pct

  def discount_percentage(_), do: Decimal.new(0)

  def record_use(repo, promoter_code_id) do
    from(c in PromoterCode, where: c.id == ^promoter_code_id)
    |> repo.update_all(inc: [times_used: 1])
  end
end
