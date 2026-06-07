-- =====================================================================
-- MandaMix — PostgreSQL schema (v0.1)
-- Engine: PostgreSQL 15+
-- Money: integer minor units (cents) + ISO-4217 currency.
-- Timestamps: timestamptz (UTC).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";      -- case-insensitive email

-- ---------- enums ----------
CREATE TYPE user_status        AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE auth_provider      AS ENUM ('password', 'google', 'apple');
CREATE TYPE goal_type          AS ENUM ('casual', 'conversation', 'hsk_exam');
CREATE TYPE plan_interval      AS ENUM ('month', 'year');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE pay_method_type    AS ENUM ('card', 'promptpay', 'ewallet', 'app_store', 'play_store');
CREATE TYPE invoice_status     AS ENUM ('draft', 'open', 'paid', 'uncollectible', 'void');
CREATE TYPE payment_status     AS ENUM ('requires_action', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE lesson_state       AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE exam_state         AS ENUM ('in_progress', 'submitted', 'scored', 'abandoned');
CREATE TYPE notif_channel      AS ENUM ('email', 'push', 'in_app');
CREATE TYPE notif_status       AS ENUM ('scheduled', 'sent', 'failed', 'canceled', 'read');

-- =====================================================================
-- IDENTITY & AUTH
-- =====================================================================

CREATE TABLE languages (
    code               varchar(8) PRIMARY KEY,          -- 'en','th','vi','ms','zh'
    name               text NOT NULL,
    native_name        text NOT NULL,
    is_learner_facing  boolean NOT NULL DEFAULT true,    -- false for 'zh' (source)
    is_active          boolean NOT NULL DEFAULT true
);

CREATE TABLE users (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email              citext UNIQUE,
    phone              text UNIQUE,
    email_verified_at  timestamptz,
    phone_verified_at  timestamptz,
    status             user_status NOT NULL DEFAULT 'pending',
    ui_language        varchar(8) NOT NULL DEFAULT 'en' REFERENCES languages(code),
    goal               goal_type,
    timezone           text NOT NULL DEFAULT 'UTC',
    display_name       text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE auth_identities (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider           auth_provider NOT NULL,
    provider_subject   text,                              -- OAuth sub; null for password
    password_hash      text,                              -- bcrypt/argon2; only for 'password'
    created_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_subject)
);

CREATE TABLE devices (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform           text NOT NULL,                     -- ios|android|web
    push_token         text,                              -- FCM/APNs token
    fingerprint        text,                              -- anti-abuse (trial fraud)
    last_seen_at       timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_fingerprint ON devices(fingerprint);

CREATE TABLE sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash text NOT NULL,
    device_id          uuid REFERENCES devices(id) ON DELETE SET NULL,
    expires_at         timestamptz NOT NULL,
    revoked_at         timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- =====================================================================
-- BILLING
-- =====================================================================

CREATE TABLE customers (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    psp_customer_id    text UNIQUE,                       -- e.g. Stripe cus_xxx
    billing_country    char(2),
    default_currency   char(3),
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plans (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code               text UNIQUE NOT NULL,              -- 'free','premium_monthly','premium_annual'
    name               text NOT NULL,
    interval           plan_interval,                     -- null for free
    trial_days         int NOT NULL DEFAULT 5,
    is_active          boolean NOT NULL DEFAULT true,
    psp_product_id     text
);

CREATE TABLE prices (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id            uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    currency           char(3) NOT NULL,
    amount_minor       int NOT NULL,                      -- e.g. 19900 = 199.00
    psp_price_id       text,                              -- Stripe price_xxx
    is_active          boolean NOT NULL DEFAULT true,
    UNIQUE (plan_id, currency)
);

CREATE TABLE payment_methods (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id        uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type               pay_method_type NOT NULL,
    psp_payment_method_id text,                           -- token; NEVER store PAN
    brand              text,                              -- visa/master/...
    last4              char(4),
    exp_month          int,
    exp_year           int,
    is_default         boolean NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_customer ON payment_methods(customer_id);

CREATE TABLE subscriptions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id        uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_id            uuid NOT NULL REFERENCES plans(id),
    status             subscription_status NOT NULL,
    psp_subscription_id text UNIQUE,
    currency           char(3),
    trial_started_at   timestamptz,
    trial_ends_at      timestamptz,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    canceled_at        timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);
-- one non-terminal subscription per customer
CREATE UNIQUE INDEX uq_active_sub_per_customer
    ON subscriptions(customer_id)
    WHERE status IN ('trialing','active','past_due');
CREATE INDEX idx_sub_status ON subscriptions(status);
CREATE INDEX idx_sub_trial_end ON subscriptions(trial_ends_at);

CREATE TABLE invoices (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id    uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    customer_id        uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    psp_invoice_id     text UNIQUE,
    status             invoice_status NOT NULL DEFAULT 'open',
    currency           char(3) NOT NULL,
    subtotal_minor     int NOT NULL,
    tax_minor          int NOT NULL DEFAULT 0,
    total_minor        int NOT NULL,
    period_start       timestamptz,
    period_end         timestamptz,
    issued_at          timestamptz NOT NULL DEFAULT now(),
    paid_at            timestamptz
);
CREATE INDEX idx_invoices_sub ON invoices(subscription_id, issued_at);

CREATE TABLE payments (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id         uuid REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id        uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    payment_method_id  uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
    psp_payment_intent_id text UNIQUE,
    status             payment_status NOT NULL,
    amount_minor       int NOT NULL,
    currency           char(3) NOT NULL,
    failure_code       text,
    attempt_count      int NOT NULL DEFAULT 1,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_customer ON payments(customer_id, created_at);

CREATE TABLE refunds (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id         uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    psp_refund_id      text UNIQUE,
    amount_minor       int NOT NULL,
    reason             text,
    created_by         uuid,                              -- admin_users.id
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- Idempotent webhook ingestion (Stripe etc.)
CREATE TABLE webhook_events (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider           text NOT NULL DEFAULT 'stripe',
    provider_event_id  text NOT NULL,
    type               text NOT NULL,
    payload            jsonb NOT NULL,
    processed_at       timestamptz,
    received_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_event_id)
);

-- =====================================================================
-- CONTENT (Mandarin item canonical + 4-way glosses)
-- =====================================================================

CREATE TABLE hsk_levels (
    level              int PRIMARY KEY,                   -- 1..9 (HSK 3.0)
    stage              text NOT NULL,                     -- Elementary/Intermediate/Advanced
    cumulative_vocab   int
);

CREATE TABLE mandarin_items (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hanzi              text NOT NULL,
    pinyin             text NOT NULL,
    audio_url          text,                              -- shared native audio (CDN)
    hsk_level          int NOT NULL REFERENCES hsk_levels(level),
    part_of_speech     text,
    is_published       boolean NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_hsk ON mandarin_items(hsk_level);

CREATE TABLE item_glosses (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id            uuid NOT NULL REFERENCES mandarin_items(id) ON DELETE CASCADE,
    language_code      varchar(8) NOT NULL REFERENCES languages(code),
    gloss              text NOT NULL,                     -- short translation
    explanation        text,                              -- grammar/usage note
    example_sentence   text,
    UNIQUE (item_id, language_code)
);
-- App-level publish gate: an item may publish only when it has a gloss
-- for every languages.is_learner_facing = true (enforce in service + a check job).

CREATE TABLE courses (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hsk_level          int NOT NULL REFERENCES hsk_levels(level),
    title_key          text NOT NULL,                     -- i18n key
    sort_order         int NOT NULL DEFAULT 0,
    is_published       boolean NOT NULL DEFAULT false
);

CREATE TABLE skills (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title_key          text NOT NULL,
    icon               text,
    sort_order         int NOT NULL DEFAULT 0
);

CREATE TABLE lessons (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id           uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    title_key          text NOT NULL,
    lesson_type        text NOT NULL,                     -- vocab/listening/reading/tone/character/sentence
    sort_order         int NOT NULL DEFAULT 0,
    est_minutes        int NOT NULL DEFAULT 7,
    is_premium         boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_lessons_skill ON lessons(skill_id);

CREATE TABLE lesson_items (
    lesson_id          uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    item_id            uuid NOT NULL REFERENCES mandarin_items(id) ON DELETE CASCADE,
    sort_order         int NOT NULL DEFAULT 0,
    PRIMARY KEY (lesson_id, item_id)
);

-- =====================================================================
-- LEARNING & PROGRESS
-- =====================================================================

CREATE TABLE enrollments (
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id          uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE lesson_progress (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id          uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    state              lesson_state NOT NULL DEFAULT 'not_started',
    score              numeric(5,2),
    completed_at       timestamptz,
    updated_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_progress_user ON lesson_progress(user_id, lesson_id);

CREATE TABLE srs_cards (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id            uuid NOT NULL REFERENCES mandarin_items(id) ON DELETE CASCADE,
    ease               numeric(4,2) NOT NULL DEFAULT 2.50,
    interval_days      int NOT NULL DEFAULT 0,
    reps               int NOT NULL DEFAULT 0,
    lapses             int NOT NULL DEFAULT 0,
    due_at             timestamptz NOT NULL DEFAULT now(),
    last_reviewed_at   timestamptz,
    UNIQUE (user_id, item_id)
);
CREATE INDEX idx_srs_due ON srs_cards(user_id, due_at);

CREATE TABLE srs_reviews (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id            uuid NOT NULL REFERENCES srs_cards(id) ON DELETE CASCADE,
    grade              int NOT NULL,                      -- 0..5 (SM-2 style)
    reviewed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE xp_ledger (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount             int NOT NULL,
    reason             text NOT NULL,                     -- lesson_complete/streak/exam
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_xp_user ON xp_ledger(user_id, created_at);

CREATE TABLE streaks (
    user_id            uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_count      int NOT NULL DEFAULT 0,
    longest_count      int NOT NULL DEFAULT 0,
    last_active_date   date
);

CREATE TABLE daily_goals (
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_date          date NOT NULL,
    target_minutes     int NOT NULL DEFAULT 10,
    completed_minutes  int NOT NULL DEFAULT 0,
    met                boolean NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, goal_date)
);

-- =====================================================================
-- HSK PREP
-- =====================================================================

CREATE TABLE mock_exams (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hsk_level          int NOT NULL REFERENCES hsk_levels(level),
    title_key          text NOT NULL,
    duration_minutes   int NOT NULL,
    structure          jsonb NOT NULL,                    -- sections/items spec
    is_published       boolean NOT NULL DEFAULT false
);

CREATE TABLE mock_exam_attempts (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mock_exam_id       uuid NOT NULL REFERENCES mock_exams(id),
    state              exam_state NOT NULL DEFAULT 'in_progress',
    score              numeric(5,2),
    started_at         timestamptz NOT NULL DEFAULT now(),
    submitted_at       timestamptz,
    answers            jsonb
);
CREATE INDEX idx_exam_attempts_user ON mock_exam_attempts(user_id);

CREATE TABLE readiness_scores (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estimated_level    int REFERENCES hsk_levels(level),
    readiness_pct      numeric(5,2),
    computed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_plans (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_level       int NOT NULL REFERENCES hsk_levels(level),
    exam_date          date,
    created_at         timestamptz NOT NULL DEFAULT now(),
    is_active          boolean NOT NULL DEFAULT true
);

CREATE TABLE study_plan_tasks (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_plan_id      uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    due_date           date NOT NULL,
    description_key    text NOT NULL,
    lesson_id          uuid REFERENCES lessons(id) ON DELETE SET NULL,
    is_done            boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_plan_tasks ON study_plan_tasks(study_plan_id, due_date);

-- =====================================================================
-- ENGAGEMENT
-- =====================================================================

CREATE TABLE notifications (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel            notif_channel NOT NULL,
    template_key       text NOT NULL,                     -- localized template id
    language_code      varchar(8) NOT NULL REFERENCES languages(code),
    payload            jsonb,
    status             notif_status NOT NULL DEFAULT 'scheduled',
    send_at            timestamptz NOT NULL,
    sent_at            timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_due ON notifications(status, send_at);
CREATE INDEX idx_notif_user ON notifications(user_id);

CREATE TABLE notification_prefs (
    user_id            uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled      boolean NOT NULL DEFAULT true,
    push_enabled       boolean NOT NULL DEFAULT true,
    reminder_hour      int NOT NULL DEFAULT 19,           -- local hour
    marketing_opt_in   boolean NOT NULL DEFAULT false
);

-- =====================================================================
-- OPS & ANALYTICS
-- =====================================================================

CREATE TABLE admin_users (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email              citext UNIQUE NOT NULL,
    role               text NOT NULL DEFAULT 'support',   -- support/billing/content/admin
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_admin_id     uuid REFERENCES admin_users(id),
    action             text NOT NULL,
    entity_type        text,
    entity_id          uuid,
    metadata           jsonb,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
    id                 bigserial PRIMARY KEY,
    user_id            uuid REFERENCES users(id) ON DELETE SET NULL,
    name               text NOT NULL,                     -- e.g. trial_started, lesson_completed
    properties         jsonb,
    occurred_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_name_time ON analytics_events(name, occurred_at);

-- ---------- seed: languages & HSK levels ----------
INSERT INTO languages (code, name, native_name, is_learner_facing) VALUES
    ('en','English','English',true),
    ('th','Thai','ไทย',true),
    ('vi','Vietnamese','Tiếng Việt',true),
    ('ms','Malay','Bahasa Melayu',true),
    ('zh','Chinese (source)','中文',false);

INSERT INTO hsk_levels (level, stage, cumulative_vocab) VALUES
    (1,'Elementary',300),(2,'Elementary',500),(3,'Elementary',1000),
    (4,'Intermediate',2000),(5,'Intermediate',3600),(6,'Intermediate',5400),
    (7,'Advanced',11000),(8,'Advanced',11000),(9,'Advanced',11000);
