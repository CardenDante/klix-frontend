defmodule Klix.Notifications.Workers.Deliver do
  @moduledoc "Delivers one email or SMS, retrying with backoff on provider errors."
  use Oban.Worker, queue: :notifications, max_attempts: 8

  alias Klix.Notifications

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"channel" => "email"} = args}) do
    Notifications.mailer().deliver(%{
      to: args["to"],
      subject: args["subject"],
      text: args["text"],
      html: args["html"]
    })
  end

  def perform(%Oban.Job{args: %{"channel" => "sms"} = args}) do
    Notifications.sms().deliver(%{to: args["to"], message: args["message"]})
  end
end
