# Klix

Event discovery and ticketing for Kenya, with M-Pesa payments and QR check-in.

```
apps/
  api/          Elixir / Phoenix JSON API  (new)
  web/          Next.js 16 web app          (new)
  legacy-web/   Previous Next.js app, kept until the new web app reaches feature parity
```

## Quick start

**Everything in Docker**

```bash
docker compose up --build
# web  → http://localhost:3000
# api  → http://localhost:4000/health
```

Payments use a fake M-Pesa that approves a few seconds after the prompt, so you can click through checkout end to end.

**Running locally**

```bash
# API: needs Elixir 1.17+ and Postgres
cd apps/api
mix setup          # deps, create + migrate DB, seed demo data
mix phx.server     # http://localhost:4000

# Web: needs Node 22
cd apps/web
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Seeded accounts (password `password123`): `admin@klix.test`, `organizer@klix.test`, `staff@klix.test`, `fan@klix.test`.
The seeded concert has a promo code, `KLIX10`. In dev, M-Pesa numbers `0700000001` and `0700000002` simulate a failed and a cancelled payment.

## Architecture

```
 Browser ──► Next.js (ISR pages, React Query) ──► Phoenix API ──► Postgres
    ▲                                              │  ▲
    └──── Phoenix Channel: live payment status ◄───┘  └── M-Pesa callback / Oban jobs
```

### How the API stays correct and fast under load

When tickets go on sale, thousands of people hit the same event at once. The API is built so that this is safe and cheap:

| Concern | Approach |
| --- | --- |
| **Overselling** | A reservation is a single conditional `UPDATE ticket_types SET reserved = reserved + n WHERE available >= n`. Postgres serializes writers on that row, so the last ticket can only go to one buyer. A `CHECK (sold + reserved <= total)` constraint makes overselling impossible even if the code has a bug. Carts lock ticket types in id order, so orders can't deadlock each other. |
| **No locks during payment** | Nothing is locked while the customer is on the M-Pesa prompt. Tickets are *reserved* for 10 minutes, extended while a prompt is open. |
| **Abandoned checkouts** | Each order schedules an Oban job to release its reservation, and a per-minute cron sweep catches any job that was lost. Both survive node restarts. |
| **Lost M-Pesa callbacks** | After every STK push, a reconciliation job polls Safaricom's status API until the order resolves. |
| **Duplicate or late callbacks** | Completing an order locks the order row and is idempotent. If the money arrives after a reservation lapsed, the tickets are re-taken if still available; otherwise the order is flagged `refund_required`. |
| **Hot event pages** | Public event and ticket-type reads are micro-cached in ETS for 5s, and send `Cache-Control` headers for CDNs. The purchase path always reads Postgres. |
| **Live updates** | Payment status is pushed over Phoenix Channels through PubSub, so the M-Pesa callback can land on any node in a cluster. The web app falls back to polling. |
| **Auth at scale** | Short-lived HS256 JWTs are verified without a database lookup. Refresh tokens are opaque, stored hashed, and rotate on every use (replays are rejected). |
| **Abuse** | ETS rate limits on auth and checkout. Per-IP limits are generous because many Kenyan mobile users share carrier IPs (CGNAT). |
| **Forged tickets** | QR payloads are HMAC-signed (`K1.<ticket id>.<sig>`). Check-in is an atomic conditional update, so a ticket scanned at two gates at once is admitted only once. |
| **Search** | Postgres full-text search on a generated `tsvector` column with a GIN index, using prefix matching. No extra search service needed. |
| **Horizontal scaling** | Stateless nodes. `DNS_CLUSTER_QUERY` joins nodes into an Erlang cluster, and Oban coordinates jobs through Postgres. |

### API contract

The API keeps the `/api/v1` paths and JSON field names of the previous backend, so `apps/legacy-web` can be pointed at it during the transition. Conventions:

* Single resources come back as plain objects; lists come back as `{success, data, total, page, page_size, total_pages}`; actions come back as `{success, message, data}`.
* Errors look like `{ "detail": "Human readable message", "errors": { field: [...] } }`.
* Money is sent as a decimal string (`"1500.00"`), and times as ISO 8601 UTC.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register` `/auth/login` `/auth/firebase-login` `/auth/refresh` `/auth/logout`, `GET /auth/me` |
| Users | `GET/PATCH /users/me`, `PATCH /users/me/preferences` |
| Events | `GET /events` (filters: `q`, `category`, `location`, `start_date`, `end_date`, `min_price`, `max_price`, `sort_by`, `page`, `page_size`), `GET /events/slug/:slug`, `GET /events/:id`, `GET /events/my-events`, `POST /events`, `PATCH/DELETE /events/:id`, `POST /events/:id/publish\|unpublish\|cancel` |
| Ticket types | `GET/POST /tickets/events/:event_id/ticket-types`, `PATCH/DELETE /tickets/ticket-types/:id` |
| Checkout | `POST /tickets/purchase-cart`, `POST /tickets/purchase`, `POST /tickets/cancel/:transaction_id` |
| Payments | `POST /payments/initiate-mpesa`, `GET /payments/transaction/:id[?force_check=true]`, `GET /payments/query-status/:id`, `POST /payments/mpesa/callback/:token` |
| Tickets | `GET /tickets/my-tickets`, `GET /tickets/:id`, `POST /tickets/validate-qr`, `POST /tickets/checkin`, `GET /tickets/events/:event_id/checkin-stats` |
| Promoters | `GET /promoters/codes/validate?code=&event_id=` |
| Organizers | `POST /organizers/apply`, `GET/PATCH /organizers/me` |
| Staff | `GET /staff/my-staff-assignments`, `GET/POST /staff/events/:event_id/staff`, `PATCH/DELETE /staff/events/:event_id/staff/:id` |
| Admin | `GET /admin/organizers[/pending]`, `POST /admin/organizers/:id/approve\|reject\|suspend` |
| Realtime | WebSocket `/socket`, topic `order:<transaction id>`, event `payment_status` |

