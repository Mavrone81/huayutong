-- =====================================================================
-- 0002 — Trial verification, anti-abuse, dunning & tax support
-- Apply to the production DB BEFORE (or together with) deploying the
-- matching app version:  psql "$DATABASE_URL" -f db/migrations/0002_trial_billing_compliance.sql
-- All statements are additive and idempotent (safe to re-run).
-- The app degrades gracefully if these are not yet applied, but the
-- verification and card-fingerprint anti-abuse features require them.
-- =====================================================================

-- #5 Email/phone verification + password-reset tokens (hashed, expiring).
CREATE TABLE IF NOT EXISTS verification_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose     text NOT NULL,                 -- 'email_verify' | 'password_reset'
    token_hash  text NOT NULL,
    expires_at  timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verif_lookup ON verification_tokens(token_hash, purpose);
CREATE INDEX IF NOT EXISTS idx_verif_user   ON verification_tokens(user_id, purpose);

-- #6 Card-fingerprint anti-abuse (one free trial per payment instrument).
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE INDEX IF NOT EXISTS idx_pm_fingerprint ON payment_methods(fingerprint);
