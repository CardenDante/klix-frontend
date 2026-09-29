defmodule Klix.Notifications do
  @moduledoc """
  Transactional email and SMS. Messages are rendered when queued and sent
  by an Oban worker, so a slow provider never slows down a request and
  failed sends are retried.
  """

  alias Klix.Notifications.Workers.Deliver

  def config, do: Application.get_env(:klix, __MODULE__, [])
  def mailer, do: Keyword.get(config(), :mailer, Klix.Notifications.LogMailer)
  def sms, do: Keyword.get(config(), :sms, Klix.Notifications.LogSMS)
  def web_url, do: Keyword.get(config(), :web_url, "http://localhost:3000")

  ## Messages

  def ticket_confirmation(order) do
    order = Klix.Repo.preload(order, [:event, tickets: :ticket_type])
    url = "#{web_url()}/orders/#{order.id}"
    event = order.event
    count = length(order.tickets)
    when_text = Calendar.strftime(DateTime.add(event.start_datetime, 3 * 3600, :second), "%a %d %b %Y, %H:%M")

    lines =
      order.tickets
      |> Enum.group_by(& &1.ticket_type.name)
      |> Enum.map(fn {name, ts} -> "#{length(ts)} × #{name}" end)

    email(order.attendee_email, "Your tickets for #{event.title}", """
    Hi #{order.attendee_name},

    You're going to #{event.title}!

    When: #{when_text} (EAT)
    Where: #{event.location}
    Tickets: #{Enum.join(lines, ", ")}
    #{if order.mpesa_receipt, do: "M-Pesa receipt: #{order.mpesa_receipt}", else: ""}

    Your QR tickets: #{url}

    Show the QR code at the entrance. Each ticket can only be scanned once, so don't share it.
    """, button: {"View my tickets", url})

    if order.attendee_phone do
      sms(order.attendee_phone, "Klix: #{count} ticket(s) for #{event.title} confirmed. Your QR tickets: #{url}")
    end

    :ok
  end

  def password_reset(user, token) do
    url = "#{web_url()}/reset-password?token=#{token}"

    email(user.email, "Reset your Klix password", """
    Someone (hopefully you) asked to reset the password for your Klix account.

    Reset it here (the link works for one hour): #{url}

    If you didn't ask for this, you can ignore this email.
    """, button: {"Reset password", url})
  end

  def verify_email(user, token) do
    url = "#{web_url()}/verify-email?token=#{token}"

    email(user.email, "Confirm your email for Klix", """
    Please confirm this is your email address: #{url}

    Once confirmed, tickets bought with this address as a guest show up in your account.
    """, button: {"Confirm email", url})
  end

  def organizer_reviewed(user, organizer) do
    {subject, body} =
      case organizer.status do
        "approved" ->
          {"You're approved to sell tickets on Klix",
           "Good news: #{organizer.business_name} is approved. Create your first event at #{web_url()}/organizer"}

        status ->
          {"Update on your Klix organizer application",
           "Your application for #{organizer.business_name} was #{status}. #{organizer.rejection_reason || ""}"}
      end

    email(user.email, subject, body)
  end

  def promoter_reviewed(user, profile) do
    body =
      case profile.status do
        "approved" -> "You're approved as a Klix promoter. Pick events to promote at #{web_url()}/promoter"
        status -> "Your promoter application was #{status}. #{profile.rejection_reason || ""}"
      end

    email(user.email, "Your Klix promoter application", body)
  end

  def withdrawal_paid(user, withdrawal) do
    email(user.email, "Your Klix payout has been sent", """
    We've sent KES #{withdrawal.amount} to #{withdrawal.phone}.
    Reference: #{withdrawal.reference || "-"}
    """)
  end

  ## Delivery

  def email(to, subject, text, opts \\ []) do
    %{"channel" => "email", "to" => to, "subject" => subject, "text" => text, "html" => to_html(text, opts[:button])}
    |> Deliver.new()
    |> Oban.insert()
  end

  def sms(to, message) do
    %{"channel" => "sms", "to" => to, "message" => message}
    |> Deliver.new()
    |> Oban.insert()
  end

  defp to_html(text, button) do
    paragraphs =
      text
      |> String.trim()
      |> String.split(~r/\n{2,}/)
      |> Enum.map_join(fn p ->
        ~s(<p style="margin:0 0 14px">#{p |> escape() |> String.replace("\n", "<br>")}</p>)
      end)

    button_html =
      case button do
        {label, url} ->
          ~s(<p style="margin:24px 0"><a href="#{escape(url)}" style="background:#eb7d30;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">#{escape(label)}</a></p>)

        nil ->
          ""
      end

    """
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1c1917;font-size:15px;line-height:1.55">
      <p style="font-size:22px;font-weight:700;color:#eb7d30;margin:0 0 20px">klix</p>
      #{paragraphs}#{button_html}
      <p style="color:#6b6560;font-size:12px;margin-top:32px">Klix · support@klix.co.ke</p>
    </div>
    """
  end

  defp escape(text), do: Plug.HTML.html_escape(text)
end
