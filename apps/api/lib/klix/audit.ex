defmodule Klix.Audit do
  @moduledoc "Who did what: admin actions and sensitive organizer changes."

  import Ecto.Query
  require Logger
  alias Klix.Repo
  alias Klix.Audit.Log

  @doc """
  Records an action. Never fails the caller: auditing problems are logged.

      Audit.log(admin, "organizer.approve", organizer, %{reason: "..."}, ip)
  """
  def log(actor, action, target \\ nil, metadata \\ %{}, ip \\ nil) do
    {target_type, target_id} = target_ref(target)

    %Log{
      actor_id: actor && actor.id,
      action: action,
      target_type: target_type,
      target_id: target_id,
      metadata: stringify(metadata),
      ip: ip
    }
    |> Repo.insert()
    |> case do
      {:ok, log} ->
        {:ok, log}

      {:error, reason} ->
        Logger.error("Audit log failed for #{action}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp target_ref(nil), do: {nil, nil}
  defp target_ref(%{__struct__: mod, id: id}), do: {mod |> Module.split() |> List.last() |> Macro.underscore(), id}
  defp target_ref({type, id}), do: {to_string(type), id}

  defp stringify(map) when is_map(map), do: map |> Jason.encode!() |> Jason.decode!()

  def list(params) do
    from(l in Log, order_by: [desc: l.inserted_at], preload: [:actor])
    |> filter(:action, params["action"])
    |> filter(:target_type, params["target_type"])
    |> then(fn q ->
      case Ecto.UUID.cast(params["actor_id"] || "") do
        {:ok, id} -> where(q, [l], l.actor_id == ^id)
        :error -> q
      end
    end)
    |> Repo.paginate(params)
  end

  defp filter(query, _field, value) when value in [nil, ""], do: query
  defp filter(query, :action, value), do: where(query, [l], like(l.action, ^"#{value}%"))
  defp filter(query, field, value), do: where(query, [l], field(l, ^field) == ^value)
end
