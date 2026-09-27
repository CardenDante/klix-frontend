defmodule Klix.DataCase do
  @moduledoc "Test case for code that touches the database."
  use ExUnit.CaseTemplate

  using do
    quote do
      alias Klix.Repo
      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import Klix.DataCase
      import Klix.Fixtures
      use Oban.Testing, repo: Klix.Repo
    end
  end

  setup tags do
    setup_sandbox(tags)
    :ok
  end

  def setup_sandbox(tags) do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(Klix.Repo, shared: not tags[:async])
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
  end

  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
