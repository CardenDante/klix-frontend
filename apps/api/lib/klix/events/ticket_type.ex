defmodule Klix.Events.TicketType do
  use Klix.Schema

  schema "ticket_types" do
    field :name, :string
    field :description, :string
    field :price, :decimal
    field :quantity_total, :integer
    field :quantity_sold, :integer, default: 0
    field :quantity_reserved, :integer, default: 0
    field :max_per_order, :integer, default: 10
    field :sale_start, :utc_datetime_usec
    field :sale_end, :utc_datetime_usec
    field :is_active, :boolean, default: true
    field :sort_order, :integer, default: 0
    field :settings, :map, default: %{}

    belongs_to :event, Klix.Events.Event

    timestamps()
  end

  @fields ~w(name description price quantity_total max_per_order sale_start sale_end is_active sort_order settings)a

  def changeset(ticket_type, attrs) do
    ticket_type
    |> cast(attrs, @fields)
    |> validate_required([:name, :price, :quantity_total])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_number(:price, greater_than_or_equal_to: 0)
    |> validate_number(:quantity_total, greater_than: 0, less_than_or_equal_to: 1_000_000)
    |> validate_number(:max_per_order, greater_than: 0, less_than_or_equal_to: 100)
    |> validate_sale_window()
    |> check_constraint(:quantity_total,
      name: :inventory_within_capacity,
      message: "cannot be lower than tickets already sold or reserved"
    )
  end

  defp validate_sale_window(changeset) do
    starts = get_field(changeset, :sale_start)
    ends = get_field(changeset, :sale_end)

    if starts && ends && DateTime.compare(ends, starts) != :gt,
      do: add_error(changeset, :sale_end, "must be after the sale start"),
      else: changeset
  end

  def available(%__MODULE__{} = tt), do: max(tt.quantity_total - tt.quantity_sold - tt.quantity_reserved, 0)

  def on_sale?(%__MODULE__{} = tt, now \\ DateTime.utc_now()) do
    tt.is_active and
      (is_nil(tt.sale_start) or DateTime.compare(now, tt.sale_start) != :lt) and
      (is_nil(tt.sale_end) or DateTime.compare(now, tt.sale_end) == :lt)
  end
end
