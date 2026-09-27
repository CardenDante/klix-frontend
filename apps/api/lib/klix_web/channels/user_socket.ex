defmodule KlixWeb.UserSocket do
  use Phoenix.Socket

  channel "order:*", KlixWeb.OrderChannel

  # Guests can connect too (they check out without an account); a token, if
  # sent, identifies the user so channels can authorize them.
  @impl true
  def connect(params, socket, _connect_info) do
    user_id =
      with token when is_binary(token) <- params["token"],
           {:ok, user_id, _claims} <- Klix.Accounts.Token.verify_access(token) do
        user_id
      else
        _ -> nil
      end

    {:ok, assign(socket, :user_id, user_id)}
  end

  @impl true
  def id(%{assigns: %{user_id: nil}}), do: nil
  def id(%{assigns: %{user_id: user_id}}), do: "user_socket:#{user_id}"
end
