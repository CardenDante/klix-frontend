defmodule Klix.Payments.Mpesa.Daraja do
  @moduledoc "Safaricom Daraja API client for STK push and STK status queries."
  @behaviour Klix.Payments.Mpesa

  require Logger
  alias Klix.Payments.Mpesa

  @impl true
  def stk_push(%{phone: phone, amount: amount, reference: reference, description: description}) do
    config = Mpesa.config()
    {password, timestamp} = password(config)

    body = %{
      "BusinessShortCode" => config[:shortcode],
      "Password" => password,
      "Timestamp" => timestamp,
      "TransactionType" => config[:transaction_type],
      "Amount" => amount,
      "PartyA" => phone,
      "PartyB" => config[:shortcode],
      "PhoneNumber" => phone,
      "CallBackURL" => config[:callback_url],
      "AccountReference" => String.slice(reference, 0, 12),
      "TransactionDesc" => String.slice(description, 0, 13)
    }

    with {:ok, token} <- access_token(),
         {:ok, %{status: 200, body: %{"ResponseCode" => "0"} = resp}} <-
           Req.post(base_url() <> "/mpesa/stkpush/v1/processrequest",
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
  def stk_query(checkout_request_id) do
    config = Mpesa.config()
    {password, timestamp} = password(config)

    body = %{
      "BusinessShortCode" => config[:shortcode],
      "Password" => password,
      "Timestamp" => timestamp,
      "CheckoutRequestID" => checkout_request_id
    }

    with {:ok, token} <- access_token(),
         {:ok, %{body: resp}} <-
           Req.post(base_url() <> "/mpesa/stkpushquery/v1/query",
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

  defp base_url do
    case Mpesa.config()[:environment] do
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

  # OAuth tokens last an hour; cache them for a little less.
  defp access_token do
    case Klix.Cache.fetch({:mpesa, :token}, :timer.minutes(50), &fetch_token/0) do
      {:ok, token} ->
        {:ok, token}

      error ->
        Klix.Cache.delete({:mpesa, :token})
        error
    end
  end

  defp fetch_token do
    config = Mpesa.config()

    case Req.get(base_url() <> "/oauth/v1/generate",
           params: [grant_type: "client_credentials"],
           auth: {:basic, "#{config[:consumer_key]}:#{config[:consumer_secret]}"},
           receive_timeout: 10_000
         ) do
      {:ok, %{status: 200, body: %{"access_token" => token}}} -> {:ok, token}
      other -> {:error, {:oauth_failed, other}}
    end
  end
end
