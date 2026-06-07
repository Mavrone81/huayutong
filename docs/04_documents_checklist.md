# MandaMix — Recommended Documents for Building

Status legend: ✅ exists in this repo · 📝 recommended next · 🔵 needed before public launch

## What we already have

| Doc | File | Status |
|---|---|---|
| Product Requirements (PRD) | `MandaMix_PRD.pdf` / `.docx` | ✅ |
| Architecture & workflow diagrams | `docs/01_architecture_and_workflows.md` | ✅ |
| Database design + DDL | `docs/02_database.md`, `db/schema.sql` | ✅ |
| API reference + connection guide | `docs/03_api.md`, `docs/openapi.yaml` | ✅ |
| Environment configuration | `.env.example` | ✅ |
| Business Requirements (BRD) | `MandaMix_BRD.docx` | ✅ |
| Web app design prototype | `design/mandamix_webapp_design.html` | ✅ |
| Launch gaps & compliance workstreams | `docs/05_launch_gaps_and_compliance.md` | ✅ |

## Recommended additional documents

### 1. Business & scoping
| Doc | Why you need it | Priority |
|---|---|---|
| **BRD — Business Requirements Document** | The *why/what-for-the-business* layer above the PRD: business objectives, scope, stakeholders, market/revenue model, success criteria, assumptions, ROI. Stops scope creep and aligns non-engineering stakeholders. **See note below.** | 📝 |
| Pricing & monetization model | Concrete price points per market (THB/VND/MYR), trial economics, LTV/CAC, conversion assumptions. Referenced by PRD §5.4 as TBD. | 📝 |
| Go-to-market / launch plan | Sequencing of languages & markets, marketing, app-store launch. | 🔵 |

### 2. Technical
| Doc | Why | Priority |
|---|---|---|
| **TDD — Technical Design Doc** | The detailed architecture the PRD explicitly defers: service boundaries, data flow, SRS algorithm choice, scaling, vendor selection. | 📝 |
| ADRs (Architecture Decision Records) | One short file per irreversible decision (RN vs Flutter, Stripe vs Adyen, SM-2 vs FSRS). | 📝 |
| Infra / DevOps runbook (IaC, CI/CD) | Terraform, environments, deploy/rollback, secrets management. | 📝 |
| Observability & SLO doc | Metrics, logging, alerting, the 99.9% uptime target's error budget. | 🔵 |
| Disaster recovery / backup plan | RPO/RTO, DB backups, PSP reconciliation. | 🔵 |

### 3. Content & localization (the core differentiator)
| Doc | Why | Priority |
|---|---|---|
| Localization & translation style guide | Tone, terminology, glossary per language; enforces native-quality (not MT) translations. | 📝 |
| CMS / authoring spec | Workflow for authoring items, the 4-gloss publish gate, review/QA states. | 📝 |
| Content production plan | Who authors HSK 1–9, timeline, cost model (PRD names content cost as top risk). | 🔵 |

### 4. Billing, security & compliance
| Doc | Why | Priority |
|---|---|---|
| Security & threat model | Auth, RBAC, data encryption, trial-fraud controls, OWASP review. | 🔵 |
| PCI DSS scope statement (SAQ-A) | Documents that PSP-hosted fields keep card data off our servers. | 🔵 |
| Data protection / privacy impact (PDPA/PDPD) | Compliance for Thailand, Vietnam, Malaysia data laws. | 🔵 |
| Billing operations runbook | Dunning, refunds, chargebacks/disputes, reconciliation. | 🔵 |

### 5. Product, design & quality
| Doc | Why | Priority |
|---|---|---|
| UX flows & design system / wireframes | Screens behind PRD §6 flows; component library across 4 languages (text expansion, Thai line-height, etc.). | 📝 |
| Analytics / event tracking plan | Canonical event names + properties feeding PRD §9 metrics (e.g., `trial_started`, `trial_converted`). | 📝 |
| QA / test plan | Test strategy, billing edge cases, localization QA, device matrix. | 🔵 |
| Legal: ToS, Privacy Policy, Refund/Cancellation policy | Required for payments and app-store submission, localized. | 🔵 |
| App-store submission checklists (Apple/Google) | Store billing rules, metadata, review prep. | 🔵 |

---

## On the BRD — yes, recommended

A **BRD is worth having**, and it sits *above* the PRD rather than duplicating it:

- **BRD answers "why are we building this and what does the business need?"** — objectives,
  market opportunity, revenue model, stakeholders, scope boundaries, assumptions, constraints,
  high-level success criteria, budget/ROI.
- **PRD answers "what exactly are we building?"** — features, flows, requirements, acceptance
  criteria (what this repo's `MandaMix_PRD.pdf` already does well).

For MandaMix specifically the BRD is useful because there are real *business* decisions still
open (subscription vs. one-time packs, card-required trial, build-vs-license content, per-market
pricing) that aren't engineering questions. Capturing them in a BRD gives finance/leadership a
single source to sign off on before heavy build cost — directly mitigating the PRD's "content
cost" risk.

A lean BRD (5–8 pages) is enough: Executive summary · Business objectives & KPIs · Market/
opportunity · Scope (in/out) · Stakeholders & RACI · Revenue & cost model · Assumptions/
constraints · Risks · High-level timeline. I can draft it in the same styled format as the PRD
(reusing `build_prd.js`) on request.
