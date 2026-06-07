-- Plans & prices seed (PHP, PayMongo). Idempotent.
INSERT INTO plans (code, name, interval, trial_days) VALUES
  ('free',            'Free',            NULL,    0),
  ('premium_monthly', 'Premium Monthly', 'month', 30),
  ('premium_annual',  'Premium Annual',  'year',  30)
ON CONFLICT (code) DO NOTHING;

-- Amounts in centavos. ₱299.00 / month, ₱1,999.00 / year (placeholders).
INSERT INTO prices (plan_id, currency, amount_minor)
SELECT id, 'PHP', 29900 FROM plans WHERE code = 'premium_monthly'
ON CONFLICT (plan_id, currency) DO NOTHING;

INSERT INTO prices (plan_id, currency, amount_minor)
SELECT id, 'PHP', 199900 FROM plans WHERE code = 'premium_annual'
ON CONFLICT (plan_id, currency) DO NOTHING;

-- A back-office admin user (for the admin console RBAC narrative).
INSERT INTO admin_users (email, role) VALUES ('ops@mandamix.com', 'ops_admin')
ON CONFLICT (email) DO NOTHING;
