# MandaMix — Web App (full-stack)

**Next.js (App Router) · TypeScript · Tailwind**, with a real backend: **PostgreSQL**,
JWT auth, and **PayMongo** billing (PHP) — with a built-in **mock PSP** so it runs end-to-end
locally with no payment keys. Built from `design/mandamix_webapp_design.html` and the docs.

## Run (full stack)

```bash
cp .env.local.example .env.local     # defaults work for local dev (mock PSP)
docker compose up -d                 # Postgres on :5432, auto-loads ../db/schema.sql + ../db/seed.sql
npm install
npm run dev                          # http://localhost:3000
```

Sign up at `/onboarding` → it registers, vaults a (mock) card, and starts a 30-day trial.
Then `/billing` shows the live subscription; cancel keeps access until the period ends.

### Charging the trial / running dunning

PayMongo (unlike Stripe) doesn't run trials server-side, so **MandaMix owns the subscription
lifecycle**. A runner endpoint charges trials at their end, renews active subs, and retries
past-due ones — in production this is a cron calling it every ~15 min:

```bash
# charge everything due now
curl -X POST localhost:3000/api/v1/internal/run-billing \
  -H "x-internal-secret: dev-internal-secret"
# force one subscription immediately (testing):  add  -d '{"subscriptionId":"<uuid>"}'
```

### Going live with real PayMongo

Set `PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY`, `PAYMONGO_WEBHOOK_SECRET` in `.env.local`.
The provider auto-switches from mock → real PayMongo. Point a PayMongo webhook at
`/api/v1/webhooks/paymongo`. The browser collects a card with the public key and posts the
`payment_method` id to `/billing/trials`.

## API (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register · /auth/login · /auth/logout · /auth/refresh`, `GET /me` |
| Billing | `GET /billing/plans · /billing/subscription`, `POST /billing/setup-intent · /billing/trials · /billing/subscription/cancel` |
| System | `POST /webhooks/paymongo`, `POST /internal/run-billing` |

Auth = httpOnly **access (JWT, 15m)** + **refresh (opaque, 30d, hashed in `sessions`)** cookies.
Entitlement (`free`/`premium`) is computed **server-side** from `subscriptions.status` on every
request — never trusted from the client.

## Structure

```
src/
  app/                   # screen routes + app/api/v1/* route handlers
  components/            # PreviewBar, AppShell, Logo
  server/                # db, auth (scrypt+JWT), psp (PayMongo+mock), entitlement, billing
  lib/                   # dict (4-lang i18n), i18n, api client, types, HSK levels
../db/schema.sql         # PostgreSQL schema   ../db/seed.sql  # plans/prices (PHP)
docker-compose.yml       # local Postgres
```

## Verified flows

register → me(free) → start trial → me(premium/trialing) → run-billing → active(charged ₱299) →
cancel(keeps access) → run-billing → expired → me(free); plus failed-card → past_due, and
auth/secret guards (401/403/409).

## Still mock

Learning data (`api.getDashboard`) and the admin console are still mock — wire them to course /
progress tables next. Landing/onboarding price copy is static USD; the live plans API returns PHP.
