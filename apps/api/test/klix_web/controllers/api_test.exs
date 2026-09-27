defmodule KlixWeb.ApiTest do
  use KlixWeb.ConnCase, async: true

  describe "auth" do
    test "register, login, me, refresh", %{conn: conn} do
      conn1 =
        post(conn, "/api/v1/auth/register", %{
          "email" => "new@klix.test",
          "password" => "password123",
          "first_name" => "New"
        })

      assert %{"access_token" => _, "refresh_token" => refresh, "user" => %{"email" => "new@klix.test"}} =
               json_response(conn1, 201)

      conn1 = post(conn, "/api/v1/auth/login", %{"email" => "new@klix.test", "password" => "password123"})
      assert %{"access_token" => access, "token_type" => "bearer"} = json_response(conn1, 200)

      conn1 = conn |> put_req_header("authorization", "Bearer " <> access) |> get("/api/v1/auth/me")
      assert %{"email" => "new@klix.test", "role" => "attendee"} = json_response(conn1, 200)

      conn1 = post(conn, "/api/v1/auth/refresh", %{"refresh_token" => refresh})
      assert %{"access_token" => _} = json_response(conn1, 200)
    end

    test "bad credentials and missing tokens", %{conn: conn} do
      assert %{"detail" => "Incorrect email or password"} =
               conn
               |> post("/api/v1/auth/login", %{"email" => "x@y.z", "password" => "nope12345"})
               |> json_response(401)

      assert conn |> get("/api/v1/auth/me") |> json_response(401)
    end

    test "validation errors name the field", %{conn: conn} do
      conn = post(conn, "/api/v1/auth/register", %{"email" => "bad", "password" => "password123"})
      assert %{"detail" => "Email must be a valid email", "errors" => %{"email" => _}} = json_response(conn, 422)
    end
  end

  describe "organizer event management" do
    setup %{conn: conn} do
      organizer = organizer_fixture()
      %{organizer: organizer, conn: authenticate(conn, organizer.user)}
    end

    test "create, add tickets, publish, list", %{conn: conn} do
      starts = DateTime.utc_now() |> DateTime.add(86_400 * 3, :second)

      conn1 =
        post(conn, "/api/v1/events", %{
          "title" => "Rooftop Sessions",
          "category" => "music",
          "location" => "Westlands",
          "start_datetime" => DateTime.to_iso8601(starts),
          "end_datetime" => DateTime.to_iso8601(DateTime.add(starts, 3600 * 5, :second))
        })

      assert %{"id" => id, "status" => "draft", "slug" => slug} = json_response(conn1, 201)

      # Drafts are hidden from the public but visible to the owner.
      assert build_conn() |> get("/api/v1/events/slug/#{slug}") |> json_response(404)
      assert conn |> get("/api/v1/events/slug/#{slug}") |> json_response(200)

      assert %{"detail" => _} = conn |> post("/api/v1/events/#{id}/publish") |> json_response(400)

      conn1 =
        post(conn, "/api/v1/tickets/events/#{id}/ticket-types", %{
          "name" => "Early Bird",
          "price" => "800",
          "quantity_total" => 100
        })

      assert %{"name" => "Early Bird"} = json_response(conn1, 201)

      assert %{"status" => "published", "is_published" => true} =
               conn |> post("/api/v1/events/#{id}/publish") |> json_response(200)

      assert %{"data" => [%{"id" => ^id}], "total" => 1} =
               build_conn() |> get("/api/v1/events") |> json_response(200)

      assert %{"data" => [%{"id" => ^id}]} = conn |> get("/api/v1/events/my-events") |> json_response(200)
    end

    test "organizers cannot touch other organizers' events", %{conn: conn} do
      %{event: other} = on_sale_fixture()
      assert conn |> patch("/api/v1/events/#{other.id}", %{"title" => "Mine now"}) |> json_response(403)
    end

    test "attendees cannot create events" do
      conn = build_conn() |> authenticate(user_fixture())
      assert conn |> post("/api/v1/events", %{}) |> json_response(403)
    end
  end

  describe "promoter codes" do
    test "validate endpoint", %{conn: conn} do
      %{event: event} = on_sale_fixture()

      Klix.Repo.insert!(%Klix.Promoters.PromoterCode{
        code: "FRIENDS",
        code_type: "discount",
        discount_percentage: Decimal.new(15),
        promoter_id: user_fixture().id,
        event_id: event.id
      })

      assert %{"valid" => true, "data" => %{"discount_percentage" => "15.00"}} =
               conn
               |> get("/api/v1/promoters/codes/validate", %{"code" => "friends", "event_id" => event.id})
               |> json_response(200)

      assert %{"valid" => false} =
               conn
               |> get("/api/v1/promoters/codes/validate", %{"code" => "nope", "event_id" => event.id})
               |> json_response(200)
    end
  end

  test "health", %{conn: conn} do
    assert %{"status" => "ok", "database" => "ok"} = conn |> get("/health") |> json_response(200)
  end
end
