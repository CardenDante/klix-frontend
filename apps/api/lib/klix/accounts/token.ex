defmodule Klix.Accounts.Token do
  @moduledoc """
  Short-lived HS256 access tokens. Verifying them needs no database round
  trip, so authenticated reads scale with CPU rather than with Postgres.
  """
  use Joken.Config

  @impl true
  def token_config do
    default_claims(default_exp: ttl(), iss: "klix", aud: "klix-api")
    |> add_claim("typ", fn -> "access" end, &(&1 == "access"))
  end

  def ttl, do: Application.fetch_env!(:klix, :auth)[:access_token_ttl_seconds]

  def sign_access(user) do
    generate_and_sign(%{"sub" => user.id, "role" => user.role}, signer())
  end

  def verify_access(token) do
    case verify_and_validate(token, signer()) do
      {:ok, %{"sub" => user_id} = claims} -> {:ok, user_id, claims}
      {:error, reason} -> {:error, reason}
    end
  end

  defp signer do
    Joken.Signer.create("HS256", Application.fetch_env!(:klix, :auth)[:signing_secret])
  end
end
