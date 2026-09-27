defmodule Klix.Accounts.Firebase do
  @moduledoc """
  Verifies Firebase Authentication ID tokens (used for Google sign-in).

  Google publishes the signing keys as a JWK set; they are cached for as
  long as the response's Cache-Control header allows.
  """
  require Logger

  @jwks_url "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

  def verify_id_token(token) when is_binary(token) do
    with {:ok, project_id} <- project_id(),
         {:ok, kid} <- peek_kid(token),
         {:ok, jwk} <- signing_key(kid),
         {true, %JOSE.JWT{fields: claims}, _jws} <- JOSE.JWT.verify_strict(jwk, ["RS256"], token),
         :ok <- validate_claims(claims, project_id) do
      {:ok, claims}
    else
      {false, _, _} -> {:error, :invalid_signature}
      {:error, _} = error -> error
      _ -> {:error, :invalid_token}
    end
  end

  def verify_id_token(_), do: {:error, :invalid_token}

  defp project_id do
    case Application.get_env(:klix, :firebase_project_id) do
      nil -> {:error, :firebase_not_configured}
      id -> {:ok, id}
    end
  end

  defp peek_kid(token) do
    %JOSE.JWS{fields: fields} = JOSE.JWT.peek_protected(token)

    case fields do
      %{"kid" => kid} -> {:ok, kid}
      _ -> {:error, :invalid_token}
    end
  rescue
    _ -> {:error, :invalid_token}
  end

  defp validate_claims(claims, project_id) do
    now = System.system_time(:second)

    cond do
      claims["aud"] != project_id -> {:error, :invalid_audience}
      claims["iss"] != "https://securetoken.google.com/#{project_id}" -> {:error, :invalid_issuer}
      not is_integer(claims["exp"]) or claims["exp"] <= now -> {:error, :expired}
      not is_integer(claims["iat"]) or claims["iat"] > now + 60 -> {:error, :invalid_issued_at}
      claims["sub"] in [nil, ""] -> {:error, :invalid_subject}
      true -> :ok
    end
  end

  defp signing_key(kid, retry? \\ true) do
    keys = Klix.Cache.fetch({:firebase, :jwks}, :timer.hours(1), &fetch_keys/0)

    case keys do
      %{^kid => jwk} ->
        {:ok, jwk}

      _ when retry? ->
        # Keys rotate, and a failed fetch must not stay cached: drop the
        # cached set and try once more, at most once a minute so tokens with
        # made-up key ids can't turn into a flood of requests to Google.
        case Klix.RateLimiter.hit(:firebase_jwks_refetch, 1, 60) do
          :ok ->
            Klix.Cache.delete({:firebase, :jwks})
            signing_key(kid, false)

          {:error, _} ->
            {:error, :unknown_key}
        end

      _ ->
        {:error, :unknown_key}
    end
  end

  defp fetch_keys do
    case Req.get(@jwks_url, retry: :transient) do
      {:ok, %{status: 200, body: %{"keys" => keys}}} ->
        Map.new(keys, fn key -> {key["kid"], JOSE.JWK.from_map(key)} end)

      other ->
        Logger.error("Could not fetch Firebase signing keys: #{inspect(other)}")
        %{}
    end
  end
end
