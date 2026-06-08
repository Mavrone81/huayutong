# MandaMix — Web App (full-stack)

**Next.js (App Router) · TypeScript · Tailwind**, with a real backend: **PostgreSQL**,
JWT auth, and card billing in **USD** — with a built-in **mock PSP** so it runs end-to-end
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

MandaMix **owns the subscription lifecycle** rather than delegating trials to the PSP. A runner
endpoint charges trials at their end, renews active subs, and retries past-due ones — in
production this is a cron calling it every ~15 min:

```bash
# charge everything due now
curl -X POST localhost:3000/api/v1/internal/run-billing \
  -H "x-internal-secret: dev-internal-secret"
# force one subscription immediately (testing):  add  -d '{"subscriptionId":"<uuid>"}'
```

### Going live with real Stripe

Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env.local`.
The provider auto-switches from mock → real Stripe. Point a Stripe webhook at
`/api/v1/webhooks/stripe`. The browser confirms a SetupIntent with Stripe.js (publishable key +
client secret), which vaults the card and posts the resulting `payment_method` id to
`/billing/trials`.

## API (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register · /auth/login · /auth/logout · /auth/refresh`, `GET /me` |
| Billing | `GET /billing/plans · /billing/subscription`, `POST /billing/setup-intent · /billing/trials · /billing/subscription/cancel` |
| Learning | `GET /courses · /me/progress · /lessons/{id} · /srs/queue`, `POST /lessons/{id}/complete · /srs/reviews`, `PUT /me/daily-goal` |
| HSK prep | `GET /me/readiness · /study-plans/active · /mock-exams · /attempts/{id}`, `POST /study-plans · /mock-exams/{id}/attempts · /attempts/{id}/submit`, `PATCH /study-plan-tasks/{id}` |
| Admin | `POST /admin/login·logout`, `GET /admin/me·overview·customers·customers/{id}·content·audit`, `POST /admin/refunds·trials/extend·users·customers/{id}/password-reset`, `PUT /admin/customers/{id}/price` |
| System | `POST /webhooks/stripe`, `POST /internal/run-billing` |

Auth = httpOnly **access (JWT, 15m)** + **refresh (opaque, 30d, hashed in `sessions`)** cookies.
Entitlement (`free`/`premium`) is computed **server-side** from `subscriptions.status` on every
request — never trusted from the client.

## Structure

```
src/
  app/                   # screen routes + app/api/v1/* route handlers
  components/            # PreviewBar, AppShell, Logo
  server/                # db, auth (scrypt+JWT), psp (Stripe+mock), entitlement, billing
  lib/                   # dict (4-lang i18n), i18n, api client, types, HSK levels
../db/schema.sql         # PostgreSQL schema   ../db/seed.sql  # plans/prices (USD)
docker-compose.yml       # local Postgres
```

## Verified flows

register → me(free) → start trial → me(premium/trialing) → run-billing → active(charged $5.99) →
cancel(keeps access) → run-billing → expired → me(free); plus failed-card → past_due, and
auth/secret guards (401/403/409).

## Learning (real, Postgres-backed)

HSK 1 content is seeded (`db/seed_content.sql`: 5 skills, 5 lessons, 23 items, 4-language glosses).
On register a user is auto-enrolled in HSK 1. The **dashboard** (`/me/progress`), **lesson**
(MCQ generated from item glosses in the user's language → `/lessons/{id}/complete`), and **SRS**
(`/srs/queue` + `/srs/reviews`, SM-2-style scheduling) are all live. Completing a lesson awards
XP, advances the streak, seeds SRS cards, and updates HSK-readiness. Premium lessons are gated by
entitlement (free users get a 402 → paywall). **Pricing on the landing & onboarding pages pulls
from `/billing/plans`** (USD).

## Admin console (real, RBAC + audited)

`/admin` has its own sign-in (`admin_users`, scrypt password) and a separate admin JWT cookie.
Dev logins (password `admin12345`): **admin@mandamix.com** (super), **finance@mandamix.com**
(refunds/price overrides), **ops@mandamix.com** (trials/users). Tabs read live data: **Overview**
(MRR, active/trial counts, trial→paid, payment-success, refunds, signups-by-market, subscription
states), **Customers & Billing** (search, detail, and actions), **Content & Localization** (gloss
coverage + publish-gate blocked items), **Audit log**. Actions — extend trial, issue refund,
price override, create user, password reset — are **RBAC-gated** (wrong role → 403) and every
mutation writes to `audit_logs`.

## HSK prep (real, Postgres-backed)

`/hsk` lets a learner set a target HSK level + exam date → a **study plan** with dated tasks
(toggle complete) is generated. **Readiness** (`/me/readiness`) is computed from mock-exam scores
and vocabulary mastery (estimated level, words mastered/needed, section breakdown, history chart).
**Mock exams** (`db/seed_hskprep.sql`) generate timed MCQ questions from real items; the `/exam`
screen runs the attempt and **submits for server-side grading** (`/attempts/{id}/submit`), which
records the score, per-section breakdown, and a readiness snapshot for the history chart.

## Still mock

A couple of dashboard widgets (weekly-activity chart, leaderboard) are cosmetic. Learning/exam
exercises are multiple-choice generated from the item glosses (the prototype's tone/sentence/match
and listening-audio drills are a future enhancement).
