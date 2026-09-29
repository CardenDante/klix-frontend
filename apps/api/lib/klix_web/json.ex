defmodule KlixWeb.JSON do
  @moduledoc """
  Serializers for the `/api/v1` contract. Field names match the previous
  API so existing clients keep working. Money is serialized as a decimal
  string (e.g. `"1500.00"`), timestamps as ISO 8601 UTC.
  """

  alias Klix.Accounts.{User, Organizer}
  alias Klix.Events.{Event, TicketType}
  alias Klix.Orders.{Order, Ticket}
  alias Klix.Promoters.{EventApproval, Profile, PromoterCode, Withdrawal}
  alias Klix.Staff.Assignment

  def user(%User{} = u) do
    %{
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: User.full_name(u),
      phone_number: u.phone_number,
      role: u.role,
      is_active: u.is_active,
      email_verified: u.email_verified,
      profile_image_url: u.profile_image_url,
      preferences: u.preferences,
      is_organizer: u.role in ["organizer", "admin"],
      is_promoter: u.role == "promoter",
      is_admin: u.role == "admin",
      created_at: u.inserted_at,
      updated_at: u.updated_at
    }
  end

  def organizer(%Organizer{} = o) do
    %{
      id: o.id,
      user_id: o.user_id,
      business_name: o.business_name,
      business_registration: o.business_registration,
      description: o.description,
      website: o.website,
      logo_url: o.logo_url,
      status: o.status,
      approved_at: o.approved_at,
      rejection_reason: o.rejection_reason,
      created_at: o.inserted_at,
      updated_at: o.updated_at
    }
    |> maybe_put(:user, o.user, &user/1)
  end

  def organizer_public(%Organizer{} = o) do
    %{
      id: o.id,
      business_name: o.business_name,
      description: o.description,
      logo_url: o.logo_url,
      website: o.website
    }
  end

  def event(%Event{} = e) do
    %{
      id: e.id,
      organizer_id: e.organizer_id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      category: e.category,
      location: e.location,
      latitude: e.latitude,
      longitude: e.longitude,
      start_datetime: e.start_datetime,
      end_datetime: e.end_datetime,
      banner_image_url: e.banner_image_url,
      portrait_image_url: e.portrait_image_url,
      additional_images: e.additional_images,
      status: e.status,
      is_published: e.status == "published",
      is_flagged: not is_nil(e.flagged_at),
      flag_reason: e.flag_reason,
      published_at: e.published_at,
      settings: e.settings,
      total_capacity: e.total_capacity || 0,
      tickets_sold: e.tickets_sold || 0,
      tickets_available: e.tickets_available || 0,
      is_sold_out: (e.total_capacity || 0) > 0 and (e.tickets_available || 0) <= 0,
      min_price: e.min_price,
      created_at: e.inserted_at,
      updated_at: e.updated_at
    }
    |> maybe_put(:organizer, e.organizer, &organizer_public/1)
  end

  def event_brief(%Event{} = e) do
    %{
      id: e.id,
      title: e.title,
      slug: e.slug,
      location: e.location,
      start_datetime: e.start_datetime,
      end_datetime: e.end_datetime,
      banner_image_url: e.banner_image_url,
      portrait_image_url: e.portrait_image_url,
      status: e.status
    }
  end

  def ticket_type(%TicketType{} = t) do
    available = TicketType.available(t)

    %{
      id: t.id,
      event_id: t.event_id,
      name: t.name,
      description: t.description,
      price: t.price,
      quantity_total: t.quantity_total,
      quantity_sold: t.quantity_sold,
      quantity_reserved: t.quantity_reserved,
      quantity_available: available,
      max_per_order: t.max_per_order,
      sale_start: t.sale_start,
      sale_end: t.sale_end,
      is_active: t.is_active,
      is_on_sale: TicketType.on_sale?(t),
      is_sold_out: available <= 0,
      sold_percentage:
        if(t.quantity_total > 0, do: Float.round(t.quantity_sold * 100 / t.quantity_total, 1), else: 0.0),
      sort_order: t.sort_order,
      settings: t.settings,
      created_at: t.inserted_at,
      updated_at: t.updated_at
    }
  end

  def ticket(%Ticket{} = t) do
    %{
      id: t.id,
      ticket_number: t.ticket_number,
      ticket_type_id: t.ticket_type_id,
      event_id: t.event_id,
      order_id: t.order_id,
      user_id: t.user_id,
      attendee_name: t.attendee_name,
      attendee_email: t.attendee_email,
      attendee_phone: t.attendee_phone,
      status: t.status,
      original_price: t.original_price,
      discount_amount: t.discount_amount,
      final_price: t.final_price,
      is_guest_purchase: t.is_guest_purchase,
      purchased_at: t.purchased_at,
      checked_in_at: t.checked_in_at,
      is_valid: t.status == "confirmed",
      is_checked_in: not is_nil(t.checked_in_at),
      # Only issued once paid; a pending ticket has nothing to scan.
      qr_code: if(t.status in ["confirmed", "used"], do: Klix.Tickets.qr_code(t)),
      created_at: t.inserted_at,
      updated_at: t.updated_at
    }
    |> maybe_put(:event, t.event, &event_brief/1)
    |> maybe_put(:ticket_type, t.ticket_type, fn tt -> %{id: tt.id, name: tt.name, price: tt.price} end)
  end

  def order(%Order{} = o) do
    %{
      transaction_id: o.id,
      id: o.id,
      event_id: o.event_id,
      status: o.status,
      currency: o.currency,
      subtotal: o.subtotal,
      discount_amount: o.discount_amount,
      credits_applied: o.credits_applied,
      amount: o.amount,
      attendee_name: o.attendee_name,
      attendee_email: o.attendee_email,
      attendee_phone: o.attendee_phone,
      payment_method: o.payment_method,
      mpesa_receipt: o.mpesa_receipt,
      checkout_request_id: o.mpesa_checkout_request_id,
      expires_at: o.expires_at,
      paid_at: o.paid_at,
      failure_reason: o.failure_reason,
      created_at: o.inserted_at,
      updated_at: o.updated_at
    }
    |> maybe_put(:event, o.event, &event_brief/1)
    |> maybe_put(:tickets, o.tickets, fn tickets -> Enum.map(tickets, &ticket/1) end)
  end

  def promoter_code_validation(%PromoterCode{} = c) do
    %{
      code: c.code,
      code_type: c.code_type,
      discount_percentage: if(c.code_type == "discount", do: c.discount_percentage, else: 0),
      event_id: c.event_id
    }
  end

  def promoter_profile(%Profile{} = p) do
    %{
      id: p.id,
      user_id: p.user_id,
      display_name: p.display_name,
      bio: p.bio,
      social_links: p.social_links,
      experience: p.experience,
      payout_phone: p.payout_phone,
      status: p.status,
      approved_at: p.approved_at,
      rejection_reason: p.rejection_reason,
      created_at: p.inserted_at,
      updated_at: p.updated_at
    }
    |> maybe_put(:user, p.user, &user/1)
  end

  def event_approval(%EventApproval{} = a) do
    %{
      id: a.id,
      promoter_id: a.promoter_id,
      event_id: a.event_id,
      organizer_id: a.organizer_id,
      status: a.status,
      message: a.message,
      response_message: a.response_message,
      commission_percentage: a.commission_percentage,
      discount_percentage: a.discount_percentage,
      approved_at: a.approved_at,
      rejected_at: a.rejected_at,
      revoked_at: a.revoked_at,
      promoter_name: Map.get(a, :promoter_name),
      created_at: a.inserted_at,
      updated_at: a.updated_at
    }
    |> maybe_put(:event, a.event, &event_brief/1)
    |> maybe_put(:promoter, a.promoter, fn u -> %{id: u.id, email: u.email, full_name: User.full_name(u)} end)
  end

  def promoter_code(%PromoterCode{} = c) do
    %{
      id: c.id,
      code: c.code,
      event_id: c.event_id,
      code_type: c.code_type,
      discount_percentage: c.discount_percentage,
      commission_percentage: c.commission_percentage,
      usage_limit: c.usage_limit,
      times_used: c.times_used,
      clicks: c.clicks,
      is_active: c.is_active,
      valid_from: c.valid_from,
      valid_until: c.valid_until,
      created_at: c.inserted_at
    }
    |> Map.merge(Map.get(c, :stats, %{}))
    |> maybe_put(:event, c.event, &event_brief/1)
  end

  def withdrawal(%Withdrawal{} = w) do
    %{
      id: w.id,
      promoter_id: w.promoter_id,
      amount: w.amount,
      phone: w.phone,
      status: w.status,
      reference: w.reference,
      note: w.note,
      processed_at: w.processed_at,
      created_at: w.inserted_at
    }
    |> maybe_put(:promoter, w.promoter, fn u -> %{id: u.id, email: u.email, full_name: User.full_name(u)} end)
  end

  def loyalty_transaction(%Klix.Loyalty.Transaction{} = t) do
    %{
      id: t.id,
      user_id: t.user_id,
      transaction_type: t.transaction_type,
      credits: t.credits,
      remaining: t.remaining,
      description: t.description,
      reference_id: t.reference_id,
      expires_at: t.expires_at,
      created_at: t.inserted_at
    }
  end

  def audit_log(%Klix.Audit.Log{} = l) do
    %{
      id: l.id,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      metadata: l.metadata,
      ip: l.ip,
      created_at: l.inserted_at
    }
    |> maybe_put(:actor, l.actor, fn u -> %{id: u.id, email: u.email, full_name: User.full_name(u)} end)
  end

  def file_upload(%Klix.Uploads.FileUpload{} = f) do
    %{
      id: f.id,
      uploader_id: f.uploader_id,
      entity_id: f.entity_id,
      upload_type: f.upload_type,
      file_name: f.file_name,
      file_path: f.key,
      file_url: f.url,
      file_size: f.byte_size,
      mime_type: f.mime_type,
      created_at: f.inserted_at
    }
  end

  def mpesa_credential(%Klix.Payments.MpesaCredential{} = c) do
    %{
      id: c.id,
      organizer_id: c.organizer_id,
      credential_type: c.credential_type,
      environment: c.environment,
      shortcode_masked: Klix.Payments.MpesaCredential.masked_shortcode(c),
      store_number: c.store_number,
      is_active: c.is_active,
      verified_at: c.verified_at,
      created_at: c.inserted_at,
      updated_at: c.updated_at
    }
  end

  def settlement(%Klix.Settlements.Settlement{} = s) do
    %{
      id: s.id,
      event_id: s.event_id,
      organizer_id: s.organizer_id,
      gross: s.gross,
      platform_fees: s.platform_fees,
      promoter_commissions: s.promoter_commissions,
      collected_by_organizer: s.collected_by_organizer,
      net_payable: s.net_payable,
      reference: s.reference,
      note: s.note,
      paid_at: s.paid_at
    }
    |> maybe_put(:event, s.event, &event_brief/1)
    |> maybe_put(:organizer, s.organizer, &organizer_public/1)
  end

  def staff_assignment(%Assignment{} = a) do
    %{
      id: a.id,
      event_id: a.event_id,
      user_id: a.user_id,
      role: a.role,
      permissions: a.permissions,
      is_active: a.is_active,
      assigned_at: a.inserted_at
    }
    |> maybe_put(:user, a.user, fn u ->
      %{id: u.id, email: u.email, full_name: User.full_name(u)}
    end)
    |> maybe_put(:event, a.event, &event_brief/1)
  end

  def paginated(entries, meta, fun) do
    Map.merge(%{success: true, data: Enum.map(entries, fun)}, meta)
  end

  def changeset_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  # Associations that weren't preloaded are left out rather than erroring.
  defp maybe_put(map, _key, %Ecto.Association.NotLoaded{}, _fun), do: map
  defp maybe_put(map, _key, nil, _fun), do: map
  defp maybe_put(map, key, value, fun), do: Map.put(map, key, fun.(value))
end
