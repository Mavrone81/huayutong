-- =====================================================================
-- 0003 — Append-only audit log + trial-days default
-- Apply:  psql "$DATABASE_URL" -f db/migrations/0003_audit_immutable_and_defaults.sql
-- Idempotent and safe to re-run.
-- =====================================================================

-- Align the schema default with the 1-month trial (PRD §5.3). Seeded plans
-- already set 30; this only affects future inserts that omit trial_days.
ALTER TABLE plans ALTER COLUMN trial_days SET DEFAULT 30;

-- Make audit_logs immutable: reject UPDATE/DELETE at the database level (PRD §5.9).
CREATE OR REPLACE FUNCTION audit_logs_no_mutate() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_no_mutate();
