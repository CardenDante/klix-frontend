defmodule KlixWeb.Router do
  use KlixWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug KlixWeb.Plugs.Auth
  end

  pipeline :authenticated do
    plug KlixWeb.Plugs.RequireAuth
  end

  pipeline :organizer do
    plug KlixWeb.Plugs.RequireAuth, roles: ["organizer"]
  end

  pipeline :admin do
    plug KlixWeb.Plugs.RequireAuth, roles: ["admin"]
  end

  pipeline :auth_rate_limit do
    plug KlixWeb.Plugs.RateLimit, name: :auth, limit: 20, window: 60
  end

  pipeline :checkout_rate_limit do
    # Many Kenyan mobile users share one carrier IP (CGNAT), so anonymous
    # clients get a much higher allowance than signed-in ones.
    plug KlixWeb.Plugs.RateLimit, name: :checkout, limit: 20, anonymous_limit: 200, window: 60
  end

  pipeline :webhook do
    plug :accepts, ["json"]
  end

  get "/health", KlixWeb.HealthController, :show

  # Safaricom calls this; it is authenticated by the secret in the path.
  scope "/api/v1/payments/mpesa", KlixWeb do
    pipe_through :webhook
    post "/callback/:token", PaymentController, :mpesa_callback
  end

  scope "/api/v1", KlixWeb do
    pipe_through :api

    scope "/auth" do
      pipe_through :auth_rate_limit
      post "/register", AuthController, :register
      post "/login", AuthController, :login
      post "/firebase-login", AuthController, :firebase_login
    end

    post "/auth/refresh", AuthController, :refresh
    post "/auth/logout", AuthController, :logout

    # Public catalogue
    get "/events", EventController, :index
    get "/search", EventController, :index
    get "/events/slug/:slug", EventController, :show_by_slug
    get "/tickets/events/:event_id/ticket-types", TicketTypeController, :index
    get "/promoters/codes/validate", PromoterController, :validate_code

    # Checkout works for guests and signed-in users alike.
    scope "/" do
      pipe_through :checkout_rate_limit
      post "/tickets/purchase-cart", CheckoutController, :purchase_cart
      post "/tickets/purchase", CheckoutController, :purchase
      post "/tickets/cancel/:transaction_id", CheckoutController, :cancel
      post "/payments/initiate-mpesa", PaymentController, :initiate_mpesa
    end

    get "/payments/transaction/:transaction_id", PaymentController, :show
    get "/payments/query-status/:transaction_id", PaymentController, :query_status

    scope "/" do
      pipe_through :authenticated

      get "/auth/me", UserController, :me
      get "/users/me", UserController, :me
      patch "/users/me", UserController, :update
      patch "/users/me/preferences", UserController, :update_preferences

      get "/tickets/my-tickets", TicketController, :index
      post "/tickets/validate-qr", TicketController, :validate_qr
      post "/tickets/checkin", TicketController, :checkin
      get "/tickets/events/:event_id/checkin-stats", TicketController, :checkin_stats
      get "/tickets/:id", TicketController, :show

      post "/organizers/apply", OrganizerController, :create_application
      get "/organizers/me", OrganizerController, :me
      patch "/organizers/me", OrganizerController, :update

      get "/staff/my-staff-assignments", StaffController, :mine
    end

    scope "/" do
      pipe_through :organizer

      get "/events/my-events", EventController, :mine
      post "/events", EventController, :create
      patch "/events/:id", EventController, :update
      delete "/events/:id", EventController, :delete
      post "/events/:id/publish", EventController, :publish
      post "/events/:id/unpublish", EventController, :unpublish
      post "/events/:id/cancel", EventController, :cancel

      post "/tickets/events/:event_id/ticket-types", TicketTypeController, :create
      patch "/tickets/ticket-types/:id", TicketTypeController, :update
      delete "/tickets/ticket-types/:id", TicketTypeController, :delete

      get "/staff/events/:event_id/staff", StaffController, :index
      post "/staff/events/:event_id/staff", StaffController, :create
      patch "/staff/events/:event_id/staff/:id", StaffController, :update
      delete "/staff/events/:event_id/staff/:id", StaffController, :delete
    end

    # Must come after /events/my-events so that path isn't read as an id.
    get "/events/:id", EventController, :show

    scope "/admin" do
      pipe_through :admin

      get "/organizers", AdminController, :list_organizers
      get "/organizers/pending", AdminController, :pending_organizers
      post "/organizers/:id/approve", AdminController, :approve_organizer
      post "/organizers/:id/reject", AdminController, :reject_organizer
      post "/organizers/:id/suspend", AdminController, :suspend_organizer
    end
  end
end
