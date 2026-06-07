# MandaMix — API Reference & Connection Guide

> REST, JSON, versioned under `/v1`. Auth via `Authorization: Bearer <access_token>`.
> Money in minor units + `currency`. All list endpoints support `?limit=&cursor=`.
> Errors use a consistent envelope (below). A machine-readable contract lives in
> [`openapi.yaml`](./openapi.yaml).

## Conventions

- **Base URL:** `https://api.mandamix.com/v1` (local: `http://localhost:8080/v1`)
- **Auth:** short-lived JWT **access token** (15 min) + **refresh token** (30 days, rotated).
- **Locale:** send `Accept-Language: th` (or `?lang=th`) — drives localized strings/receipts.
- **Idempotency:** mutating billing calls accept `Idempotency-Key: <uuid>`.
- **Error envelope:**
  ```json
  { "error": { "code": "card_declined", "message": "Your card was declined.", "request_id": "req_123" } }
  ```

## Auth & account

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create user (email/phone + password) |
| POST | `/auth/oauth/google` · `/auth/oauth/apple` | Social login (exchange provider token) |
| POST | `/auth/verify` | Confirm email/phone code → activates account |
| POST | `/auth/login` | Password login → access + refresh tokens |
| POST | `/auth/token/refresh` | Rotate refresh → new access token |
| POST | `/auth/logout` | Revoke current session |
| GET  | `/me` | Current user profile + entitlement summary |
| PATCH| `/me` | Update `ui_language`, `goal`, `timezone`, name |
| POST | `/me/devices` | Register device + push token |

**Register example**
```http
POST /v1/auth/register
Content-Type: application/json
Accept-Language: th

{ "email": "ploy@example.com", "password": "•••••••", "ui_language": "th", "goal": "conversation" }
```
```json
201 { "user": { "id": "u_…", "status": "pending" }, "verification": "sent" }
```

## Billing & subscriptions

> The card is tokenized **client-side** with the PSP SDK (Stripe Elements / PaymentSheet);
> the raw PAN never reaches MandaMix servers. The client sends only a payment-method token.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/billing/plans` | List plans + localized prices in user's currency |
| POST | `/billing/setup-intent` | Get PSP client secret to collect/tokenize a card |
| POST | `/billing/trials` | Start the 1-month trial with a payment method |
| GET  | `/billing/subscription` | Current subscription + status + `trial_ends_at` |
| POST | `/billing/subscription/cancel` | Cancel (access until period/trial end) |
| POST | `/billing/subscription/change` | Upgrade/downgrade (PSP proration) |
| PUT  | `/billing/payment-method` | Replace default card (dunning recovery) |
| GET  | `/billing/invoices` | Billing history (downloadable receipts) |
| POST | `/webhooks/stripe` | **PSP → server** events (no app auth; signature-verified) |

**Start trial**
```http
POST /v1/billing/trials
Authorization: Bearer <token>
Idempotency-Key: 6f1c…

{ "plan_code": "premium_monthly", "payment_method": "pm_1ABC…" }
```
```json
201 {
  "subscription": {
    "id": "sub_…", "status": "trialing",
    "trial_ends_at": "2026-07-06T09:00:00Z",
    "plan_code": "premium_monthly", "currency": "USD", "amount_minor": 599
  }
}
```

**Entitlement check (every premium action):** `GET /me` returns
```json
{ "entitlement": { "tier": "premium", "source": "trialing", "valid_until": "2026-07-06T09:00:00Z" } }
```
The backend recomputes this from `subscriptions.status` server-side — clients must not cache it as authoritative.

## Learning, SRS & gamification

| Method | Path | Purpose |
|---|---|---|
| GET  | `/courses` · `/courses/{id}` | Course tree mapped to HSK 3.0 levels |
| GET  | `/lessons/{id}` | Lesson payload (items + localized glosses for `lang`) |
| POST | `/lessons/{id}/complete` | Submit answers → score, XP, progress |
| GET  | `/srs/queue` | Items due now (`srs_cards.due_at <= now`) |
| POST | `/srs/reviews` | Submit grade → reschedules card |
| GET  | `/me/progress` | XP, streak, per-level completion |
| GET  | `/me/streak` | Current/longest streak + today's goal |
| PUT  | `/me/daily-goal` | Set target minutes |

## HSK prep (Persona B)

| Method | Path | Purpose |
|---|---|---|
| POST | `/study-plans` | Create plan from `target_level` + `exam_date` |
| GET  | `/study-plans/active` | Active plan + today's tasks |
| GET  | `/mock-exams?level=4` | Available mock exams for a level |
| POST | `/mock-exams/{id}/attempts` | Start a timed attempt |
| POST | `/attempts/{id}/submit` | Submit → score |
| GET  | `/me/readiness` | Estimated level + % readiness |

## Notifications

| Method | Path | Purpose |
|---|---|---|
| GET  | `/me/notifications` | In-app notification feed |
| PUT  | `/me/notification-prefs` | Channels, reminder hour, marketing opt-in |

## Admin (separate audience, RBAC-gated)

| Method | Path | Purpose |
|---|---|---|
| GET  | `/admin/customers/{id}` | Subscription + payment status |
| POST | `/admin/users` | Create a user account (sends localized set-password invite; admins never set passwords) |
| POST | `/admin/users/{id}/password-reset` | Send a password-reset link (expires 1h; audited) |
| PUT  | `/admin/customers/{id}/price` | Per-customer price override (requires reason; applied via PSP from next invoice; audited) |
| POST | `/admin/refunds` | Issue refund (audited) |
| POST | `/admin/trials/extend` | Comp/extend a trial |
| GET  | `/admin/content/items?missing_gloss=th` | Localization gaps (publish gate) |

---

## Connecting Stripe (the core "API connection")

1. **Keys** — set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
   and the `STRIPE_PRICE_*` IDs in `.env`.
2. **Collect card (client):** call `POST /billing/setup-intent` → return the PSP `client_secret`
   → client confirms with Stripe Elements/PaymentSheet → receives `pm_…` token.
3. **Start subscription with trial (server):**
   ```ts
   const sub = await stripe.subscriptions.create({
     customer: customer.psp_customer_id,
     items: [{ price: process.env.STRIPE_PRICE_MONTHLY }],
     trial_period_days: Number(process.env.TRIAL_DAYS), // 30
     default_payment_method: paymentMethodToken,
     payment_settings: { save_default_payment_method: 'on_subscription' },
   });
   ```
4. **Webhook endpoint** `POST /v1/webhooks/stripe` — verify signature, dedupe via
   `webhook_events.provider_event_id`, then map events to state:

   | Stripe event | Action |
   |---|---|
   | `customer.subscription.trial_will_end` | send trial-end (-24h) reminder |
   | `invoice.payment_succeeded` | `status=active`, write invoice/payment, email receipt |
   | `invoice.payment_failed` | `status=past_due`, start dunning |
   | `customer.subscription.updated` | sync status/period |
   | `customer.subscription.deleted` | `status=canceled` → downgrade entitlement |
   | `charge.refunded` | record refund |

   ```ts
   const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
   // upsert webhook_events (idempotent), then dispatch by event.type
   ```
5. **Local testing:** `stripe listen --forward-to localhost:8080/v1/webhooks/stripe`
   and `stripe trigger invoice.payment_failed`.

> **App-store note:** iOS/Android in-app purchases must use Apple/Google billing per store
> rules; map their server notifications to the same `subscriptions` table so entitlement is
> unified regardless of payment rail.
