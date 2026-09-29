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

  pipeline :promoter do
    plug KlixWeb.Plugs.RequireAuth, roles: ["promoter"]
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
      post "/password-reset", AuthController, :password_reset
      post "/password-reset/confirm", AuthController, :password_reset_confirm
      post "/verify-email", AuthController, :verify_email
    end

    post "/auth/refresh", AuthController, :refresh
    post "/auth/logout", AuthController, :logout

    # Public catalogue
    get "/events", EventController, :index
    get "/search", EventController, :index
    get "/events/slug/:slug", EventController, :show_by_slug
    get "/tickets/events/:event_id/ticket-types", TicketTypeController, :index
    get "/promoters/codes/validate", PromoterController, :validate_code
    post "/promoters/track-click", PromoterController, :track_click
    get "/promoters/leaderboard", PromoterController, :leaderboard

    # Discovery (personalised when signed in)
    get "/recommendations/trending", RecommendationController, :trending
    get "/recommendations/popular", RecommendationController, :popular
    get "/recommendations/similar/:event_id", RecommendationController, :similar
    get "/recommendations/for-you", RecommendationController, :for_you
    get "/recommendations/discovery", RecommendationController, :discovery
    get "/search/suggestions", RecommendationController, :suggestions
    get "/search/facets", RecommendationController, :facets
    get "/search/nearby", RecommendationController, :nearby
    get "/search/popular", RecommendationController, :popular

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
      post "/auth/verify-email/request", AuthController, :request_verification
      post "/auth/change-password", AuthController, :change_password
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

      get "/recommendations/preferences", RecommendationController, :preferences
      put "/recommendations/preferences", RecommendationController, :update_preferences

      get "/loyalty/balance", LoyaltyController, :balance
      get "/loyalty/transactions", LoyaltyController, :transactions
      get "/loyalty/credits/available", LoyaltyController, :available
      get "/loyalty/credits/expiring", LoyaltyController, :expiring
      get "/loyalty/summary", LoyaltyController, :summary

      post "/uploads/upload", UploadController, :create
      get "/uploads/my-uploads", UploadController, :mine
      get "/uploads/files/:id", UploadController, :show
      delete "/uploads/files/:id", UploadController, :delete

      # Anyone signed in can apply to promote; the rest needs approval.
      post "/promoters/apply", PromoterController, :create_application
      get "/promoters/me", PromoterController, :me
      patch "/promoters/me", PromoterController, :update_me
    end

    scope "/" do
      pipe_through :promoter

      post "/promoters/codes", PromoterController, :create_code
      get "/promoters/my-codes", PromoterController, :my_codes
      get "/promoters/code/:id/analytics", PromoterController, :code_analytics
      post "/promoters/code/:id/deactivate", PromoterController, :deactivate_code
      get "/promoters/earnings", PromoterController, :earnings
      post "/promoters/withdraw", PromoterController, :withdraw
      get "/promoters/withdrawals", PromoterController, :withdrawals
      get "/analytics/promoter/dashboard", AnalyticsController, :promoter_dashboard

      post "/promoter-requests/events/request", PromoterRequestController, :request_event
      get "/promoter-requests/my-requests", PromoterRequestController, :my_requests
      get "/promoter-requests/approved-events", PromoterRequestController, :approved_events
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

      get "/analytics/organizer/dashboard", AnalyticsController, :organizer_dashboard
      get "/analytics/organizer/events/:event_id/stats", AnalyticsController, :event_stats

      get "/promoter-requests/organizers/promoter-requests", PromoterRequestController, :organizer_requests
      post "/promoter-requests/organizers/promoter-requests/:id/approve", PromoterRequestController, :approve
      post "/promoter-requests/organizers/promoter-requests/:id/reject", PromoterRequestController, :reject
      post "/promoter-requests/organizers/promoter-requests/:id/revoke", PromoterRequestController, :revoke
      patch "/promoter-requests/organizers/promoter-requests/:id", PromoterRequestController, :update_terms
      get "/promoter-requests/organizers/events/:event_id/approved-promoters", PromoterRequestController, :approved_promoters

      get "/organizers/me/mpesa", OrganizerController, :mpesa
      put "/organizers/me/mpesa", OrganizerController, :save_mpesa
      post "/organizers/me/mpesa/verify", OrganizerController, :verify_mpesa
      delete "/organizers/me/mpesa", OrganizerController, :delete_mpesa
      get "/organizers/me/settlements", OrganizerController, :settlements
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

      get "/statistics", AnalyticsController, :admin_overview
      get "/analytics/overview", AnalyticsController, :admin_overview

      get "/promoters", AdminController, :list_promoters
      get "/promoters/pending", AdminController, :pending_promoters
      post "/promoters/:id/approve", AdminController, :approve_promoter
      post "/promoters/:id/reject", AdminController, :reject_promoter
      post "/promoters/:id/suspend", AdminController, :suspend_promoter

      get "/users", AdminController, :list_users
      get "/users/:id", AdminController, :show_user
      patch "/users/:id/role", AdminController, :update_role
      post "/users/:id/suspend", AdminController, :suspend_user
      post "/users/:id/unsuspend", AdminController, :unsuspend_user
      post "/users/:id/loyalty", AdminController, :adjust_loyalty
      delete "/users/:id", AdminController, :delete_user

      get "/events", AdminController, :list_events
      post "/events/:id/flag", AdminController, :flag_event
      post "/events/:id/unflag", AdminController, :unflag_event
      delete "/events/:id/force-delete", AdminController, :force_delete_event

      get "/withdrawals", AdminController, :list_withdrawals
      post "/withdrawals/:id/pay", AdminController, :pay_withdrawal
      post "/withdrawals/:id/reject", AdminController, :reject_withdrawal

      get "/settlements/pending", AdminController, :pending_settlements
      get "/settlements", AdminController, :paid_settlements
      post "/settlements/:event_id", AdminController, :settle_event

      get "/audit-logs", AdminController, :audit_logs
    end
  end
end
