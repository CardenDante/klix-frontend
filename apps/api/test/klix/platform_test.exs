defmodule Klix.PlatformTest do
  @moduledoc "Uploads, organizer M-Pesa accounts, settlements, analytics, audit and discovery."
  use Klix.DataCase, async: false

  alias Klix.{Analytics, Audit, Payments, Recommendations, Settlements, Uploads, Vault}
  alias Klix.Payments.MpesaCredential

  @png <<0x89, "PNG", 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13>>

  defp upload(body, name) do
    path = Path.join(System.tmp_dir!(), "klix-test-#{System.unique_integer([:positive])}")
    File.write!(path, body)
    %Plug.Upload{path: path, filename: name, content_type: "application/octet-stream"}
  end

  describe "uploads" do
    test "stores images, sniffing the real type" do
      user = user_fixture()
      assert {:ok, file} = Uploads.store(user, upload(@png, "banner.jpg"), "event_banner")
      assert file.mime_type == "image/png"
      assert file.key =~ ~r"^event_banner/\d{4}/\d{2}/.+\.png$"
      assert File.exists?(Path.join(Klix.Uploads.LocalStorage.root(), file.key))

      {:ok, _} = Uploads.delete(file)
      refute File.exists?(Path.join(Klix.Uploads.LocalStorage.root(), file.key))
    end

    test "rejects non-images and unknown upload types" do
      user = user_fixture()
      assert {:error, {:validation, _}} = Uploads.store(user, upload("<?php evil();", "x.png"), "event_banner")
      assert {:error, {:validation, _}} = Uploads.store(user, upload(@png, "x.png"), "anything")
    end
  end

  describe "organizer M-Pesa accounts" do
    test "credentials are encrypted, verified, then used for that organizer's orders" do
      %{organizer: organizer, ticket_type: tt} = on_sale_fixture()

      {:ok, credential} =
        Payments.save_credential(organizer, %{
          "credential_type" => "paybill",
          "shortcode" => "600123",
          "consumer_key" => "ck-live",
          "consumer_secret" => "cs-live",
          "passkey" => "pk-live"
        })

      refute credential.is_active
      assert {:ok, "ck-live"} = Vault.decrypt(credential.encrypted_consumer_key)
      refute credential.encrypted_consumer_key =~ "ck-live"
      assert MpesaCredential.masked_shortcode(credential) == "•••123"

      # Unverified credentials aren't used.
      {:ok, order} = Klix.Orders.create_order(nil, order_params(tt, 1))
      {:ok, order} = Payments.initiate_mpesa(order)
      assert order.payment_account == "platform"

      {:ok, credential} = Payments.verify_credential(credential)
      assert credential.is_active

      {:ok, order} = Klix.Orders.create_order(nil, order_params(tt, 1))
      {:ok, order} = Payments.initiate_mpesa(order)
      assert order.payment_account == "organizer"
      assert order.mpesa_shortcode == "600123"
    end

    test "bad credentials fail verification" do
      %{organizer: organizer} = on_sale_fixture()

      {:ok, credential} =
        Payments.save_credential(organizer, %{
          "credential_type" => "till_number",
          "shortcode" => "5123456",
          "store_number" => "7123456",
          "consumer_key" => "invalid",
          "consumer_secret" => "x",
          "passkey" => "y"
        })

      assert {:error, {:validation, _}} = Payments.verify_credential(credential)
    end

    test "tills need a store number" do
      %{organizer: organizer} = on_sale_fixture()

      assert {:error, cs} =
               Payments.save_credential(organizer, %{
                 "credential_type" => "till_number",
                 "shortcode" => "5123456",
                 "consumer_key" => "a",
                 "consumer_secret" => "b",
                 "passkey" => "c"
               })

      assert %{store_number: [_]} = errors_on(cs)
    end
  end

  describe "settlements and analytics" do
    test "statements account for fees, commissions and money collected directly" do
      %{event: event, organizer: organizer, ticket_type: tt} = on_sale_fixture(%{"price" => "1000", "quantity_total" => 50})
      %{code: code} = promoter_code_fixture(event, %{"commission_percentage" => "10"})

      paid_order_fixture(tt, nil, 3)
      paid_order_fixture(tt, nil, 2, %{"promoter_code" => code.code})

      statement = Settlements.statement(event)
      # gross 5000, fee 5% = 250, commission 10% of 2000 = 200
      assert Decimal.eq?(statement.gross, 5000)
      assert Decimal.eq?(statement.platform_fees, 250)
      assert Decimal.eq?(statement.promoter_commissions, 200)
      assert Decimal.eq?(statement.net_payable, 4550)
      assert statement.status == "accruing"

      admin = admin_fixture()
      assert {:error, {:validation, _}} = Settlements.mark_paid(event, admin, %{})

      event = end_event(event)
      assert [%{event_id: id}] = Settlements.pending()
      assert id == event.id

      assert {:ok, settlement} = Settlements.mark_paid(event, admin, %{"reference" => "BANK-1"})
      assert Decimal.eq?(settlement.net_payable, 4550)
      assert Settlements.pending() == []
      assert [%{status: "paid"}] = Settlements.organizer_statements(organizer)

      dashboard = Analytics.organizer_dashboard(organizer)
      assert Decimal.eq?(dashboard.total_revenue, 5000)
      assert dashboard.total_tickets_sold == 5
      assert Decimal.eq?(dashboard.total_net_revenue, 4550)

      stats = Analytics.event_analytics(event)
      assert stats.tickets_sold == 5
      assert [%{tickets_sold: 5}] = stats.sales_by_type
      assert [%{cumulative_tickets: 5}] = stats.daily_sales
      assert [%{times_used: 1}] = stats.top_promoters
      assert stats.customer_demographics.total_customers == 1

      overview = Analytics.admin_overview()
      assert overview.tickets_sold == 5
      assert length(overview.monthly) == 12
    end
  end

  describe "audit" do
    test "logs actions with their target" do
      admin = admin_fixture()
      target = user_fixture()
      {:ok, _} = Audit.log(admin, "user.suspend", target, %{reason: "spam"}, "1.2.3.4")

      {[log], %{total: 1}} = Audit.list(%{"action" => "user."})
      assert log.target_type == "user"
      assert log.target_id == target.id
      assert log.metadata == %{"reason" => "spam"}
    end
  end

  describe "discovery" do
    test "trending, similar, for-you, suggestions, facets and nearby" do
      %{event: event, organizer: organizer, ticket_type: tt} = on_sale_fixture()
      other = event_fixture(organizer, %{"title" => "Jazz Night", "latitude" => -1.2921, "longitude" => 36.8219})
      ticket_type_fixture(other)
      {:ok, other} = Klix.Events.publish_event(other)

      buyer = user_fixture()
      paid_order_fixture(tt, buyer, 1)

      assert [%{id: first} | _] = Recommendations.trending()
      assert first == event.id
      assert Enum.map(Recommendations.similar(event.id), & &1.id) == [other.id]
      # Already has tickets for `event`, so it's not recommended back.
      assert Enum.map(Recommendations.for_you(buyer), & &1.id) |> Enum.take(1) == [other.id]
      assert Enum.any?(Recommendations.suggestions("jaz"), &(&1.label == "Jazz Night"))
      assert [%{value: "music", count: 2}] = Recommendations.facets()

      assert [%{id: near}] = Recommendations.nearby(%{"latitude" => "-1.29", "longitude" => "36.82", "radius_km" => "5"})
      assert near == other.id
      assert [] = Recommendations.nearby(%{"latitude" => "0.5", "longitude" => "35.0", "radius_km" => "5"})
    end
  end
end
