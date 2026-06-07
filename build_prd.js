const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TableOfContents, PageNumber, Header, Footer, PageBreak,
  TabStopType, TabStopPosition
} = require("docx");

const BLUE = "1F4E79";
const LIGHTBLUE = "D5E8F0";
const GREY = "F2F2F2";
const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };

// ---------- helpers ----------
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, ...opts })] });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: typeof text === "string" ? [new TextRun(text)] : text,
  });
}
function num(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 60 },
    children: typeof text === "string" ? [new TextRun(text)] : text,
  });
}
function labelBullet(label, rest) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: label + ": ", bold: true }), new TextRun(rest)],
  });
}

// generic table builder
function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: htext, bold: true, color: "FFFFFF" })] })],
      })
    ),
  });
  const bodyRows = rows.map((r, ri) =>
    new TableRow({
      children: r.map((cell, i) =>
        new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 ? GREY : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: cell.split("\n").map((line, idx) =>
            new Paragraph({ children: [new TextRun({ text: line, bold: idx === 0 && i === 0 ? false : false })] })),
        })
      ),
    })
  );
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows],
  });
}

const CONTENT_W = 9360;

// ---------- document body ----------
const children = [];

// Title block
children.push(
  new Paragraph({
    spacing: { before: 2400, after: 120 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MandaMix", bold: true, size: 64, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "Product Requirements Document (PRD)", size: 32, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "A self-paced Mandarin learning app for Southeast Asian learners", italics: true, size: 24, color: "595959" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
    children: [new TextRun({ text: "Taught in English  ·  ไทย  ·  Tiếng Việt  ·  Bahasa Melayu", size: 22, color: "595959" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Version 0.1 (Draft)   ·   June 2026   ·   Owner: Product", size: 20, color: "808080" })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(
  new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 28, color: BLUE })], spacing: { after: 160 } }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Overview
children.push(h1("1. Overview"));
children.push(p("MandaMix is a self-paced mobile and web application for learning Mandarin Chinese, built specifically for learners across Southeast Asia. Unlike global apps that teach Mandarin only through English, MandaMix delivers its entire learning experience — interface, instructions, explanations, and translations — natively in four languages: English, Thai, Vietnamese, and Bahasa Melayu."));
children.push(p("The product targets two overlapping audiences: adult self-learners who want practical, flexible Mandarin study, and HSK exam candidates who need structured preparation aligned to the official proficiency standard. With the new HSK 3.0 standard reaching full global implementation in July 2026, there is a timely opportunity to launch curriculum that is aligned to the new nine-level framework from day one."));

children.push(h2("1.1 Problem Statement"));
children.push(p("Most leading Mandarin apps (Duolingo, HelloChinese) teach exclusively through English. For the hundreds of millions of Thai, Vietnamese, and Malay/Indonesian speakers with limited English proficiency, learning a third language through a second language adds friction and abandonment. Meanwhile, HSK preparation tools are often desktop-bound, exam-dry, and not mobile-first. There is no polished, mobile-first, multilingual app that combines engaging self-paced learning with rigorous HSK 3.0 alignment for the SEA market."));

children.push(h2("1.2 Vision"));
children.push(p("Make Mandarin learnable in your own language. MandaMix becomes the default Mandarin learning companion for Southeast Asia by removing the English barrier and meeting learners where they are — on mobile, at their own pace, with a clear path from zero to HSK certification."));

children.push(h2("1.3 Goals & Non-Goals"));
children.push(h3("Goals"));
children.push(bullet("Deliver a fully localized learning experience in English, Thai, Vietnamese, and Bahasa Melayu."));
children.push(bullet("Provide a structured, self-paced curriculum aligned to HSK 3.0 (Levels 1–6 at launch, 7–9 later)."));
children.push(bullet("Reach high learner engagement and retention through gamification and spaced repetition."));
children.push(bullet("Offer credible HSK exam preparation: mock tests, progress tracking, and readiness scoring."));
children.push(h3("Non-Goals (for v1)"));
children.push(bullet("Live 1-on-1 tutoring, group classes, or any human-in-the-loop teaching (may come later)."));
children.push(bullet("Teaching languages other than Mandarin."));
children.push(bullet("A social network / community feed (lightweight leaderboards only)."));
children.push(bullet("Official HSK test registration or proctoring."));

// 2. Market & Competitive context
children.push(h1("2. Market & Competitive Context"));
children.push(p("Southeast Asia has strong and growing demand for Mandarin driven by trade, tourism, and education ties with China. The dominant global apps are not localized for the region's languages, leaving a clear positioning gap."));

children.push(h2("2.1 Competitive Landscape"));
children.push(makeTable(
  ["App", "Strengths", "Gap MandaMix exploits"],
  [
    ["Duolingo", "Huge brand, gamified, free tier", "English-only; shallow tone & character work; reaches ~HSK 3 only"],
    ["HelloChinese", "Purpose-built for Mandarin; strong tones & strokes", "English-only UI; coverage thins past HSK 4"],
    ["Pleco", "Best-in-class dictionary & flashcards", "A dictionary, not a structured course; English-only"],
    ["LingoAce / italki", "Live tutors, structured classes", "Tutor-led and higher cost; not self-paced; English-centric"],
  ],
  [1900, 3730, 3730]
));
children.push(p("Positioning: MandaMix is the only self-paced, mobile-first, HSK 3.0-aligned Mandarin course taught natively in Thai, Vietnamese, and Bahasa Melayu (plus English).", { italics: true }));

children.push(h2("2.2 The HSK 3.0 Opportunity"));
children.push(p("The reformed HSK 3.0 standard was published in November 2025 and reaches full implementation in July 2026. It restructures the exam into \"Three Stages, Nine Levels\" (三级九等):"));
children.push(makeTable(
  ["Stage", "Levels", "Cumulative vocabulary", "Notes"],
  [
    ["Elementary", "1–3", "300 / 500 / 1,000 words", "Recognition only; speaking from Level 3"],
    ["Intermediate", "4–6", "2,000 / 3,600 / 5,400 words", "Handwriting begins at Level 5"],
    ["Advanced", "7–9", "~11,000 words", "Single combined exam; translation added"],
  ],
  [2000, 1400, 3160, 2800]
));
children.push(p("Launching aligned to HSK 3.0 from day one is a differentiator versus incumbents still mapped to the older standard.", { italics: true }));

// 3. Target users
children.push(h1("3. Target Users & Personas"));
children.push(h2("3.1 Primary Personas"));
children.push(h3("Persona A — \"Ploy,\" the Adult Self-Learner (Bangkok, 28)"));
children.push(bullet("Works in tourism/e-commerce; wants conversational Mandarin for work and travel."));
children.push(bullet("Limited English; prefers learning through Thai. Studies 10–20 min/day on her phone."));
children.push(bullet("Motivated by visible progress and streaks; will pay a modest monthly fee if she sees results."));
children.push(h3("Persona B — \"Minh,\" the HSK Candidate (Ho Chi Minh City, 21)"));
children.push(bullet("University student planning to study or work in China; needs HSK 4–5 certification."));
children.push(bullet("Goal-driven and deadline-aware; wants mock exams, a study plan, and a readiness score."));
children.push(bullet("Will pay for premium if it credibly improves his exam outcome."));

children.push(h2("3.2 Markets & Languages at Launch"));
children.push(makeTable(
  ["Language", "Primary market(s)", "Priority"],
  [
    ["English", "Regional lingua franca; expats; Singapore/Philippines", "P0"],
    ["ไทย (Thai)", "Thailand", "P0"],
    ["Tiếng Việt (Vietnamese)", "Vietnam", "P0"],
    ["Bahasa Melayu", "Malaysia; adaptable to Bahasa Indonesia later", "P0"],
  ],
  [2600, 4760, 2000]
));

// 4. Product scope / features
children.push(h1("4. Product Scope & Features"));
children.push(p("Features are grouped into the MVP (v1 launch) and later phases. Priority labels: P0 = must-have for launch, P1 = fast-follow, P2 = later."));

children.push(h2("4.1 Core Learning Experience (MVP)"));
children.push(makeTable(
  ["Feature", "Description", "Priority"],
  [
    ["Localized UI (4 languages)", "Full interface, instructions, and explanations in EN/TH/VI/MS, switchable anytime", "P0"],
    ["Structured course path", "Skill tree mapped to HSK 3.0 Levels 1–3 at launch, 4–6 fast-follow", "P0"],
    ["Lesson types", "Vocabulary, listening, reading, tone drills, character recognition, sentence building", "P0"],
    ["Pinyin & tones", "Audio for every word; tone-pair drills; native-speaker recordings", "P0"],
    ["Character recognition", "Stroke-order animation and recognition exercises (handwriting input P1)", "P0"],
    ["Spaced repetition (SRS)", "Smart review queue that resurfaces weak items", "P0"],
    ["Speech / pronunciation check", "Speech recognition to score the learner's pronunciation", "P1"],
  ],
  [2500, 5160, 1700]
));

children.push(h2("4.2 HSK Exam Preparation"));
children.push(makeTable(
  ["Feature", "Description", "Priority"],
  [
    ["HSK level mapping", "Every lesson/word tagged to its HSK 3.0 level", "P0"],
    ["Mock exams", "Timed practice tests mirroring the official format per level", "P1"],
    ["Readiness score", "Estimated HSK level and % readiness based on performance", "P1"],
    ["Study plan", "Goal + exam-date-driven daily plan ('reach HSK 4 by December')", "P1"],
  ],
  [2400, 5260, 1700]
));

children.push(h2("4.3 Engagement & Retention"));
children.push(makeTable(
  ["Feature", "Description", "Priority"],
  [
    ["Streaks & daily goal", "Configurable daily target; streak tracking and reminders", "P0"],
    ["XP & levels", "Points for completed lessons; visible progress", "P0"],
    ["Leaderboards", "Lightweight weekly leagues (opt-in)", "P2"],
    ["Push notifications", "Localized reminders and SRS-due nudges", "P0"],
    ["Offline mode", "Download lessons for offline study (low-connectivity markets)", "P1"],
  ],
  [2400, 5260, 1700]
));

children.push(h2("4.4 Accounts, Payments & Admin"));
children.push(makeTable(
  ["Feature", "Description", "Priority"],
  [
    ["Hosted SaaS web app", "Cloud-hosted, multi-tenant web app; no install; shared backend with mobile (see Section 5)", "P0"],
    ["Auth & sync", "Email/phone + social login; progress synced across devices", "P0"],
    ["1-month free trial", "Card-required trial; full premium access; auto-converts to paid when the trial month ends unless canceled (Section 5)", "P0"],
    ["Credit-card & recurring billing", "PSP-tokenized cards; monthly/annual auto-renew; receipts; dunning on failed payments (Section 5)", "P0"],
    ["Freemium + subscription", "Free tier with limits; monthly/annual premium", "P0"],
    ["Local payment methods", "Support regional methods (e.g., PromptPay, e-wallets) + app stores", "P1"],
    ["Content CMS", "Internal tool to author/translate lessons and manage HSK tagging", "P0"],
    ["Admin console", "User management (create users, password resets), subscriptions, refunds, trial extensions, per-customer price overrides, content publish gate, audit log (Section 5.9)", "P1"],
    ["Analytics", "Learner funnel, retention, trial/billing, and lesson-quality instrumentation", "P0"],
  ],
  [2400, 5260, 1700]
));

children.push(h2("4.5 Curriculum Coverage & HSK 3.0 Skill Requirements"));
children.push(p("Each course level mirrors the official HSK 3.0 requirements. Skills are introduced exactly when the exam introduces them: listening and reading at every level, speaking (oral exam) from HSK 3, typed written expression from HSK 4, and handwriting from HSK 5. The app surfaces these requirements to learners on the course screen."));
children.push(makeTable(
  ["Level", "Vocabulary (cumulative)", "Characters", "Skills tested", "Product modules"],
  [
    ["HSK 1", "300", "≈300 recognition", "Listening, reading", "Core lessons; recognition drills"],
    ["HSK 2", "500", "≈600 recognition", "Listening, reading", "Core lessons; recognition drills"],
    ["HSK 3", "1,000", "≈900 recognition", "+ Speaking (oral exam begins)", "+ Speaking Studio (pronunciation scoring)"],
    ["HSK 4", "2,000", "≈1,200 recognition", "+ Writing (typed composition)", "+ Writing Workshop (sentence/passage tasks)"],
    ["HSK 5", "3,600", "≈1,500 rec + ≈150 handwritten", "+ Handwriting begins", "+ Handwriting Studio (stroke drills)"],
    ["HSK 6", "5,400", "≈1,800 rec + ≈300 handwritten", "All five skills", "+ Essay mastery; speed-reading lab; exam bootcamp"],
  ],
  [1200, 1900, 2300, 2080, 1880]
));
children.push(p("Question counts and exact character syllabi follow the post-July-2026 official HSK 3.0 specification; figures marked ≈ are directional pending the final published spec.", { italics: true }));

// 5. Platform model, trial & billing (SaaS)
children.push(h1("5. Platform Model, Trial & Billing"));
children.push(p("MandaMix is delivered as a hosted, multi-tenant Software-as-a-Service (SaaS) application. Learners register on the web, receive a 1-month free trial of full premium access, and are then automatically charged to their credit card on a recurring basis unless they cancel before the trial ends. This section specifies the hosting model, registration, trial mechanics, plans and pricing, the credit-card billing system, the subscription lifecycle, dunning, cancellation/refunds, and compliance."));

children.push(h2("5.1 Delivery & Hosting Model (SaaS)"));
children.push(labelBullet("Hosted service", "MandaMix runs as a cloud-hosted, always-on web application (e.g., app.mandamix.com) requiring no installation. Native iOS/Android apps share the same backend, accounts, and entitlements."));
children.push(labelBullet("Multi-tenant", "A single shared application instance serves all learners; each learner is an individual account. The architecture also supports future B2B/school tenants (multiple seats under one billing entity)."));
children.push(labelBullet("Centrally operated", "Content and features are shipped continuously from a single hosted codebase; there are no customer-managed installations or versions."));
children.push(labelBullet("Availability", "Target 99.9% monthly uptime for the learner-facing app, authentication, and billing services."));
children.push(labelBullet("Entitlement-gated", "Access to premium content is gated by subscription status (trialing / active / past_due / canceled / expired), evaluated server-side on every session — never trusted from the client."));

children.push(h2("5.2 Registration & Account Creation"));
children.push(labelBullet("Web-first signup", "Email or phone + password, or social login (Google/Apple). The signup UI is shown in the learner's chosen language (EN/TH/VI/MS)."));
children.push(labelBullet("Verification", "Email/phone verification is required before the trial activates, to reduce abuse."));
children.push(labelBullet("One trial per learner", "A single free trial per person and per payment instrument. Anti-abuse checks (normalized email, device fingerprint, card fingerprint) prevent repeat trials."));
children.push(labelBullet("Low friction", "Learners can begin the first lesson during signup; the account and trial are established before the first premium-gated action."));

children.push(h2("5.3 The 1-Month Free Trial"));
children.push(labelBullet("Scope", "Full premium access for 30 calendar days (1 month) from activation — all available HSK levels, SRS, mock exams (when live), and other premium features."));
children.push(labelBullet("Card-required (default model)", "A valid credit card is captured at the start of the trial and is automatically charged when the trial ends, unless the learner cancels first. (Card-required vs. card-optional is an open question — see Section 11.)"));
children.push(labelBullet("Trial clock", "The 1-month window (30 × 24h) begins at successful registration and card authorization."));
children.push(labelBullet("Transparency", "At signup and in account settings, the learner sees a clear, localized statement: “Your free trial ends on <date>; you will then be charged <amount> for <plan>.”"));
children.push(labelBullet("Reminders", "In-app, email, and push reminders are sent 3 days before and again ~24h before the charge (day 30), in the learner's language. Pre-charge notice reduces disputes and satisfies card-network and consumer requirements."));
children.push(labelBullet("Cancel anytime", "One-tap cancellation during the trial; the learner keeps access until the trial end date and is not charged."));
children.push(labelBullet("Trial states", "trialing → active (successful charge) or canceled / expired (cancellation or failed payment)."));

children.push(h2("5.4 Plans & Pricing"));
children.push(makeTable(
  ["Plan", "Billing", "What it includes"],
  [
    ["Free (post-trial fallback)", "No charge", "Limited daily lessons; no mock exams. Optional — depends on the card-required decision (see Section 11)."],
    ["Premium Monthly", "USD 5.99/month charged to card; auto-renew", "Full access to all content and features."],
    ["Premium Annual", "USD 44.99/year charged to card (≈37% saving); auto-renew", "Full access; best value per month."],
  ],
  [2600, 3360, 3400]
));
children.push(p("Anchor prices are USD 5.99/month and USD 44.99/year. Per-market local-currency pricing (regional / purchasing-power-adjusted) is owned by Product/Finance and displayed in local currency. Local payment methods (e.g., PromptPay, e-wallets) are a fast-follow per Section 4.4.", { italics: true }));

children.push(h2("5.5 Payment & Billing (Credit Card)"));
children.push(labelBullet("Payment processor", "Integrate a PCI-compliant payment gateway / PSP (e.g., Stripe or regional equivalent; vendor TBD in the technical design doc). MandaMix never stores raw card numbers."));
children.push(labelBullet("Card capture", "The card is tokenized at trial signup via PSP-hosted fields / SDK. Only the payment token plus non-sensitive metadata (brand, last4, expiry) are stored."));
children.push(labelBullet("First charge", "Automatically attempted at trial end (day 30) for the selected plan, in the learner's local currency where supported."));
children.push(labelBullet("Recurring billing", "The PSP manages the subscription and charges each billing cycle; subscriptions auto-renew until canceled."));
children.push(labelBullet("Receipts & invoices", "A localized receipt is emailed for every successful charge; full billing history is downloadable in the account."));
children.push(labelBullet("Tax & SCA", "Collect and remit applicable VAT/GST per market via the PSP's tax tooling; support 3-D Secure (3DS2 / SCA) where required by the card or market."));
children.push(labelBullet("App-store billing", "In-app purchases on iOS/Android use the respective store billing systems per their rules, while the web uses direct credit-card billing; all entitlements are unified server-side."));

children.push(h2("5.6 Subscription Lifecycle & Trial-to-Paid Conversion"));
children.push(labelBullet("States", "trialing, active, past_due, canceled, expired — the server is the single source of truth for entitlement."));
children.push(labelBullet("Auto-conversion", "At the end of the trial month the charge is attempted: success → active; failure → dunning (past_due)."));
children.push(labelBullet("Webhook-driven", "PSP webhooks (payment succeeded/failed, subscription updated/canceled) drive state changes. Access is never granted from client-side claims alone."));
children.push(labelBullet("Plan changes", "Upgrades/downgrades and monthly↔annual switches are handled with PSP proration."));

children.push(h2("5.7 Failed Payments & Dunning"));
children.push(labelBullet("Smart retries", "Failed charges are retried on a schedule over ~7–14 days (e.g., days 0, 1, 3, 7)."));
children.push(labelBullet("Grace period", "Limited continued access during past_due (configurable); on exhaustion, the account downgrades to free/locked."));
children.push(labelBullet("Localized dunning", "Email/push prompts in the learner's language asking them to update their card, with a self-serve card-update screen in the account."));

children.push(h2("5.8 Cancellation & Refunds"));
children.push(labelBullet("Cancel anytime", "Self-serve cancellation; access continues until the end of the current paid period (no mid-period proration refund by default)."));
children.push(labelBullet("Refunds", "Issued per market consumer law and a documented policy; handled manually by support via the billing admin."));
children.push(labelBullet("Win-back", "Pause and win-back offers are a later (P2) enhancement."));

children.push(h2("5.9 Security, Compliance & Admin Console"));
children.push(labelBullet("PCI DSS", "By using PSP-hosted fields, MandaMix stays in the lightest PCI scope (SAQ-A); no card data touches our servers."));
children.push(labelBullet("Data protection", "Comply with local data laws (e.g., Thailand PDPA, Vietnam PDPD, Malaysia PDPA); store minimal billing PII."));
children.push(labelBullet("User management", "Admins can create user accounts (the user receives a localized set-password invite — admins never see or set passwords) and trigger password-reset links (expire in 1 hour). Both actions are audited."));
children.push(labelBullet("Per-customer pricing", "Admins can apply a price override to an individual customer's subscription (e.g., student discount, support remediation) with a required reason. Overrides are applied via the PSP from the next invoice, never alter the public plan price, and below a floor (e.g., 50% of list) require finance approval."));
children.push(labelBullet("Billing operations", "View subscription status, issue refunds, comp/extend trials, and manage disputes and chargebacks."));
children.push(labelBullet("RBAC", "Admin roles (ops, finance, content) gate sensitive actions; refunds and price overrides are restricted and dual-logged."));
children.push(labelBullet("Auditability", "Every admin and billing mutation (user created, password reset, price override, refund, trial extension, webhook event) is written to an immutable audit log for reconciliation and dispute resolution."));

// 6. UX
children.push(h1("6. Key User Flows"));
children.push(h3("Onboarding"));
children.push(num("Choose your language (UI/instruction language)."));
children.push(num("Set your goal: casual learning, conversation, or HSK exam prep."));
children.push(num("Placement check (optional) to find the right starting level."));
children.push(num("Set a daily goal and enable reminders."));
children.push(num("Start first lesson within 60 seconds of opening the app."));
children.push(h3("Daily learning loop"));
children.push(num("Open app → see today's goal and SRS-due items."));
children.push(num("Complete a lesson (5–10 min): new material + interleaved review."));
children.push(num("Earn XP, advance streak, see progress toward HSK level."));
children.push(num("Receive a localized reminder later if goal not yet met."));
children.push(h3("HSK prep loop (Persona B)"));
children.push(num("Set target level and exam date → app generates study plan."));
children.push(num("Follow plan; take periodic mock exams."));
children.push(num("Review readiness score and weak areas; adjust plan."));
children.push(h3("Trial & subscription flow"));
children.push(num("Register (email/phone or social) and choose a plan."));
children.push(num("Enter credit-card details (tokenized by the PSP) to start the 1-month free trial."));
children.push(num("Use full premium access for one month; see the trial end date and upcoming charge in-app."));
children.push(num("Receive localized reminders 3 days and ~24h before the charge."));
children.push(num("Day 30: cancel to end with no charge, or let it auto-convert — the card is charged and the account becomes active."));
children.push(num("If a charge fails, enter dunning: retries + prompts to update the card, with a grace period before downgrade."));

// 7. Localization (critical differentiator)
children.push(h1("7. Localization Strategy"));
children.push(p("Localization is the core differentiator, not an afterthought. Every learner-facing string and every Mandarin explanation must exist natively in all four languages."));
children.push(labelBullet("Full localization", "UI, lesson instructions, grammar notes, error messages, and word translations are authored per language — not machine-translated from English at runtime."));
children.push(labelBullet("Translation pivot", "Mandarin content is the constant; each item carries four target-language glosses. The CMS enforces that no item ships without all four."));
children.push(labelBullet("Audio", "Native Mandarin audio is shared across languages; only text/explanations are localized."));
children.push(labelBullet("Cultural fit", "Examples, names, and scenarios adapted to each market where helpful (e.g., local food, places)."));
children.push(labelBullet("Right-to-grow", "Architecture supports adding Bahasa Indonesia, Khmer, etc. without re-engineering."));
children.push(p("Open question: should v1 ship all four languages simultaneously, or sequence them (e.g., English + Thai first)? See Section 11.", { italics: true }));

// 8. Tech considerations
children.push(h1("8. Technical Considerations (High Level)"));
children.push(labelBullet("Platforms", "Mobile-first (iOS + Android), with a responsive web app. Cross-platform framework (e.g., React Native or Flutter) recommended to share code."));
children.push(labelBullet("Localization framework", "i18n with externalized string catalogs per language; content separated from code."));
children.push(labelBullet("Content model", "Mandarin item as canonical entity with HSK level, audio, pinyin, and four localized glosses/explanations."));
children.push(labelBullet("SRS engine", "Spaced-repetition scheduling per learner per item."));
children.push(labelBullet("Speech", "Third-party speech-to-text / pronunciation scoring for Mandarin (P1)."));
children.push(labelBullet("Offline", "Local caching of downloaded lessons and SRS queue."));
children.push(labelBullet("Billing & SaaS", "Hosted multi-tenant web app; tokenized cards and recurring subscriptions managed by a PCI-compliant PSP; a server-side entitlement service gates premium access; PSP webhooks drive subscription state."));
children.push(p("Note: detailed architecture, data schema, and vendor choices are out of scope for this PRD and will be covered in a separate technical design doc.", { italics: true }));

// 9. Success metrics
children.push(h1("9. Success Metrics"));
children.push(makeTable(
  ["Metric", "Definition", "Launch target (directional)"],
  [
    ["D1 / D7 / D30 retention", "% of new users active after 1/7/30 days", "≥ 40% / 20% / 10%"],
    ["DAU/MAU (stickiness)", "Daily over monthly active users", "≥ 20%"],
    ["Lesson completion rate", "% of started lessons completed", "≥ 80%"],
    ["Free → paid conversion", "% of active users on premium", "2–5%"],
    ["Trial → paid conversion", "% of started trials that convert to a paid charge", "≥ 50% (card-required)"],
    ["Payment success rate", "% of due charges that succeed (incl. retries)", "≥ 90%"],
    ["Involuntary churn", "% of paid cancellations caused by failed payments", "≤ 1.5% / month"],
    ["HSK readiness accuracy", "Mock-exam score vs. self-reported real result", "Within ±1 level"],
    ["Localization coverage", "% of shipped content fully localized in all 4 languages", "100%"],
  ],
  [2700, 3760, 2900]
));

// 10. Roadmap / phasing
children.push(h1("10. Phasing & Roadmap"));
children.push(makeTable(
  ["Phase", "Scope", "Target"],
  [
    ["Phase 0 — Foundations", "Content model, CMS, localization framework, hosting/auth, first HSK 1 lessons in EN + TH", "Q3 2026"],
    ["Phase 1 — MVP launch", "HSK 1–3 self-paced course in all 4 languages; SRS; streaks; 1-month trial + credit-card billing (PSP); freemium", "Q4 2026"],
    ["Phase 2 — HSK prep", "HSK 4–6 content; mock exams; readiness score; study plans; speech check", "H1 2027"],
    ["Phase 3 — Scale", "HSK 7–9; offline; local payments; leaderboards; new languages (e.g., Indonesian)", "H2 2027"],
  ],
  [2400, 5260, 1700]
));

// 11. Open questions & risks
children.push(h1("11. Open Questions & Risks"));
children.push(h2("11.1 Open Questions"));
children.push(bullet("Ship all four languages at once, or sequence (English + Thai first, then VI + MS)?"));
children.push(bullet("Business model emphasis: subscription, one-time HSK-prep packs, or both?"));
children.push(bullet("Trial: card-required (auto-charge at day 30) vs. card-optional, and is 1 month the right length vs. 7/14 days?"));
children.push(bullet("Keep a free tier after the trial, or convert to a hard paywall?"));
children.push(bullet("Which PSP(s) give the best card coverage, local methods, and fees across TH/VN/MY?"));
children.push(bullet("Build proprietary content vs. license an existing HSK 3.0 word/grammar dataset?"));
children.push(bullet("Tax-inclusive pricing ($5.99 includes VAT/DST) vs. tax added at checkout? (TH 7% VES, MY 8% DST, VN 10% VAT — see docs/05_launch_gaps_and_compliance.md)"));
children.push(bullet("Elevate an AI Speaking Partner (role-play dialogues + pronunciation feedback) to Phase 2 P0/P1, aligned with the HSK 3+ oral exam? 2026 competitors ship this as standard."));
children.push(bullet("Web-first purchase flow to avoid the 15–30% app-store commission on mobile subscriptions?"));
children.push(bullet("HSK trademark: confirm nominative-use boundaries with counsel; mock exams must be original questions in the official format (never real past papers)."));
children.push(bullet("How much speech/AI tutoring to include in v1 vs. defer?"));
children.push(h2("11.2 Risks"));
children.push(labelBullet("Content cost", "Authoring + 4-way localization is expensive; mitigate with strong CMS and phased rollout."));
children.push(labelBullet("HSK 3.0 churn", "Standard is brand-new (July 2026); details may shift. Keep content tagging flexible."));
children.push(labelBullet("Retention", "Language apps have high churn; gamification and SRS are essential, not optional."));
children.push(labelBullet("Competition", "Incumbents could add SEA localization. Speed and depth of localization are the moat."));
children.push(labelBullet("Billing fraud & chargebacks", "Card-required trials attract trial abuse and disputes; mitigate with verification, fingerprinting, clear pre-charge reminders, and dunning."));
children.push(labelBullet("Payment coverage", "Card penetration varies across SEA; mitigate with local payment methods (PromptPay, e-wallets) as a fast-follow and clear local-currency pricing."));

// Appendix
children.push(h1("Appendix: Sources"));
children.push(bullet("HSK 3.0 reform — nine levels, vocabulary, timeline: mandarinzone.com, studycli.org, digmandarin.com"));
children.push(bullet("Competitive landscape (HelloChinese, Duolingo, Pleco): migaku.com, digmandarin.com, clozemaster.com"));

// ---------- document ----------
const doc = new Document({
  creator: "MandaMix Product",
  title: "MandaMix PRD",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: "Arial", color: "2E5C8A" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "404040" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 2 } },
      children: [new TextRun({ text: "MandaMix — Product Requirements Document", size: 16, color: "808080" })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: "Confidential — Draft", size: 16, color: "808080" }),
        new TextRun({ text: "\tPage ", size: 16, color: "808080" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "808080" }),
      ],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/Users/mavronesamuel/Desktop/huayutong/MandaMix_PRD.docx", buf);
  console.log("written");
});
