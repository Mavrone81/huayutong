-- Plans & prices seed (USD). Idempotent.
INSERT INTO plans (code, name, interval, trial_days) VALUES
  ('free',            'Free',            NULL,    0),
  ('premium_monthly', 'Premium Monthly', 'month', 30),
  ('premium_annual',  'Premium Annual',  'year',  30)
ON CONFLICT (code) DO NOTHING;

-- Amounts in cents. $5.99 / month, $44.99 / year.
INSERT INTO prices (plan_id, currency, amount_minor)
SELECT id, 'USD', 599 FROM plans WHERE code = 'premium_monthly'
ON CONFLICT (plan_id, currency) DO NOTHING;

INSERT INTO prices (plan_id, currency, amount_minor)
SELECT id, 'USD', 4499 FROM plans WHERE code = 'premium_annual'
ON CONFLICT (plan_id, currency) DO NOTHING;

-- A back-office admin user (for the admin console RBAC narrative).
INSERT INTO admin_users (email, role) VALUES ('ops@mandamix.com', 'ops_admin')
ON CONFLICT (email) DO NOTHING;
