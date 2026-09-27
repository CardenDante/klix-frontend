defmodule Klix.Repo do
  use Ecto.Repo,
    otp_app: :klix,
    adapter: Ecto.Adapters.Postgres

  # Only what paginate/2 needs: Ecto.Query.update/2 would clash with Repo.update/2.
  import Ecto.Query, only: [exclude: 2, subquery: 1, select: 2, limit: 2, offset: 2]

  @max_page_size 100

  @doc """
  Paginates a query and returns `{entries, meta}` where meta mirrors the
  `/api/v1` pagination envelope.
  """
  def paginate(query, params) do
    page = params |> Map.get("page", "1") |> to_positive_int(1)

    page_size =
      params |> Map.get("page_size", "20") |> to_positive_int(20) |> min(@max_page_size)

    total =
      query
      |> exclude(:order_by)
      |> exclude(:preload)
      |> exclude(:select)
      |> subquery()
      |> select(count())
      |> one()

    entries =
      query
      |> limit(^page_size)
      |> offset(^((page - 1) * page_size))
      |> all()

    {entries,
     %{
       total: total,
       page: page,
       page_size: page_size,
       total_pages: max(ceil(total / page_size), 1)
     }}
  end

  defp to_positive_int(value, _default) when is_integer(value) and value > 0, do: value

  defp to_positive_int(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} when int > 0 -> int
      _ -> default
    end
  end

  defp to_positive_int(_, default), do: default
end