## Configuration (API, production)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `POOL_SIZE` | Postgres connection |
| `SECRET_KEY_BASE`, `JWT_SIGNING_SECRET`, `QR_SIGNING_SECRET` | Secrets (generate with `mix phx.gen.secret`) |
| `PHX_HOST`, `PORT`, `CORS_ORIGINS` | Hosting and allowed web origins (comma separated) |
| `MPESA_ENV` (`sandbox`/`production`), `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_TRANSACTION_TYPE` | Daraja credentials |
| `MPESA_CALLBACK_URL`, `MPESA_CALLBACK_TOKEN` | Callback URL must end in `/api/v1/payments/mpesa/callback/<MPESA_CALLBACK_TOKEN>` |
| `FIREBASE_PROJECT_ID` | Enables Google sign-in through Firebase ID tokens |
| `DNS_CLUSTER_QUERY` | Optional: DNS name that resolves to all API nodes, for clustering |
| `ALLOW_SANDBOX_PAYMENTS=true` | Run without Daraja credentials, using the fake M-Pesa (demo and staging only) |

Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and optionally `API_INTERNAL_URL` for server-side fetches over a private network.

## Roadmap

Phase 1 (this) covers the core ticketing path: accounts, organizer onboarding, events and ticket types, checkout with oversell-safe inventory, M-Pesa STK push with callbacks and reconciliation, QR tickets and door scanning, plus organizer approval for admins.

Still to come, currently only in `apps/legacy-web` against the old backend:

- Promoter programme: applications, code creation, commissions, leaderboard, payouts
- Loyalty credits
- Organizer and admin analytics dashboards, and audit logs
- Image uploads (S3-compatible storage), transactional email and SMS (ticket delivery, password reset)
- Per-organizer M-Pesa credentials and settlement
- Recommendations

After that, `apps/legacy-web` can be deleted.
