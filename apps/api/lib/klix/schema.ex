defmodule Klix.Schema do
  @moduledoc "Shared defaults for every Ecto schema in the app."

  defmacro __using__(_opts) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset, warn: false

      @primary_key {:id, :binary_id, autogenerate: true}
      @foreign_key_type :binary_id
      @timestamps_opts [type: :utc_datetime_usec]
    end
  end
end
