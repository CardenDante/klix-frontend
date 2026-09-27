defmodule Klix.Tickets do
  @moduledoc """
  Issued tickets: listing, signed QR codes and door check-in.

  A ticket's QR payload is `K1.<ticket id>.<signature>`. The signature is an
  HMAC, so scanners can reject forged codes without a database lookup, and
  nothing in the QR code reveals other tickets.
  """

  import Ecto.Query
  alias Klix.Repo
  alias Klix.Accounts.User
  alias Klix.Orders.Ticket

  @qr_prefix "K1"

  def list_user_tickets(%User{} = user, params \\ %{}) do
    from(t in Ticket,
      where: t.status in ["confirmed", "used"],
      order_by: [desc: t.inserted_at],
      preload: [:ticket_type, :event]
    )
    |> owned_by(user)
    |> then(fn q ->
      case Ecto.UUID.cast(params["event_id"] || "") do
        {:ok, event_id} -> where(q, [t], t.event_id == ^event_id)
        :error -> q
      end
    end)
    |> Repo.all()
  end

  # Guest purchases made with the user's email count as theirs, but only
  # once they have proven they own that address.
  defp owned_by(query, %User{id: user_id, email: email, email_verified: true}) do
    where(query, [t], t.user_id == ^user_id or (is_nil(t.user_id) and t.attendee_email == ^email))
  end

  defp owned_by(query, %User{id: user_id}), do: where(query, [t], t.user_id == ^user_id)

  def get_ticket(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Ticket |> Repo.get(id) |> Repo.preload([:ticket_type, :event])
      :error -> nil
    end
  end

  def owns?(%Ticket{user_id: id}, %User{id: id}), do: true
  def owns?(%Ticket{user_id: nil, attendee_email: email}, %User{email: email, email_verified: true}),
    do: true

  def owns?(_, _), do: false

  ## QR codes

  def qr_code(%Ticket{id: id}), do: "#{@qr_prefix}.#{id}.#{sign(id)}"

  def verify_qr(qr_data) when is_binary(qr_data) do
    with [@qr_prefix, id, signature] <- String.split(String.trim(qr_data), "."),
         true <- Plug.Crypto.secure_compare(sign(id), signature) do
      {:ok, id}
    else
      _ -> {:error, :invalid_qr}
    end
  end

  def verify_qr(_), do: {:error, :invalid_qr}

  defp sign(id) do
    :crypto.mac(:hmac, :sha256, Application.fetch_env!(:klix, :qr_secret), id)
    |> binary_part(0, 16)
    |> Base.url_encode64(padding: false)
  end

  ## Door

  @doc """
  Checks whether a scanned code is a valid ticket for `event_id` without
  changing anything.
  """
  def validate(qr_data, event_id) do
    with {:ok, id} <- verify_qr(qr_data),
         %Ticket{} = ticket <- get_ticket(id) do
      cond do
        ticket.event_id != event_id -> {:error, :wrong_event, ticket}
        ticket.status == "used" -> {:error, :already_used, ticket}
        ticket.status != "confirmed" -> {:error, :not_valid, ticket}
        true -> {:ok, ticket}
      end
    else
      nil -> {:error, :not_found, nil}
      {:error, :invalid_qr} -> {:error, :invalid_qr, nil}
    end
  end

  @doc """
  Admits a ticket. The conditional update means the same ticket scanned at
  two gates at the same moment is only admitted once.
  """
  def check_in(qr_data, event_id, %User{} = staff, location \\ nil) do
    with {:ok, ticket} <- validate(qr_data, event_id) do
      now = DateTime.utc_now()

      query =
        from t in Ticket,
          where: t.id == ^ticket.id and t.status == "confirmed" and is_nil(t.checked_in_at),
          select: t

      case Repo.update_all(query,
             set: [
               status: "used",
               checked_in_at: now,
               checked_in_by_id: staff.id,
               check_in_location: location,
               updated_at: now
             ]
           ) do
        {1, [updated]} -> {:ok, Repo.preload(updated, [:ticket_type, :event])}
        {0, _} -> {:error, :already_used, get_ticket(ticket.id)}
      end
    end
  end

  @doc "Door statistics for an event."
  def checkin_stats(event_id) do
    from(t in Ticket,
      where: t.event_id == ^event_id and t.status in ["confirmed", "used"],
      select: %{
        total: count(t.id),
        checked_in: count(t.checked_in_at)
      }
    )
    |> Repo.one()
  end
end
