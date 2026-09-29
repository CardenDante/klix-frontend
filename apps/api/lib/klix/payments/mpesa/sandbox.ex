defmodule Klix.Payments.Mpesa.Sandbox do
  @moduledoc """
  Fake M-Pesa for development and tests.

  With `auto_callback_ms` set in config, a success callback is delivered
  automatically after that delay so the whole checkout can be clicked
  through locally. The phone number `254700000001` simulates a failed
  payment and `254700000002` a cancelled one.
  """
  @behaviour Klix.Payments.Mpesa

  @impl true
  def stk_push(%{phone: phone, amount: amount}, _config) do
    checkout_id = "ws_CO_SANDBOX_" <> Base.encode16(:crypto.strong_rand_bytes(8))
    merchant_id = "SANDBOX-" <> Base.encode16(:crypto.strong_rand_bytes(4))

    if delay = Klix.Payments.Mpesa.config()[:auto_callback_ms] do
      Task.start(fn ->
        Process.sleep(delay)
        Klix.Payments.handle_stk_callback(callback_payload(checkout_id, merchant_id, phone, amount))
      end)
    end

    {:ok, %{checkout_request_id: checkout_id, merchant_request_id: merchant_id}}
  end

  @impl true
  def stk_query(_checkout_request_id, _config), do: {:ok, :pending}

  @impl true
  def verify_credentials(config) do
    if config[:consumer_key] == "invalid", do: {:error, :invalid_credentials}, else: :ok
  end

  @doc "Builds a callback body shaped exactly like Safaricom's."
  def callback_payload(checkout_id, merchant_id, phone, amount) do
    {code, desc} =
      case phone do
        "254700000001" -> {1, "The balance is insufficient for the transaction."}
        "254700000002" -> {1032, "Request cancelled by user."}
        _ -> {0, "The service request is processed successfully."}
      end

    metadata =
      if code == 0 do
        %{
          "CallbackMetadata" => %{
            "Item" => [
              %{"Name" => "Amount", "Value" => amount},
              %{"Name" => "MpesaReceiptNumber", "Value" => "SBX" <> Base.encode32(:crypto.strong_rand_bytes(5))},
              %{"Name" => "TransactionDate", "Value" => 20_260_101_000_000},
              %{"Name" => "PhoneNumber", "Value" => String.to_integer(phone)}
            ]
          }
        }
      else
        %{}
      end

    %{
      "Body" => %{
        "stkCallback" =>
          Map.merge(
            %{
              "MerchantRequestID" => merchant_id,
              "CheckoutRequestID" => checkout_id,
              "ResultCode" => code,
              "ResultDesc" => desc
            },
            metadata
          )
      }
    }
  end
end
