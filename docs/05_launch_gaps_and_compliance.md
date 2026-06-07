# MandaMix — Launch Gaps & Compliance Workstreams

> Gap analysis dated 6 June 2026, based on external research. Companion to
> [`04_documents_checklist.md`](04_documents_checklist.md) (which tracks internal
> documents); this file tracks **external/regulatory/strategic** gaps.
> Priority: 🔴 must close before charging customers · 🟠 must close before public
> launch · 🟡 monitor / fast-follow.

## Summary table

| # | Gap | Priority | Owner | Target |
|---|-----|----------|-------|--------|
| 1 | Digital-services tax registration (TH/MY/VN) | 🔴 | Finance + Legal | Before first charge |
| 2 | Vietnam PDPL compliance (consent + DPIA) | 🔴 | Legal + Eng | Before VN launch |
| 3 | HSK trademark & content IP review | 🔴 | Legal | Before marketing uses "HSK" |
| 4 | Cancellation / auto-renewal compliance | 🟠 | Product + Legal | At launch |
| 5 | AI tutoring competitive gap | 🟠 | Product | Phase 2 scope decision |
| 6 | App-store billing margin strategy | 🟠 | Product + Finance | Before mobile launch |
| 7 | Name trademark & domain check ("MandaMix") | 🟠 | Legal | Before brand spend |
| 8 | Minors' data & consent age policy | 🟠 | Legal | At launch |
| 9 | 4-language customer support plan | 🟡 | Ops | Launch + 30d |

---

## 1. Digital-services tax (🔴 Finance + Legal)

All three launch markets tax foreign digital subscriptions:

| Market | Regime | Threshold | Rate |
|---|---|---|---|
| Thailand | VAT on e-services (VES registration) | ฿1.8M revenue / year | 7% (reduced rate until at least Sep 2026) |
| Malaysia | Service tax on digital services (OVR registration) | RM500K / 12 months | 8% |
| Vietnam | VAT — deemed-supplier model from 1 Jul 2026 | n/a (platform remits) | 10% standard |

**Decisions needed**
- [ ] Tax-inclusive pricing ($5.99 includes VAT) vs. tax added at checkout — affects
  displayed price parity across markets. Recommendation: tax-inclusive for consumer trust.
- [ ] Use Stripe Tax to calculate/remit; confirm coverage for TH VES and MY OVR.
- [ ] Register before crossing thresholds; thresholds are revenue-based, so instrument
  per-market revenue reporting from day one (admin Overview already shows signups by market).

## 2. Vietnam PDPL — Law 91/2025/QH15, in force 1 Jan 2026 (🔴 Legal + Eng)

Applies to any foreign app processing Vietnamese residents' data. Fines up to 5% of revenue.

**Requirements → product impact**
- [ ] Consent must be voluntary, specific, informed, per-purpose. **No pre-ticked boxes,
  no implied consent.** → Onboarding registration step now shows two unticked checkboxes
  (account-data processing; marketing) — implemented in the design prototype.
- [ ] Written/electronically-authenticated consent for sensitive data (location, payments).
- [ ] **DPIA** (Data Processing Impact Assessment) filed within 60 days of starting
  processing; **CTIA** within 60 days of first cross-border transfer (our servers are
  outside VN → CTIA applies).
- [ ] Data classification: basic vs. sensitive; children's data is sensitive (see §8).
- [ ] Equivalent reviews for Thailand PDPA and Malaysia PDPA 2024 amendments (breach
  notification, DPO appointment thresholds).

## 3. HSK trademark & content IP (🔴 Legal)

"HSK" is operated by Chinese Testing International (CTI / formerly Hanban). An official
mock platform exists (hskmock.com). Third-party prep apps are widespread, but:

- [ ] Legal opinion on nominative use of "HSK" in app name/marketing ("HSK 3.0-aligned"
  descriptive use is likely fine; "HSK" in the app name is not — we don't do this).
- [ ] All mock-exam questions must be **original**, written in the official format —
  never reproduce real past papers (copyright).
- [ ] Evaluate a CTI partnership/licensing conversation (official-mock credibility vs. cost).
- [ ] Word lists: HSK 3.0 vocabulary/character syllabi are published standards; using the
  lists is standard industry practice, but confirm with counsel.

## 4. Cancellation / auto-renewal compliance (🟠 Product + Legal)

- US FTC "click-to-cancel" was vacated (Jul 2025) but rulemaking restarted Mar 2026;
  ~30 US states have their own auto-renewal laws — several stricter.
- Design already complies in spirit: one-click cancel in-app, explicit charge date at
  signup, T-3d + T-24h pre-charge reminders, access-until-period-end.
- [ ] Keep cancellation available **in the same medium as signup** in every market
  (web signup → web cancel; app signup → in-app cancel, not store-only).
- [ ] Localized ToS must disclose renewal terms above the fold at checkout.

## 5. AI tutoring competitive gap (🟠 Product)

2026 market expectation: AI conversation partners, instant pronunciation feedback,
adaptive error-targeting. Our PRD has speech scoring at P1 only.

- [ ] Decision: elevate an **AI Speaking Partner** to Phase 2 P0/P1, aligned with HSK 3+
  where the oral exam begins and willingness-to-pay is highest (added to PRD §11 open
  questions).
- [ ] Scope: pronunciation scoring (exists as P1) + scripted role-play dialogues first;
  free-form AI conversation later. Cost-model the speech/LLM vendor per active learner.

## 6. App-store billing margin (🟠 Product + Finance)

Apple/Google take 15–30% of in-app subscriptions: $5.99 nets ≈ $4.19–5.09.

- [ ] Strategy decision: web-first purchase flow (full margin) with mobile apps
  reading entitlement; mobile IAP optional at a higher price or same price/lower margin.
- [ ] Check current App Store/Play rules on steering users to web purchase (these have
  been changing through 2025–2026 litigation — re-verify at submission time).

## 7. Brand check (🟠 Legal)

- [ ] Trademark search for "MandaMix" in TH/VN/MY/SG + CN classes 9/41/42.
- [ ] Domain + social handle availability; defensive registrations.

## 8. Minors' data & consent age (🟠 Legal)

HSK candidates include school-age learners. Children's data is **sensitive** under
Vietnam PDPL; TH/MY have parental-consent requirements.

- [ ] Set a minimum age (e.g., 13+ with parental consent below 18 where required).
- [ ] Age gate at registration; no ads/marketing to minors; restrict leaderboard
  visibility for minor accounts.

## 9. Localized support (🟡 Ops)

- [ ] Support plan in EN/TH/VI/MS: help-center articles (localized), in-app contact,
  billing-dispute SLA (chargeback defense needs fast first response).
- [ ] Status page for the 99.9% uptime commitment.

---

## Sources

- Thailand e-Service VAT: pcflawfirm.com, avalara.com, quaderno.io
- Malaysia DST 2026 guide: vatabout.com
- Vietnam deemed-supplier VAT (Jul 2026): vatcalc.com
- Vietnam PDPL (Law 91/2025/QH15): dfdl.com, tilleke.com, iapp.org
- FTC click-to-cancel revival (2026): jonesday.com, kirkland.com, goodwinlaw.com
- AI language-app market 2026: practiceme.app, testprepinsight.com
- HSK official mock platform: hskmock.com; CTI/Hanban: chinesetest.cn
