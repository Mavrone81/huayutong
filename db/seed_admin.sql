-- Admin auth + per-customer price override. Idempotent.
-- DEV password for all seeded admins below: "admin12345"
ALTER TABLE admin_users   ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_override_minor int;

-- scrypt hash of "admin12345"
INSERT INTO admin_users (email, role, password_hash) VALUES
  ('admin@mandamix.com',   'admin',         'scrypt$461f07a32577fdbf36d17bb00b9fdedf$42d05fd9a51c9bad8886159653f200b1ca6e2f758be9616c59ed832a627a8ce7ad028bdafad10392b2b0a4ffbfe2e9f90b2c9992066219e305cedd213b2a2e45')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;

INSERT INTO admin_users (email, role, password_hash) VALUES
  ('finance@mandamix.com', 'finance_admin', 'scrypt$461f07a32577fdbf36d17bb00b9fdedf$42d05fd9a51c9bad8886159653f200b1ca6e2f758be9616c59ed832a627a8ce7ad028bdafad10392b2b0a4ffbfe2e9f90b2c9992066219e305cedd213b2a2e45')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;

UPDATE admin_users SET password_hash = 'scrypt$461f07a32577fdbf36d17bb00b9fdedf$42d05fd9a51c9bad8886159653f200b1ca6e2f758be9616c59ed832a627a8ce7ad028bdafad10392b2b0a4ffbfe2e9f90b2c9992066219e305cedd213b2a2e45'
WHERE email = 'ops@mandamix.com';
