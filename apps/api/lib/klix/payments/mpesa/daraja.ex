defmodule Klix.Payments.Mpesa.Daraja do
  @moduledoc "Safaricom Daraja API client for STK push and STK status queries."
  @behaviour Klix.Payments.Mpesa

  require Logger
  alias Klix.Payments.Mpesa

  @impl true
  def stk_push(%{phone: phone, amount: amount, reference: reference, description: description}, config) do
    {password, timestamp} = password(config)

    body = %{
      "BusinessShortCode" => config[:shortcode],
      "Password" => password,
      "Timestamp" => timestamp,
      "TransactionType" => config[:transaction_type],
      "Amount" => amount,
      "PartyA" => phone,
      "PartyB" => config[:party_b] || config[:shortcode],
      "PhoneNumber" => phone,
      "CallBackURL" => config[:callback_url],
      "AccountReference" => String.slice(reference, 0, 12),
      "TransactionDesc" => String.slice(description, 0, 13)
    }

    with {:ok, token} <- access_token(config),
         {:ok, %{status: 200, body: %{"ResponseCode" => "0"} = resp}} <-
           Req.post(base_url(config) <> "/mpesa/stkpush/v1/processrequest",
             json: body,
             auth: {:bearer, token},
             receive_timeout: 15_000
           ) do
      {:ok,
       %{
         checkout_request_id: resp["CheckoutRequestID"],
         merchant_request_id: resp["MerchantRequestID"]
       }}
    else
      {:ok, %{body: body}} ->
        Logger.warning("M-Pesa STK push rejected: #{inspect(body)}")
        {:error, {:rejected, error_message(body)}}

      {:error, reason} ->
        Logger.error("M-Pesa STK push failed: #{inspect(reason)}")
        {:error, :unavailable}
    end
  end

  @impl true
  def stk_query(checkout_request_id, config) do
    {password, timestamp} = password(config)

    body = %{
      "BusinessShortCode" => config[:shortcode],
      "Password" => password,
      "Timestamp" => timestamp,
      "CheckoutRequestID" => checkout_request_id
    }

    with {:ok, token} <- access_token(config),
         {:ok, %{body: resp}} <-
           Req.post(base_url(config) <> "/mpesa/stkpushquery/v1/query",
             json: body,
             auth: {:bearer, token},
             receive_timeout: 15_000
           ) do
      case resp do
        %{"ResultCode" => code, "ResultDesc" => desc} ->
          case Mpesa.classify_result_code(code) do
            :completed -> {:ok, :completed, %{}}
            :cancelled -> {:ok, :cancelled, desc}
            :failed -> {:ok, :failed, desc}
          end

        # Safaricom answers with an error while the customer is still on the prompt.
        %{"errorCode" => "500.001.1001"} ->
          {:ok, :pending}

        other ->
          Logger.warning("Unexpected STK query response: #{inspect(other)}")
          {:ok, :pending}
      end
    else
      {:error, reason} -> {:error, reason}
    end
  end

  defp error_message(%{"errorMessage" => msg}), do: msg
  defp error_message(%{"ResponseDescription" => msg}), do: msg
  defp error_message(_), do: "M-Pesa rejected the request"

  @impl true
  def verify_credentials(config) do
    case fetch_token(config) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :invalid_credentials}
    end
  end

  defp base_url(config) do
    case config[:environment] do
      "production" -> "https://api.safaricom.co.ke"
      _ -> "https://sandbox.safaricom.co.ke"
    end
  end

  defp password(config) do
    timestamp =
      DateTime.utc_now()
      |> DateTime.add(3 * 3600, :second)
      |> Calendar.strftime("%Y%m%d%H%M%S")

    {Base.encode64(config[:shortcode] <> config[:passkey] <> timestamp), timestamp}
  end

  # OAuth tokens last an hour; cache them (per app) for a little less.
  defp access_token(config) do
    cache_key = {:mpesa, :token, :crypto.hash(:sha256, config[:consumer_key] || "")}

    case Klix.Cache.fetch(cache_key, :timer.minutes(50), fn -> fetch_token(config) end) do
      {:ok, token} ->
        {:ok, token}

      error ->
        Klix.Cache.delete(cache_key)
        error
    end
  end

  defp fetch_token(config) do
    case Req.get(base_url(config) <> "/oauth/v1/generate",
           params: [grant_type: "client_credentials"],
           auth: {:basic, "#{config[:consumer_key]}:#{config[:consumer_secret]}"},
           receive_timeout: 10_000
         ) do
      {:ok, %{status: 200, body: %{"access_token" => token}}} -> {:ok, token}
      other -> {:error, {:oauth_failed, other}}
    end
  end
end
