defmodule KlixWeb.PlatformApiTest do
  use KlixWeb.ConnCase, async: false

  describe "promoter programme over HTTP" do
    test "apply → admin approves → request → organizer approves → code → sale → earnings", %{conn: conn} do
      %{event: event, organizer: organizer, ticket_type: tt} = on_sale_fixture(%{"price" => "1000"})
      admin = admin_fixture()
      user = user_fixture()

      assert %{"status" => "pending", "id" => profile_id} =
               conn |> authenticate(user) |> post("/api/v1/promoters/apply", %{"display_name" => "DJ Promo"}) |> json_response(201)

      # Not approved yet: promoter-only routes are closed.
      assert conn |> authenticate(user) |> get("/api/v1/promoters/my-codes") |> json_response(403)

      assert %{"data" => [%{"id" => ^profile_id}]} =
               conn |> authenticate(admin) |> get("/api/v1/admin/promoters/pending") |> json_response(200)

      assert %{"data" => %{"status" => "approved"}} =
               conn |> authenticate(admin) |> post("/api/v1/admin/promoters/#{profile_id}/approve") |> json_response(200)

      assert %{"id" => request_id, "status" => "pending"} =
               conn
               |> authenticate(user)
               |> post("/api/v1/promoter-requests/events/request", %{"event_id" => event.id, "message" => "Let me in"})
               |> json_response(201)

      assert %{"requests" => [%{"id" => ^request_id, "promoter_name" => "DJ Promo"}]} =
               conn
               |> authenticate(organizer.user)
               |> get("/api/v1/promoter-requests/organizers/promoter-requests")
               |> json_response(200)

      assert %{"data" => %{"status" => "approved"}} =
               conn
               |> authenticate(organizer.user)
               |> post("/api/v1/promoter-requests/organizers/promoter-requests/#{request_id}/approve", %{
                 "commission_percentage" => "10",
                 "discount_percentage" => "10"
               })
               |> json_response(200)

      assert %{"code" => "DJ2026", "code_type" => "discount"} =
               conn
               |> authenticate(user)
               |> post("/api/v1/promoters/codes", %{"event_id" => event.id, "code" => "dj2026"})
               |> json_response(201)

      assert %{"success" => true} = conn |> post("/api/v1/promoters/track-click", %{"code" => "DJ2026"}) |> json_response(200)

      paid_order_fixture(tt, nil, 2, %{"promoter_code" => "DJ2026"})

      assert [%{"tickets_sold" => 2, "clicks" => 1}] =
               conn |> authenticate(user) |> get("/api/v1/promoters/my-codes") |> json_response(200)

      assert %{"data" => %{"pending" => "180.00"}} =
               conn |> authenticate(user) |> get("/api/v1/promoters/earnings") |> json_response(200)

      assert %{"data" => %{"total_tickets_sold" => 2}} =
               conn |> authenticate(user) |> get("/api/v1/analytics/promoter/dashboard") |> json_response(200)

      assert %{"data" => [%{"display_name" => "DJ Promo"}]} =
               conn |> get("/api/v1/promoters/leaderboard") |> json_response(200)
    end
  end

  describe "admin" do
    setup %{conn: conn} do
      admin = admin_fixture()
      %{admin: admin, conn: authenticate(conn, admin)}
    end

    test "users: search, suspend, role, audit trail", %{conn: conn, admin: admin} do
      target = user_fixture(%{"first_name" => "Findme"})

      assert %{"data" => [%{"id" => id}]} = conn |> get("/api/v1/admin/users", %{"q" => "findme"}) |> json_response(200)
      assert id == target.id

      assert %{"data" => %{"is_active" => false}} =
               conn |> post("/api/v1/admin/users/#{id}/suspend", %{"reason" => "spam"}) |> json_response(200)

      # Suspended users are signed out immediately.
      assert build_conn() |> authenticate(target) |> get("/api/v1/auth/me") |> json_response(401)

      assert %{"data" => %{"role" => "organizer"}} =
               conn |> patch("/api/v1/admin/users/#{id}/role", %{"role" => "organizer"}) |> json_response(200)

      assert %{"detail" => _} = conn |> post("/api/v1/admin/users/#{admin.id}/suspend") |> json_response(400)

      assert %{"data" => logs} = conn |> get("/api/v1/admin/audit-logs") |> json_response(200)
      assert Enum.map(logs, & &1["action"]) |> Enum.sort() == ["user.role", "user.suspend"]
      assert %{"ip" => "127.0.0.1", "actor" => %{"id" => actor_id}} = hd(logs)
      assert actor_id == admin.id
    end

    test "flagged events disappear from public listings", %{conn: conn} do
      %{event: event} = on_sale_fixture()
      assert %{"total" => 1} = build_conn() |> get("/api/v1/events") |> json_response(200)

      assert %{"data" => %{"is_flagged" => true}} =
               conn |> post("/api/v1/admin/events/#{event.id}/flag", %{"reason" => "Scam"}) |> json_response(200)

      assert %{"total" => 0} = build_conn() |> get("/api/v1/events") |> json_response(200)
      assert build_conn() |> get("/api/v1/events/slug/#{event.slug}") |> json_response(404)

      conn |> post("/api/v1/admin/events/#{event.id}/unflag") |> json_response(200)
      assert %{"total" => 1} = build_conn() |> get("/api/v1/events") |> json_response(200)
    end

    test "overview, loyalty adjustment and settlements", %{conn: conn} do
      user = user_fixture()

      assert %{"users" => %{"total" => _}, "monthly" => monthly} = conn |> get("/api/v1/admin/statistics") |> json_response(200)
      assert length(monthly) == 12

      assert %{"available_credits" => 250} =
               conn |> post("/api/v1/admin/users/#{user.id}/loyalty", %{"credits" => "250"}) |> json_response(200)

      assert conn |> post("/api/v1/admin/users/#{user.id}/loyalty", %{"credits" => "abc"}) |> json_response(400)

      assert %{"data" => []} = conn |> get("/api/v1/admin/settlements/pending") |> json_response(200)
    end

    test "non-admins are kept out" do
      assert build_conn() |> authenticate(user_fixture()) |> get("/api/v1/admin/users") |> json_response(403)
    end
  end

  describe "accounts" do
    test "password reset request always succeeds", %{conn: conn} do
      assert %{"success" => true} =
               conn |> post("/api/v1/auth/password-reset", %{"email" => "ghost@nowhere.test"}) |> json_response(200)

      assert %{"detail" => "Invalid or expired token"} =
               conn
               |> post("/api/v1/auth/password-reset/confirm", %{"token" => "nope", "password" => "whatever123"})
               |> json_response(401)
    end

    test "loyalty and change password", %{conn: conn} do
      user = user_fixture()
      conn = authenticate(conn, user)

      assert %{"available_credits" => 0} = conn |> get("/api/v1/loyalty/balance") |> json_response(200)

      assert %{"detail" => _} =
               conn
               |> post("/api/v1/auth/change-password", %{"current_password" => "wrong", "new_password" => "newpassword1"})
               |> json_response(400)

      assert %{"success" => true} =
               conn
               |> post("/api/v1/auth/change-password", %{"current_password" => "password123", "new_password" => "newpassword1"})
               |> json_response(200)
    end
  end

  describe "organizer tools" do
    test "M-Pesa credentials, analytics and settlements", %{conn: conn} do
      %{organizer: organizer, event: event, ticket_type: tt} = on_sale_fixture()
      conn = authenticate(conn, organizer.user)

      assert %{"data" => nil} = conn |> get("/api/v1/organizers/me/mpesa") |> json_response(200)

      assert %{"data" => %{"shortcode_masked" => "•••456", "is_active" => false}} =
               conn
               |> put("/api/v1/organizers/me/mpesa", %{
                 "credential_type" => "paybill",
                 "shortcode" => "123456",
                 "consumer_key" => "k",
                 "consumer_secret" => "s",
                 "passkey" => "p"
               })
               |> json_response(200)

      assert %{"data" => %{"is_active" => true}} = conn |> post("/api/v1/organizers/me/mpesa/verify") |> json_response(200)

      paid_order_fixture(tt, nil, 2)

      assert %{"total_tickets_sold" => 2} = conn |> get("/api/v1/analytics/organizer/dashboard") |> json_response(200)
      assert %{"tickets_sold" => 2} = conn |> get("/api/v1/analytics/organizer/events/#{event.id}/stats") |> json_response(200)
      assert %{"data" => [%{"status" => "accruing"}]} = conn |> get("/api/v1/organizers/me/settlements") |> json_response(200)

      other = on_sale_fixture()
      assert conn |> get("/api/v1/analytics/organizer/events/#{other.event.id}/stats") |> json_response(403)
    end
  end

  describe "discovery" do
    test "public recommendation and search endpoints", %{conn: conn} do
      %{event: event} = on_sale_fixture()

      assert %{"data" => [%{"id" => id}]} = conn |> get("/api/v1/recommendations/trending") |> json_response(200)
      assert id == event.id
      assert %{"data" => []} = conn |> get("/api/v1/recommendations/similar/#{event.id}") |> json_response(200)
      assert %{"data" => %{"trending" => [_]}} = conn |> get("/api/v1/recommendations/discovery") |> json_response(200)
      assert %{"data" => [%{"value" => "music"}]} = conn |> get("/api/v1/search/facets") |> json_response(200)
      assert %{"data" => [_ | _]} = conn |> get("/api/v1/search/suggestions", %{"q" => "concert"}) |> json_response(200)
      assert conn |> get("/api/v1/search/nearby") |> json_response(400)
    end
  end
end
