const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TableOfContents, PageNumber, Header, Footer, PageBreak,
  TabStopType, TabStopPosition
} = require("docx");

const BLUE = "1F4E79";
const GREY = "F2F2F2";
const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };

// ---------- helpers (shared style with build_prd.js) ----------
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] }); }
function p(text, opts = {}) { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, ...opts })] }); }
function bullet(text, level = 0) {
  return new Paragraph({ numbering: { reference: "bullets", level }, spacing: { after: 60 },
    children: typeof text === "string" ? [new TextRun(text)] : text });
}
function num(text) {
  return new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
    children: typeof text === "string" ? [new TextRun(text)] : text });
}
function labelBullet(label, rest) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
    children: [new TextRun({ text: label + ": ", bold: true }), new TextRun(rest)] });
}
function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) => new TableCell({
      borders, width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: htext, bold: true, color: "FFFFFF" })] })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      borders, width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: ri % 2 ? GREY : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: cell.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line })] })),
    })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...bodyRows] });
}

// ---------- document body ----------
const children = [];

// Title block
children.push(
  new Paragraph({ spacing: { before: 2400, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MandaMix", bold: true, size: 64, color: BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Business Requirements Document (BRD)", size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Business case and scope for a localized Mandarin learning SaaS for Southeast Asia", italics: true, size: 24, color: "595959" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 },
    children: [new TextRun({ text: "English  ·  ไทย  ·  Tiếng Việt  ·  Bahasa Melayu", size: 22, color: "595959" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Version 0.1 (Draft)   ·   June 2026   ·   Owner: Product / Business", size: 20, color: "808080" })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(
  new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 28, color: BLUE })], spacing: { after: 160 } }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Executive Summary
children.push(h1("1. Executive Summary"));
children.push(p("MandaMix is a self-paced Mandarin learning Software-as-a-Service (SaaS) built specifically for Southeast Asian learners. Unlike global apps that teach Mandarin only through English, MandaMix delivers its entire experience — interface, instructions, explanations, and translations — natively in four languages (English, Thai, Vietnamese, and Bahasa Melayu) and is aligned to the reformed HSK 3.0 standard from day one."));
children.push(p("The product is delivered as a hosted web and mobile service. Learners register online, receive a 1-month free trial of full premium access, and are then automatically billed to their credit card on a recurring basis unless they cancel — generating predictable subscription revenue."));
children.push(p("This Business Requirements Document (BRD) defines the business rationale, objectives, scope, stakeholders, revenue/cost model, assumptions, and risks for MandaMix. It is the business-level companion to the Product Requirements Document (PRD), which specifies the product in detail."));

children.push(h2("1.1 Purpose of this Document"));
children.push(p("The BRD answers “why are we building this and what does the business need?” It aligns leadership, finance, product, engineering, and content stakeholders on objectives and scope before significant build investment is committed. Detailed feature specifications live in the PRD; technical architecture lives in the Technical Design Doc."));

children.push(h2("1.2 Background & Context"));
children.push(labelBullet("The English barrier", "Most leading Mandarin apps teach exclusively through English, adding friction for the hundreds of millions of Thai, Vietnamese, and Malay/Indonesian speakers with limited English."));
children.push(labelBullet("A timing window", "The reformed HSK 3.0 standard (published November 2025) reaches full implementation in July 2026. Launching aligned to the new nine-level framework from day one is a differentiator versus incumbents still mapped to the old standard."));
children.push(labelBullet("A SaaS model", "Hosting the product centrally with a trial-to-paid subscription removes install friction, enables continuous content delivery, and produces recurring revenue."));

// 2. Objectives & success criteria
children.push(h1("2. Business Objectives & Success Criteria"));
children.push(p("MandaMix's v1 business objectives and the KPIs used to judge them:"));
children.push(makeTable(
  ["Objective", "Why it matters", "Primary KPI(s)"],
  [
    ["Win SEA learners with native localization", "Localization is the moat versus English-only incumbents", "Sign-ups by market; localization coverage = 100%"],
    ["Convert trials into paying subscribers", "Recurring revenue is the core business model", "Trial → paid conversion ≥ 50%; free → paid 2–5%"],
    ["Retain learners long term", "Subscription value depends on low churn", "D30 retention ≥ 10%; DAU/MAU ≥ 20%"],
    ["Establish credible HSK 3.0 preparation", "Drives premium willingness-to-pay (Persona B)", "HSK readiness accuracy within ±1 level"],
    ["Operate billing reliably and compliantly", "Protects revenue and trust", "Payment success ≥ 90%; involuntary churn ≤ 1.5%/mo"],
  ],
  [3000, 3360, 3000]
));
children.push(p("Targets are directional for launch and are owned jointly by Product and Finance; they mirror the success metrics in the PRD.", { italics: true }));

// 3. Market & opportunity
children.push(h1("3. Market & Opportunity"));
children.push(p("Southeast Asia has strong and growing demand for Mandarin driven by trade, tourism, and education ties with China. The dominant global apps are not localized for the region's languages, leaving a clear positioning gap."));
children.push(h2("3.1 Demand Drivers"));
children.push(bullet("Economic and tourism ties with China across Thailand, Vietnam, and Malaysia."));
children.push(bullet("A large base of learners who prefer studying in their own language rather than via English."));
children.push(bullet("Rising demand for formal HSK certification for study and work in China."));
children.push(h2("3.2 Opportunity Sizing (directional)"));
children.push(makeTable(
  ["Segment", "Description", "Notes"],
  [
    ["TAM", "Mandarin learners across Southeast Asia", "Tens of millions across target markets"],
    ["SAM", "Smartphone-first self-learners + HSK candidates in TH/VN/MY", "Reachable via app stores and digital marketing"],
    ["SOM (Year 1)", "Early adopters in launch markets willing to pay for localized study", "Captured via trial-to-paid funnel"],
  ],
  [1800, 4560, 3000]
));
children.push(p("Precise sizing is a finance workstream; figures here are directional to frame scope.", { italics: true }));
children.push(h2("3.3 Why Now"));
children.push(p("The HSK 3.0 transition (full implementation July 2026) creates a one-time window to launch as the natively localized, standard-aligned option before incumbents adapt their SEA offerings."));

// 4. Business scope
children.push(h1("4. Business Scope"));
children.push(h2("4.1 In Scope (v1)"));
children.push(bullet("Hosted SaaS (web + mobile) with self-paced HSK 3.0-aligned Mandarin courses (Levels 1–3 at launch, 4–6 fast-follow)."));
children.push(bullet("Full native localization of the experience in English, Thai, Vietnamese, and Bahasa Melayu."));
children.push(bullet("1-month free trial with credit-card capture, auto-converting to a recurring subscription."));
children.push(bullet("Freemium tier, monthly/annual premium, receipts, and billing operations (dunning, cancellation, refunds)."));
children.push(bullet("Admin console: user management (create accounts, password resets), per-customer price overrides with audit trail, refunds, trial extensions, and a content-localization publish gate."));
children.push(bullet("Engagement features (streaks, XP, SRS) and core HSK prep (level mapping; mock exams/readiness/study plans as fast-follow)."));
children.push(h2("4.2 Out of Scope (v1)"));
children.push(bullet("Live 1-on-1 tutoring, group classes, or human-in-the-loop teaching."));
children.push(bullet("Teaching languages other than Mandarin."));
children.push(bullet("A full social network/community (lightweight leaderboards only)."));
children.push(bullet("Official HSK test registration or proctoring."));
children.push(h2("4.3 Markets & Languages (phased)"));
children.push(makeTable(
  ["Language", "Primary market(s)", "Launch priority"],
  [
    ["English", "Regional lingua franca; expats; Singapore/Philippines", "P0"],
    ["ไทย (Thai)", "Thailand", "P0"],
    ["Tiếng Việt (Vietnamese)", "Vietnam", "P0"],
    ["Bahasa Melayu", "Malaysia; adaptable to Bahasa Indonesia later", "P0"],
  ],
  [2600, 4760, 2000]
));

// 5. Stakeholders & RACI
children.push(h1("5. Stakeholders & RACI"));
children.push(h2("5.1 Key Stakeholders"));
children.push(makeTable(
  ["Role", "Responsibility"],
  [
    ["Executive sponsor / Leadership", "Funds the initiative; approves scope and budget"],
    ["Product", "Owns PRD, prioritization, and success metrics"],
    ["Engineering", "Builds and operates the SaaS platform and billing"],
    ["Content & Localization", "Authors HSK content and four-language translations"],
    ["Marketing / Growth", "Acquisition, launch, and conversion campaigns"],
    ["Finance", "Pricing, unit economics, revenue recognition"],
    ["Legal / Compliance", "ToS/privacy, PCI, PDPA/PDPD, refunds policy"],
  ],
  [3200, 6160]
));
children.push(h2("5.2 RACI (key deliverables)"));
children.push(p("R = Responsible, A = Accountable, C = Consulted, I = Informed.", { italics: true }));
children.push(makeTable(
  ["Deliverable", "Product", "Eng", "Content", "Mktg", "Finance/Legal"],
  [
    ["Scope & roadmap", "A/R", "C", "C", "C", "I"],
    ["Platform & billing build", "C", "A/R", "I", "I", "C"],
    ["HSK content + localization", "C", "I", "A/R", "I", "I"],
    ["Pricing & unit economics", "C", "I", "I", "C", "A/R"],
    ["Launch & acquisition", "C", "I", "I", "A/R", "I"],
    ["Compliance (PCI/PDPA)", "I", "C", "I", "I", "A/R"],
  ],
  [2760, 1320, 1320, 1320, 1320, 1320]
));

// 6. Revenue & cost model
children.push(h1("6. Revenue & Cost Model"));
children.push(h2("6.1 Revenue Model"));
children.push(labelBullet("Freemium + subscription", "A limited free tier drives acquisition; premium unlocks the full experience."));
children.push(labelBullet("1-month trial → recurring", "Card-required trial auto-converts to a monthly or annual subscription billed to the learner's credit card."));
children.push(labelBullet("Annual upsell", "Discounted annual plan improves cash flow and retention."));
children.push(labelBullet("Local payments (fast-follow)", "Regional methods (e.g., PromptPay, e-wallets) added to widen payable audience."));
children.push(h2("6.2 Pricing Approach"));
children.push(p("Anchor prices are set in USD with per-market local-currency pricing (purchasing-power-adjusted) to follow from the Finance pricing study."));
children.push(makeTable(
  ["Plan", "Anchor price", "Notes"],
  [
    ["Free", "—", "Limited daily lessons; acquisition funnel"],
    ["Premium Monthly", "US$5.99 / month", "Per-market localized pricing"],
    ["Premium Annual", "US$44.99 / year (≈37% saving)", "Best value; improves retention & cash flow"],
  ],
  [2400, 3760, 3200]
));
children.push(h2("6.3 Cost Drivers"));
children.push(bullet("Content authoring + four-way localization (the largest cost; flagged as the top risk in the PRD)."));
children.push(bullet("Engineering build and ongoing platform/hosting operations."));
children.push(bullet("Payment processing fees (PSP + card networks) and tax handling."));
children.push(bullet("Customer acquisition (marketing) and support."));
children.push(bullet("Third-party services (speech/pronunciation, email/push, analytics)."));
children.push(h2("6.4 Unit-Economics Levers"));
children.push(bullet("Trial → paid conversion rate (primary revenue lever for a card-required trial)."));
children.push(bullet("Subscriber lifetime value (LTV) vs. customer acquisition cost (CAC)."));
children.push(bullet("Churn — both voluntary (retention/engagement) and involuntary (failed payments/dunning)."));

// 7. Assumptions & constraints
children.push(h1("7. Assumptions & Constraints"));
children.push(h2("7.1 Assumptions"));
children.push(bullet("Native localization meaningfully increases conversion and retention versus English-only apps."));
children.push(bullet("A card-required 1-month trial yields acceptable conversion without excessive sign-up drop-off."));
children.push(bullet("Credit-card and local payment coverage is sufficient in launch markets to monetize."));
children.push(bullet("HSK 3.0 content and tagging can be authored on the planned timeline and budget."));
children.push(h2("7.2 Constraints"));
children.push(bullet("Content + localization budget caps how fast HSK levels and languages can ship."));
children.push(bullet("The HSK 3.0 standard is brand-new and details may shift; tagging must stay flexible."));
children.push(bullet("App-store billing rules apply to in-app purchases on iOS/Android."));
children.push(bullet("Data-protection and PCI obligations constrain how billing and PII are handled."));

// 8. Business risks
children.push(h1("8. Business Risks & Mitigations"));
children.push(makeTable(
  ["Risk", "Impact", "Mitigation"],
  [
    ["High content + localization cost", "Budget overrun; slower coverage", "Strong CMS, phased rollout, sequence languages if needed"],
    ["Low trial-to-paid conversion", "Weak recurring revenue", "Clear value in trial, pre-charge reminders, pricing tests"],
    ["High churn", "Erodes subscription base", "Gamification + SRS, study plans, win-back offers"],
    ["Payment coverage / fraud / chargebacks", "Lost or disputed revenue", "Local methods, verification & fingerprinting, dunning"],
    ["HSK 3.0 standard shifts", "Content rework", "Flexible level tagging; monitor official updates"],
    ["Incumbents add SEA localization", "Erodes the moat", "Move fast; depth and quality of localization"],
  ],
  [2800, 2800, 3760]
));

// 9. Timeline
children.push(h1("9. High-Level Timeline & Milestones"));
children.push(makeTable(
  ["Phase", "Business milestone", "Target"],
  [
    ["Phase 0 — Foundations", "Platform, CMS, localization framework; first HSK 1 (EN+TH)", "Q3 2026"],
    ["Phase 1 — MVP launch", "HSK 1–3 in 4 languages; trial + credit-card billing live; revenue begins", "Q4 2026"],
    ["Phase 2 — HSK prep", "HSK 4–6; mock exams/readiness; premium willingness-to-pay grows", "H1 2027"],
    ["Phase 3 — Scale", "HSK 7–9; local payments; new languages; market expansion", "H2 2027"],
  ],
  [2400, 5260, 1700]
));

// 10. Approvals
children.push(h1("10. Approvals & Sign-off"));
children.push(p("This BRD requires sign-off from the following before Phase 1 build commitment:"));
children.push(makeTable(
  ["Approver", "Role", "Decision"],
  [
    ["", "Executive sponsor", "Approve / revise"],
    ["", "Head of Product", "Approve / revise"],
    ["", "Head of Engineering", "Approve / revise"],
    ["", "Finance", "Approve / revise"],
    ["", "Legal / Compliance", "Approve / revise"],
  ],
  [3360, 3600, 2400]
));

// Appendix
children.push(h1("Appendix: Related Documents"));
children.push(bullet("Product Requirements Document — MandaMix_PRD.pdf (feature-level detail)."));
children.push(bullet("Architecture & workflows — docs/01_architecture_and_workflows.md."));
children.push(bullet("Database design — docs/02_database.md, db/schema.sql."));
children.push(bullet("API reference & connection guide — docs/03_api.md, docs/openapi.yaml."));
children.push(bullet("Build-documents checklist — docs/04_documents_checklist.md."));

// ---------- document ----------
const doc = new Document({
  creator: "MandaMix Business",
  title: "MandaMix BRD",
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
      children: [new TextRun({ text: "MandaMix — Business Requirements Document", size: 16, color: "808080" })],
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
  fs.writeFileSync("/Users/mavronesamuel/Desktop/huayutong/MandaMix_BRD.docx", buf);
  console.log("written");
});
