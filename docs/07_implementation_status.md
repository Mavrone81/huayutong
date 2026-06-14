# MandaMix — Implementation Status

> What is actually built in `web/` (Next.js app + `pg`/PostgreSQL), mapped to the
> [PRD](../design/MandaMix_PRD.pdf). Companion to the PRD-vs-code review. Updated as
> of the trial/billing-compliance and quality batches.

## Legend
✅ implemented · 🟡 partial / scaffolded · ⬜ not built (product/legal/ops, not code)

## Core learning
| PRD area | Status | Notes |
|---|---|---|
| Localized UI (EN/TH/VI/MS) | ✅ | i18n catalog; glosses fall back to EN when a target gloss is missing |
| Structured course path (HSK 1) | ✅ | Skill tree, lessons, items; HSK 2–6 content pending authoring |
| SRS review queue | ✅ | SM-2 scheduling (`server/learning.ts`), covered by integration test |
| XP / streaks / daily goal | ✅ | `xp_ledger`, `streaks`, `daily_goals` |
| Free-tier daily lesson cap | ✅ | `FREE_DAILY_LESSON_LIMIT` (default 3); premium unlimited |
| Speech / pronunciation (P1) | ⬜ | Vendor TBD |

## HSK prep (premium-gated)
| PRD area | Status | Notes |
|---|---|---|
| Mock exams | ✅ | Server-authoritative grading; gated by `requirePremium` |
| Readiness score | ✅ | From recent mock scores + vocabulary mastery |
| Study plans | ✅ | Exam-date-driven tasks |

## Accounts, trial & billing
| PRD area | Status | Notes |
|---|---|---|
| Email/password auth | ✅ | JWT access + rotating refresh, scrypt hashing |
| Social login (Google/Apple) | ✅ | `POST /auth/oauth/{google,apple}`; real verify when configured, dev fallback otherwise |
| Email/phone verification | ✅ | `POST /auth/verify`; trial gated behind `REQUIRE_VERIFICATION` (default off) |
| 1-month card trial | ✅ | `POST /billing/trials`; reminders scheduled T-3d/T-24h |
| Trial anti-abuse | ✅ | One trial per learner **and** per card fingerprint |
| Entitlement (server-side) | ✅ | Time-bounded; `past_due` grace then downgrade |
| Recurring billing + conversion | ✅ | Cron `POST /internal/run-billing` |
| Dunning | ✅ | Retry schedule (1/3/7d), max attempts, grace, downgrade |
| Tax (VAT/GST) | ✅ | Destination-based, **tax-inclusive**; SG 9% home, TH 7% / MY 8% / VN 10% |
| Receipts / invoices | ✅ | Invoice rows + `GET /billing/invoices`; receipt notifications scheduled |
| Plan change / card update | ✅ | `POST /billing/subscription/change`, `PUT /billing/payment-method` |
| Webhooks drive state | ✅ | `invoice.*`, `customer.subscription.*`, `charge.refunded` |
| Local payment methods (P1) | ⬜ | PromptPay/e-wallets — fast-follow |

## Admin & compliance
| PRD area | Status | Notes |
|---|---|---|
| RBAC admin console | ✅ | ops/finance/content roles |
| Per-customer price override | ✅ | `<50%` of list requires `finance_admin` (`PRICE_OVERRIDE_FLOOR_PCT`) |
| Refunds (incl. partial) | ✅ | Tracks remaining; marks payment refunded only when fully refunded |
| Trial extend / user create / password reset | ✅ | Audited |
| Audit log immutable | ✅ | `audit_logs` BEFORE UPDATE/DELETE trigger (append-only) |
| Content CMS publish gate | ✅ | Coverage report blocks items missing any of the 4 glosses |

## Notifications
| PRD area | Status | Notes |
|---|---|---|
| Schedule reminders/receipts/dunning | ✅ | `server/notifications.ts` writes `notifications` rows |
| Delivery dispatcher | 🟡 | `POST /internal/run-notifications` marks due rows sent; provider hand-off (email/push) is the remaining integration |

## Feature flags (env)
`REQUIRE_VERIFICATION`, `FREE_DAILY_LESSON_LIMIT`, `OAUTH_DEV_MODE`,
`DUNNING_RETRY_GAP_DAYS`, `DUNNING_MAX_ATTEMPTS`, `PAST_DUE_GRACE_DAYS`,
`DEFAULT_TAX_COUNTRY`, `PRICE_OVERRIDE_FLOOR_PCT`, `TRIAL_DAYS`. See
[`.env.example`](../.env.example).

## Database migrations
`db/schema.sql` is the full fresh-install schema. Existing databases must apply
the deltas in order (they do **not** auto-apply on deploy):

- `db/migrations/0002_trial_billing_compliance.sql` — `verification_tokens`, `payment_methods.fingerprint`
- `db/migrations/0003_audit_immutable_and_defaults.sql` — audit append-only trigger, `trial_days` default → 30

## Tests
- `cd web && npm test` — `node:test` harness (`tsx`).
- Unit suite (tax/billing/auth) always runs; integration suite (entitlement,
  dunning grace, HSK gating, SRS) runs when `DATABASE_URL` is set.
- CI runs both, booting `postgres:16` and loading schema + seeds + migrations.

## Remaining (product / legal / ops — not code)
PRD §11 open questions (language sequencing, free-tier vs hard paywall, PSP
selection) and the 🔴 workstreams in
[`05_launch_gaps_and_compliance.md`](05_launch_gaps_and_compliance.md): digital-services
tax registration, Vietnam PDPL/DPIA, HSK trademark counsel.
