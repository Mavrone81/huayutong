# MandaMix — Architecture & Workflow Diagrams

> Companion to `MandaMix_PRD.pdf`. All diagrams use [Mermaid](https://mermaid.js.org/)
> and render natively on GitHub, in VS Code (Markdown Preview Mermaid extension), and
> in JetBrains IDEs. Paste any block into <https://mermaid.live> to edit visually.

Assumed stack (see `.env.example` and `docs/03_api.md`):

- **Frontend:** React Native (iOS/Android) + responsive React web, sharing an i18n catalog.
- **Backend:** Node/TypeScript REST API (`/v1`), PostgreSQL, Redis (cache + job queue).
- **Payments:** Stripe (PCI-compliant PSP) — tokenized cards, subscriptions, webhooks.
- **Infra:** S3 + CDN for native Mandarin audio, object storage for media; container-hosted API.

---

## 1. System Architecture (C4-ish container view)

```mermaid
graph TB
    subgraph Clients
        MOB["Mobile App<br/>(React Native — iOS/Android)"]
        WEB["Web App<br/>(React, responsive)"]
        CMS["Content CMS<br/>(internal authoring/translation)"]
        ADM["Billing & Ops Admin"]
    end

    CDN["CDN<br/>(Mandarin audio, media, static)"]
    APIGW["API Gateway / Load Balancer<br/>(TLS, rate limiting, WAF)"]

    subgraph Backend["Backend Services (REST /v1)"]
        AUTH["Auth Service<br/>(JWT, OAuth, sessions)"]
        BILL["Billing Service<br/>(trials, subscriptions, dunning)"]
        LEARN["Learning Service<br/>(courses, lessons, progress)"]
        SRS["SRS Engine<br/>(scheduling, review queue)"]
        EXAM["HSK Prep Service<br/>(mock exams, readiness, study plans)"]
        ENT["Entitlement Service<br/>(access checks)"]
        NOTIF["Notification Service<br/>(email/push, reminders)"]
        CONTENT["Content Service<br/>(items, glosses, i18n)"]
        ANALYTICS["Analytics/Event Ingest"]
    end

    subgraph Data
        PG[("PostgreSQL<br/>(primary store)")]
        REDIS[("Redis<br/>(cache, queues, rate limit)")]
        OBJ[("Object Storage / S3<br/>(audio, exports)")]
        DW[("Data Warehouse<br/>(analytics, optional)")]
    end

    subgraph External["Third-party"]
        STRIPE["Stripe<br/>(PSP / webhooks)"]
        EMAIL["Email Provider<br/>(Postmark/SendGrid)"]
        PUSH["Push (FCM / APNs)"]
        OAUTHP["Google / Apple OAuth"]
        SPEECH["Speech / Pronunciation API (P1)"]
        STORE["App Store / Play Billing"]
    end

    MOB & WEB --> CDN
    MOB & WEB & CMS & ADM --> APIGW
    APIGW --> AUTH & BILL & LEARN & SRS & EXAM & ENT & NOTIF & CONTENT & ANALYTICS

    AUTH --> OAUTHP
    BILL <--> STRIPE
    BILL --> STORE
    NOTIF --> EMAIL & PUSH
    EXAM --> SPEECH
    LEARN & SRS --> SPEECH

    AUTH & BILL & LEARN & SRS & EXAM & ENT & NOTIF & CONTENT --> PG
    AUTH & SRS & NOTIF & BILL --> REDIS
    CONTENT --> OBJ
    ANALYTICS --> DW
    CDN --> OBJ
```

---

## 2. Registration → 1-Month Trial → Conversion (sequence)

```mermaid
sequenceDiagram
    autonumber
    actor U as Learner
    participant FE as App (Web/Mobile)
    participant API as Backend API
    participant STR as Stripe (PSP)
    participant NT as Notification Svc
    participant DB as PostgreSQL

    U->>FE: Sign up (email/phone or Google/Apple), pick language
    FE->>API: POST /v1/auth/register
    API->>DB: create user (status=pending), send verification
    API->>NT: send verification (localized)
    U->>FE: Verify email/phone
    FE->>API: POST /v1/auth/verify
    API->>DB: user.status = active

    U->>FE: Choose plan + enter card (PSP-hosted fields)
    FE->>STR: tokenize card (SDK, card never hits our server)
    STR-->>FE: payment_method token (pm_xxx)
    FE->>API: POST /v1/billing/trials {plan_id, payment_method}
    API->>STR: create customer + subscription (trial_period_days=30)
    STR-->>API: subscription (status=trialing, trial_end)
    API->>DB: subscriptions(status=trialing, trial_ends_at), entitlement=premium
    API->>NT: schedule T-3d + T-24h pre-charge reminders
    API-->>FE: trial active, ends_at=<date>

    Note over NT,U: 3-days-before + ~24h-before reminders (localized, in-app/email/push)

    alt Learner cancels during trial
        U->>FE: Cancel trial
        FE->>API: POST /v1/billing/subscription/cancel
        API->>STR: cancel subscription
        STR-->>API: status=canceled
        API->>DB: status=canceled (access until trial_end), entitlement downgraded at trial_end
    else Trial reaches day 30
        STR->>STR: auto-charge default payment method
        STR-->>API: webhook invoice.payment_succeeded
        API->>DB: status=active, record invoice + payment
        API->>NT: send receipt (localized)
    else Charge fails at trial end
        STR-->>API: webhook invoice.payment_failed
        API->>DB: status=past_due (enter dunning)
        API->>NT: dunning email + card-update prompt
    end
```

---

## 3. Subscription Lifecycle (state machine)

```mermaid
stateDiagram-v2
    [*] --> trialing: start 1-month trial (card captured)
    trialing --> active: trial-end charge succeeds
    trialing --> canceled: user cancels (access until trial_end)
    trialing --> past_due: trial-end charge fails
    active --> past_due: renewal charge fails
    active --> canceled: user cancels (access until period_end)
    past_due --> active: retry succeeds / card updated
    past_due --> canceled: dunning exhausted (grace expired)
    canceled --> active: resubscribe
    canceled --> expired: period_end passes
    expired --> active: resubscribe
    active --> [*]
    expired --> [*]

    note right of past_due
        Smart retries ~days 0,1,3,7
        Grace period: limited access,
        then downgrade to free/locked
    end note
```

---

## 4. Dunning / Failed-Payment Flow

```mermaid
flowchart TD
    A[Charge attempt fails] --> B{Retryable?<br/>e.g. insufficient funds}
    B -- no, hard decline --> H[Mark canceled-soon<br/>notify, ask new card]
    B -- yes --> C[status = past_due<br/>start grace period]
    C --> D[Notify learner localized<br/>email + push + in-app]
    D --> E{Retry schedule<br/>day 0,1,3,7}
    E -- success / card updated --> F[status = active<br/>send receipt]
    E -- still failing --> G{Grace period<br/>exhausted?}
    G -- no --> E
    G -- yes --> I[Downgrade entitlement<br/>to free / locked]
    I --> J[status = canceled<br/>win-back eligible later]
    H --> I
```

---

## 5. Daily Learning Loop

```mermaid
flowchart LR
    S([Open app]) --> G[Load today's goal<br/>+ SRS-due items]
    G --> E{Entitlement check<br/>premium vs free}
    E -- locked --> PW[Show paywall / trial offer]
    E -- ok --> L[Serve lesson 5-10 min<br/>new + interleaved review]
    L --> R[Grade answers]
    R --> SRS[Update SRS schedule<br/>per item]
    R --> XP[Award XP + advance streak]
    XP --> P[Update HSK level progress]
    P --> N{Daily goal met?}
    N -- no --> RM[Schedule localized reminder]
    N -- yes --> D([Done])
    RM --> D
```

---

## 6. HSK Prep Loop (Persona B)

```mermaid
flowchart TD
    A[Set target HSK level + exam date] --> B[Generate study plan<br/>exam-date-driven daily tasks]
    B --> C[Follow daily plan<br/>lessons + drills]
    C --> D{Checkpoint reached?}
    D -- no --> C
    D -- yes --> E[Take timed mock exam<br/>official format per level]
    E --> F[Compute readiness score<br/>estimated level + % ready]
    F --> G[Surface weak areas]
    G --> H[Adjust plan / reweight SRS]
    H --> C
```

---

## 7. Admin Console Operations

Admin actions are RBAC-gated and every mutation is written to an immutable
`audit_logs` entry. Admins never see or set passwords — account creation and
resets work through expiring, localized links.

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin (ops/finance)
    participant ADM as Admin Console
    participant API as Backend API
    participant STR as Stripe (PSP)
    participant NT as Notification Svc
    participant DB as PostgreSQL

    rect rgb(240,246,252)
    note over A,DB: Create user
    A->>ADM: New user (name, email, language, plan)
    ADM->>API: POST /admin/users
    API->>DB: create user (status=pending)
    API->>NT: send localized set-password invite
    API->>DB: audit_logs: user.create (actor, reason)
    end

    rect rgb(252,247,238)
    note over A,DB: Reset password
    A->>ADM: Reset password for user
    ADM->>API: POST /admin/users/{id}/password-reset
    API->>NT: send reset link (expires 1h, localized)
    API->>DB: audit_logs: user.password_reset
    end

    rect rgb(238,250,247)
    note over A,DB: Per-customer price override
    A->>ADM: Override price (amount, applies-from, reason*)
    ADM->>API: PUT /admin/customers/{id}/price
    alt below approval floor (e.g. < 50% of list)
        API-->>ADM: 403 requires finance_admin approval
    else within policy
        API->>STR: update subscription item price (next invoice)
        STR-->>API: subscription updated
        API->>DB: price_override (amount, reason, actor)
        API->>DB: audit_logs: price.override
        API-->>ADM: confirmed — public plan price unchanged
    end
    end
```

### Admin action ↔ audit flow (overview)

```mermaid
flowchart LR
    A[Admin console] -->|RBAC check| G{Allowed for role?}
    G -- no --> X[403 + logged attempt]
    G -- yes --> ACT[Execute action]
    ACT --> U[POST /admin/users<br/>create user]
    ACT --> P[POST .../password-reset<br/>send 1h link]
    ACT --> O["PUT .../price<br/>override (reason required)"]
    ACT --> R[POST /admin/refunds]
    ACT --> T[POST /admin/trials/extend]
    U & P & O & R & T --> AU[(audit_logs<br/>immutable)]
    O --> PSP[Stripe: next-invoice price]
    R --> PSP
    U & P --> NT[Notification Svc<br/>localized email]
```

---

## 8. Content & Localization Model (logical)

```mermaid
flowchart LR
    HSK[HSK 3.0 Level<br/>1..9] --> ITEM[Mandarin Item<br/>hanzi + pinyin + audio<br/>canonical entity]
    ITEM --> G_EN[Gloss: English]
    ITEM --> G_TH[Gloss: ไทย]
    ITEM --> G_VI[Gloss: Tiếng Việt]
    ITEM --> G_MS[Gloss: Bahasa Melayu]
    ITEM --> LIT[Lesson Items]
    LIT --> LES[Lesson]
    LES --> SKILL[Skill / Unit]
    SKILL --> COURSE[Course<br/>per HSK level]
    NOTE([CMS gate: an item cannot ship<br/>unless all 4 glosses exist]) -.-> ITEM
```
