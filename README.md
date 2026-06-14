# MandaMix

A self-paced Mandarin learning app for Southeast Asian learners (EN / ไทย / Tiếng Việt /
Bahasa Melayu), aligned to HSK 3.0, delivered as a hosted SaaS with a 1-month card-required
free trial ($5.99/mo or $44.99/yr after) and recurring credit-card billing.

## Documents

| Doc | Path |
|---|---|
| Product Requirements (PRD) | [`MandaMix_PRD.pdf`](MandaMix_PRD.pdf) · [`.docx`](MandaMix_PRD.docx) |
| Architecture & workflow diagrams | [`docs/01_architecture_and_workflows.md`](docs/01_architecture_and_workflows.md) |
| Database design | [`docs/02_database.md`](docs/02_database.md) · DDL: [`db/schema.sql`](db/schema.sql) |
| API reference & connection guide | [`docs/03_api.md`](docs/03_api.md) · contract: [`docs/openapi.yaml`](docs/openapi.yaml) |
| Environment config | [`.env.example`](.env.example) |
| Build-documents checklist (incl. BRD advice) | [`docs/04_documents_checklist.md`](docs/04_documents_checklist.md) |
| Launch gaps & compliance workstreams | [`docs/05_launch_gaps_and_compliance.md`](docs/05_launch_gaps_and_compliance.md) |
| Implementation status (PRD → code) | [`docs/07_implementation_status.md`](docs/07_implementation_status.md) |
| Web app design prototype (15 screens) | [`design/mandamix_webapp_design.html`](design/mandamix_webapp_design.html) |

## Regenerating the PRD

The PRD is generated from `build_prd.js` (uses the `docx` package):

```bash
npm install
node build_prd.js          # writes MandaMix_PRD.docx
# Then convert to PDF (macOS, via Microsoft Word export).
```

## Quick start (intended backend)

```bash
cp .env.example .env        # fill in secrets
createdb mandamix
psql mandamix < db/schema.sql
for m in db/migrations/*.sql; do psql mandamix -f "$m"; done   # apply deltas (idempotent)
psql mandamix < db/seed.sql # plans, prices, admin
```

## Web app & tests

```bash
cd web
npm ci
npm run dev                 # http://localhost:3000
npm test                    # unit suite; integration suite runs when DATABASE_URL is set
```
