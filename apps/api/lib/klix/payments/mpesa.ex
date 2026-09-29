defmodule Klix.Payments.Mpesa do
  @moduledoc """
  M-Pesa STK push ("Lipa na M-Pesa Online") behaviour.

  Every call takes the Daraja config to use: the platform's own (from
  application config) or an organizer's (see `Klix.Payments.MpesaCredential`).
  `Klix.Payments.Mpesa.Daraja` talks to Safaricom; `Klix.Payments.Mpesa.Sandbox`
  fakes it for development and tests.
  """

  @type stk_request :: %{
          phone: String.t(),
          amount: pos_integer(),
          reference: String.t(),
          description: String.t()
        }

  @type query_result ::
          {:ok, :completed, map()}
          | {:ok, :failed, String.t()}
          | {:ok, :cancelled, String.t()}
          | {:ok, :pending}
          | {:error, term()}

  @callback stk_push(stk_request(), config :: keyword()) ::
              {:ok, %{checkout_request_id: String.t(), merchant_request_id: String.t()}}
              | {:error, term()}

  @callback stk_query(checkout_request_id :: String.t(), config :: keyword()) :: query_result()

  @doc "Checks that a set of credentials can authenticate with Safaricom."
  @callback verify_credentials(config :: keyword()) :: :ok | {:error, term()}

  def config, do: Application.get_env(:klix, __MODULE__, [])
  def adapter, do: Keyword.get(config(), :adapter, Klix.Payments.Mpesa.Sandbox)

  def stk_push(request, config \\ config()), do: adapter().stk_push(request, config)
  def stk_query(checkout_request_id, config \\ config()), do: adapter().stk_query(checkout_request_id, config)
  def verify_credentials(config), do: adapter().verify_credentials(config)

  @doc "Maps an STK result code to an order outcome."
  def classify_result_code(code) do
    case to_string(code) do
      "0" -> :completed
      # Cancelled by the user, or the prompt timed out on the phone.
      c when c in ["1032", "1037", "1025", "1019"] -> :cancelled
      _ -> :failed
    end
  end
end
