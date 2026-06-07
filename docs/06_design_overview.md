# MandaMix — One-Page Design Overview

> A single mental model of the whole web app, so the design can be understood without
> re-reading the PRD/BRD, schema, workflow diagrams, and HTML prototype. Pointers to the
> source docs are in the last section. Companion visual: **[`feature_priority_scatter.html`](feature_priority_scatter.html)**.

## 1. What it is, in one breath

MandaMix is a **hosted SaaS** that teaches **Mandarin natively in 4 SEA languages** (English,
ไทย, Tiếng Việt, Bahasa Melayu), aligned to **HSK 3.0 (nine levels)**. Learners sign up on the
web/mobile, get a **1-month free trial** (card required), and auto-convert to a **recurring
credit-card subscription** ($5.99/mo or $44.99/yr) unless they cancel. The moat is **native
localization + HSK 3.0 alignment from day one**.

## 2. The four product pillars

| Pillar | What it delivers | Who it's for |
|---|---|---|
| **Learn** | Localized course path (HSK 1–3 → 4–6), lessons (vocab/listening/reading/tone/characters), native audio, **SRS** review | Persona A "Ploy" (self-learner) |
| **HSK Prep** | Level mapping, **mock exams**, **readiness score**, exam-date **study plans** | Persona B "Minh" (HSK candidate) |
| **Engage** | Streaks, XP, daily goals, push reminders, leaderboards, offline | Both |
| **Monetize** | 1-month trial → Stripe recurring billing, dunning, admin/ops | The business |

## 3. Screen map (web prototype)

15 learner screens + an admin console. Source: `design/mandamix_webapp_design.html`.

| Screen | Purpose | Key data / API |
|---|---|---|
| Landing | Marketing, pricing, "Start 1-month free trial" | `/billing/plans` |
| Onboarding (6 steps) | Language → goal → placement → daily goal → account (PDPA consent + DOB) → trial+card | `/auth/register`, `/billing/setup-intent`, `/billing/trials` |
| Login | Email/phone + Google/Apple | `/auth/login`, `/auth/oauth/*` |
| Dashboard | Today's goal, SRS-due, skill progress, streak/XP, weekly activity, league | `/me`, `/srs/queue`, `/me/progress` |
| Courses | HSK level chips, skill/unit tree, lock states | `/courses`, `/courses/{id}` |
| Lesson (5 stages) | Multiple-choice, audio, tile sentence-building, pair-match, XP burst | `/lessons/{id}`, `/lessons/{id}/complete` |
| Writing | Stroke-order grid + character recognition | `/lessons/{id}` (character type) |
| Mock Exam | Timer, question-navigator grid, flagging | `/mock-exams`, `/attempts/{id}/submit` |
| HSK Prep | Readiness gauge (e.g. 61%), section scores, weak areas, study plan, mock list, history | `/me/readiness`, `/study-plans/active` |
| Billing | Trial banner, subscription card, payment method, billing history, cancel | `/billing/subscription`, `/billing/payment-method` |
| Settings | UI language, notification prefs, account | `PATCH /me`, `/me/notification-prefs` |
| Mobile preview | Phone-framed dashboard/lesson | — |
| **Admin console** | 4 tabs: **Overview** (KPIs, signups by market), **Customers & Billing** (refunds, trial extend, price override), **Content & Localization** (4-gloss coverage gaps), **Audit log** | `/admin/*` (RBAC + `audit_logs`) |
| Workflows / Design System | In-prototype architecture diagrams + component/color/type reference | — |

## 4. Architecture & stack (at a glance)

```
Clients (RN mobile · React web · CMS · Admin)
        │  HTTPS
   API Gateway (TLS, rate-limit, WAF)
        │
Backend services (REST /v1): Auth · Billing · Learning · SRS · HSK Prep ·
                              Entitlement · Notifications · Content · Analytics
        │
Data: PostgreSQL (truth) · Redis (cache/queues) · S3+CDN (audio/media)
External: Stripe (PSP) · Google/Apple OAuth · Email · FCM/APNs · Speech API (P1)
```
- **Entitlement is computed server-side** from `subscriptions.status` on every request — clients never decide access.
- **Stripe is the billing engine**; webhooks (idempotent via `webhook_events`) drive subscription state.
- **Cards are tokenized client-side** (Stripe Elements) → PCI scope stays SAQ-A; no PAN on our servers.

## 5. Data model at a glance (~40 tables, 7 groups)

Source: `docs/02_database.md` + `db/schema.sql`.

