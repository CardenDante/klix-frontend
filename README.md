# Klix

Event discovery and ticketing for Kenya, with M-Pesa payments and QR check-in.

```
apps/
  api/   Elixir / Phoenix JSON API
  web/   Next.js 16 web app
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

Seeded accounts (password `password123`): `admin@klix.test`, `organizer@klix.test`, `staff@klix.test`, `promoter@klix.test`, `fan@klix.test` (has 500 loyalty credits).
The seeded concert has promo codes `KLIX10` and `PAT-SAUTI` (a promoter's code; try `/events/<slug>?ref=PAT-SAUTI`). In dev, M-Pesa numbers `0700000001` and `0700000002` simulate a failed and a cancelled payment.

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

The API keeps the `/api/v1` paths and JSON field names of the previous backend. Conventions:

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
| Promoters | `POST /promoters/apply`, `GET/PATCH /promoters/me`, `POST /promoters/codes`, `GET /promoters/my-codes`, `GET /promoters/code/:id/analytics`, `POST /promoters/code/:id/deactivate`, `POST /promoters/track-click`, `GET /promoters/earnings`, `POST /promoters/withdraw`, `GET /promoters/withdrawals`, `GET /promoters/leaderboard`, `GET /analytics/promoter/dashboard` |
| Promoter requests | `POST /promoter-requests/events/request`, `GET /promoter-requests/my-requests`, `GET /promoter-requests/approved-events`; organizers: `GET /promoter-requests/organizers/promoter-requests`, `POST …/:id/approve\|reject\|revoke`, `PATCH …/:id`, `GET /promoter-requests/organizers/events/:event_id/approved-promoters` |
| Loyalty | `GET /loyalty/balance`, `/loyalty/transactions`, `/loyalty/credits/available`, `/loyalty/credits/expiring`, `/loyalty/summary`; checkout accepts `use_loyalty_credits` and `loyalty_credits_amount` |
| Accounts | `POST /auth/password-reset`, `/auth/password-reset/confirm`, `/auth/verify-email`, `/auth/verify-email/request`, `/auth/change-password` |
| Uploads | `POST /uploads/upload` (multipart `file`, `upload_type`), `GET /uploads/my-uploads`, `GET/DELETE /uploads/files/:id` |
| Analytics | `GET /analytics/organizer/dashboard`, `GET /analytics/organizer/events/:event_id/stats` |
| Organizer money | `GET/PUT/DELETE /organizers/me/mpesa`, `POST /organizers/me/mpesa/verify`, `GET /organizers/me/settlements` |
| Discovery | `GET /recommendations/trending\|popular\|for-you\|discovery`, `GET /recommendations/similar/:event_id`, `GET/PUT /recommendations/preferences`, `GET /search/suggestions\|facets\|nearby\|popular` |
| Admin | organizers, promoters (`/admin/organizers…`, `/admin/promoters…` approve/reject/suspend), `GET /admin/statistics`, users (`GET /admin/users`, `GET /admin/users/:id`, `PATCH …/role`, `POST …/suspend\|unsuspend\|loyalty`, `DELETE …`), events (`GET /admin/events`, `POST …/flag\|unflag`, `DELETE …/force-delete`), payouts (`GET /admin/withdrawals`, `POST …/:id/pay\|reject`, `GET /admin/settlements[/pending]`, `POST /admin/settlements/:event_id`), `GET /admin/audit-logs` |
| Realtime | WebSocket `/socket`, topic `order:<transaction id>`, event `payment_status` |

## Configuration (API, production)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `POOL_SIZE` | Postgres connection |
| `SECRET_KEY_BASE`, `JWT_SIGNING_SECRET`, `QR_SIGNING_SECRET` | Secrets (generate with `mix phx.gen.secret`) |
| `ENCRYPTION_KEY` | 32 bytes, base64 (`openssl rand -base64 32`); encrypts organizers' M-Pesa credentials at rest |
| `WEB_URL`, `MAIL_FROM` | Links and sender used in emails |
| `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `ZEPTOMAIL_FROM_NAME` | Sends email through ZeptoMail; `ZEPTOMAIL_API_URL` overrides the endpoint for EU/IN accounts |
| `RESEND_API_KEY` | Sends email through Resend if ZeptoMail isn't set (otherwise emails are only logged) |
| `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME`, `SMS_SENDER_ID` | Sends SMS through Africa's Talking (otherwise SMS are only logged) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | Image uploads to S3-compatible storage (AWS S3, Cloudflare R2, Spaces); otherwise stored on local disk |
| `PHX_HOST`, `PORT`, `CORS_ORIGINS` | Hosting and allowed web origins (comma separated) |
| `MPESA_ENV` (`sandbox`/`production`), `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_TRANSACTION_TYPE` | Daraja credentials |
| `MPESA_CALLBACK_URL`, `MPESA_CALLBACK_TOKEN` | Callback URL must end in `/api/v1/payments/mpesa/callback/<MPESA_CALLBACK_TOKEN>` |
| `FIREBASE_PROJECT_ID` | Enables Google sign-in through Firebase ID tokens |
| `DNS_CLUSTER_QUERY` | Optional: DNS name that resolves to all API nodes, for clustering |
| `ALLOW_SANDBOX_PAYMENTS=true` | Run without Daraja credentials, using the fake M-Pesa (demo and staging only) |

Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, optionally `API_INTERNAL_URL` for server-side fetches over a private network, and `NEXT_PUBLIC_FIREBASE_*` to show Google sign-in.

## Deploying (e-klix.com)

The production server runs other apps too, so Klix binds only to `127.0.0.1:3400` (web) and `127.0.0.1:4400` (API) and nginx serves both on `e-klix.com` (`/api`, `/socket`, `/uploads` go to the API). Config lives in `.env.production` (not committed).

```bash
git pull
docker compose -p klix -f docker-compose.prod.yml --env-file .env.production up -d --build
```

The nginx site is `deploy/nginx/e-klix.com` (installed in `/etc/nginx/sites-available/`, TLS added by `certbot --nginx -d e-klix.com`).
To make someone an admin after they sign up:

```bash
docker exec klix_api bin/klix rpc 'Klix.Repo.get_by!(Klix.Accounts.User, email: "you@example.com") |> Klix.Accounts.set_role("admin") |> IO.inspect()'
```

## What's built

- **Buying:** discovery with search, suggestions, trending, "similar" and personal picks; guest or signed-in checkout; M-Pesa STK push with live status; QR tickets by email and SMS.
- **Organizers:** events and ticket types with image uploads, publishing, staff and door scanning, live analytics per event and overall, promoter approvals with custom terms, their own M-Pesa paybill or till, and per-event payout statements.
- **Promoters:** application, event requests, codes and share links (`?ref=CODE` auto-applies), click and conversion tracking, commissions released after each event, M-Pesa withdrawals, leaderboard.
- **Loyalty:** 1 credit per KES 100 spent, redeemable for up to 50% of an order, expiring after a year.
- **Admin:** overview dashboard, organizer and promoter reviews, user management, event moderation (flagged events disappear from public pages), promoter payouts, organizer settlements, and an audit log of every admin action.
- **Accounts:** email and password or Google, password reset, email verification.

Business settings live in `apps/api/config/config.exs`: the platform fee (`2.5%`), the checkout hold time (10 minutes) and the loyalty earn, expiry and redemption limits.
