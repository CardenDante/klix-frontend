defmodule Klix.Notifications.Mailer do
  @moduledoc "Email delivery behaviour."
  @callback deliver(%{to: String.t(), subject: String.t(), text: String.t(), html: String.t()}) ::
              :ok | {:error, term()}
end

defmodule Klix.Notifications.SMS do
  @moduledoc "SMS delivery behaviour."
  @callback deliver(%{to: String.t(), message: String.t()}) :: :ok | {:error, term()}
end

defmodule Klix.Notifications.LogMailer do
  @moduledoc "Development/test mailer: writes emails to the log instead of sending them."
  @behaviour Klix.Notifications.Mailer
  require Logger

  @impl true
  def deliver(%{subject: subject, to: to, text: text}) do
    Logger.info("[email to #{to}] #{subject}\n#{text}")
    :ok
  end
end

defmodule Klix.Notifications.LogSMS do
  @moduledoc "Development/test SMS adapter: writes messages to the log."
  @behaviour Klix.Notifications.SMS
  require Logger

  @impl true
  def deliver(%{to: to, message: message}) do
    Logger.info("[sms to #{to}] #{message}")
    :ok
  end
end

defmodule Klix.Notifications.Resend do
  @moduledoc "Sends email through the Resend HTTP API (https://resend.com)."
  @behaviour Klix.Notifications.Mailer

  @impl true
  def deliver(%{to: to, subject: subject, text: text, html: html}) do
    config = Klix.Notifications.config()

    case Req.post("https://api.resend.com/emails",
           auth: {:bearer, config[:resend_api_key]},
           json: %{from: config[:from_email], to: [to], subject: subject, text: text, html: html},
           receive_timeout: 15_000
         ) do
      {:ok, %{status: status}} when status in 200..299 -> :ok
      {:ok, %{status: status, body: body}} -> {:error, {:http, status, body}}
      {:error, reason} -> {:error, reason}
    end
  end
end

defmodule Klix.Notifications.AfricasTalking do
  @moduledoc "Sends SMS through Africa's Talking."
  @behaviour Klix.Notifications.SMS

  @impl true
  def deliver(%{to: to, message: message}) do
    config = Klix.Notifications.config()

    host =
      if config[:africastalking_username] == "sandbox",
        do: "https://api.sandbox.africastalking.com",
        else: "https://api.africastalking.com"

    form =
      [username: config[:africastalking_username], to: "+" <> to, message: message]
      |> then(fn f -> if config[:sms_sender_id], do: f ++ [from: config[:sms_sender_id]], else: f end)

    case Req.post(host <> "/version1/messaging",
           headers: [{"apikey", config[:africastalking_api_key]}, {"accept", "application/json"}],
           form: form,
           receive_timeout: 15_000
         ) do
      {:ok, %{status: status}} when status in 200..299 -> :ok
      {:ok, %{status: status, body: body}} -> {:error, {:http, status, body}}
      {:error, reason} -> {:error, reason}
    end
  end
end