| Group | Anchor tables | Note |
|---|---|---|
| Identity & auth | `users`, `auth_identities`, `devices`, `sessions` | email/phone + OAuth |
| Billing | `customers`, `plans`, `prices`, `subscriptions`, `payment_methods`, `invoices`, `payments`, `refunds`, `webhook_events` | Stripe-mirrored; money in minor units |
| Content | `mandarin_items` + `item_glosses` (×4 langs), `courses`→`skills`→`lessons`→`lesson_items`, `hsk_levels` | **item = canonical entity; can't publish without all 4 glosses** |
| Learning & progress | `enrollments`, `lesson_progress`, `srs_cards`, `srs_reviews`, `xp_ledger`, `streaks`, `daily_goals` | SRS keyed `(user_id, due_at)` |
| HSK prep | `mock_exams`, `mock_exam_attempts`, `readiness_scores`, `study_plans`, `study_plan_tasks` | |
| Engagement | `notifications`, `notification_prefs` | localized templates |
| Ops & analytics | `admin_users`, `audit_logs`, `analytics_events` | every admin mutation audited |

## 6. The three core flows (one line each)

1. **Trial → paid:** register → verify → add card (tokenized) → `subscription=trialing` → reminders T-3d/T-24h → at month end auto-charge → `active` (or `past_due` → dunning).
2. **Daily learning:** open → load goal + SRS-due → entitlement check → lesson → grade → update SRS + XP + streak → reminder if goal unmet.
3. **HSK prep:** set target level + exam date → generate study plan → follow → mock exam → readiness score → reweight weak areas → repeat.

Full diagrams (8): `docs/01_architecture_and_workflows.md`.

## 7. Pricing & trial

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | First HSK 1 skills, limited daily review, all 4 languages |
| **Premium Monthly** | **$5.99/mo** | Full HSK 1–6, unlimited SRS, mock exams, offline |
| Premium Annual | $44.99/yr (**save 37%**) | Everything + exam-date study plans |

**Trial:** 1 month, card required, one per learner, cancel anytime (access to period end), pre-charge reminders. Tax-inclusive pricing recommended per market.

## 8. Compliance must-haves before charging (🔴)

Source: `docs/05_launch_gaps_and_compliance.md`.
- **Digital-services tax** registration TH (7%) / MY (8%) / VN (10%, deemed-supplier Jul 2026) — likely via Stripe Tax.
- **Vietnam PDPL** (in force Jan 2026): per-purpose, un-pre-ticked consent (already in onboarding), DPIA + CTIA filings; plus TH/MY PDPA.
- **HSK IP**: descriptive "HSK 3.0-aligned" only (not in app name); all mock questions original.
- Auto-renewal: cancel in same medium as signup; renewal terms disclosed at checkout.

## 9. Roadmap

| Phase | Scope | Target |
|---|---|---|
| 0 Foundations | Platform, CMS, localization framework, HSK 1 (EN+TH) | Q3 2026 |
| 1 MVP | HSK 1–3 in 4 langs, SRS, streaks, **trial + Stripe billing** | Q4 2026 |
| 2 HSK prep | HSK 4–6, mock exams, readiness, study plans, speech check (+ AI speaking partner decision) | H1 2027 |
| 3 Scale | HSK 7–9, offline, local payments, leaderboards, new languages | H2 2027 |

## 10. How to read the scatter plot

Open **`feature_priority_scatter.html`** in a browser. Each dot is a feature, positioned by
**build effort (x)** vs **user/business value (y)**, colored by area and sized by PRD priority.
The quadrants tell you sequencing at a glance:
- **Top-left = Quick wins** (high value, low effort) → do first.
- **Top-right = Big bets** (high value, high effort) → plan deliberately.
- **Bottom-left = Fill-ins** · **Bottom-right = Deprioritize**.

## 11. Where everything lives

| Topic | File |
|---|---|
| Product detail | `MandaMix_PRD.pdf` / `design/MandaMix_PRD_v0.2.docx` |
| Business case | `MandaMix_BRD.docx` |
| Workflows (8 Mermaid diagrams) | `docs/01_architecture_and_workflows.md` |
| Database | `docs/02_database.md`, `db/schema.sql` |
| API + Stripe connection | `docs/03_api.md`, `docs/openapi.yaml` |
| Env config | `.env.example` |
| Build-docs checklist | `docs/04_documents_checklist.md` |
| Launch gaps & compliance | `docs/05_launch_gaps_and_compliance.md` |
| Web design prototype | `design/mandamix_webapp_design.html` |
| **This overview + scatter** | `docs/06_design_overview.md`, `docs/feature_priority_scatter.html` |
