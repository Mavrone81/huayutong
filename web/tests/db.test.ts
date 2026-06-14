import { test, after } from "node:test";
import assert from "node:assert/strict";
import { query, one, pool } from "../src/server/db";
import { getEntitlement } from "../src/server/entitlement";
import { getReadiness, HskError } from "../src/server/hskprep";
import { reviewCard } from "../src/server/learning";

// Integration tests against a real Postgres (schema + seeds loaded). Skipped when
// DATABASE_URL is unset so `npm test` still runs the unit suite locally.
const skip = process.env.DATABASE_URL ? false : "DATABASE_URL not set";

// One shared pg pool for the file; close it once so the process can exit.
after(async () => {
  await pool.end();
});

test("entitlement is time-bounded and HSK prep is premium-gated", { skip }, async () => {
  const rnd = Math.random().toString(36).slice(2, 8);
  const u = (await one<{ id: string }>(`INSERT INTO users (email, status, ui_language) VALUES ($1,'active','en') RETURNING id`, [`it-${rnd}@x.com`]))!;
  const cust = (await one<{ id: string }>(`INSERT INTO customers (user_id, default_currency) VALUES ($1,'USD') RETURNING id`, [u.id]))!;
  const plan = (await one<{ id: string }>(`INSERT INTO plans (code, name, interval, trial_days) VALUES ($1,'IT','month',30) RETURNING id`, [`it_${rnd}`]))!;
  const sub = (await one<{ id: string }>(
    `INSERT INTO subscriptions (customer_id, plan_id, status, currency, trial_started_at, trial_ends_at, current_period_start, current_period_end)
     VALUES ($1,$2,'trialing','USD', now(), now() + interval '5 days', now(), now() + interval '35 days') RETURNING id`,
    [cust.id, plan.id]
  ))!;

  // Active trial → premium.
  assert.equal((await getEntitlement(u.id)).tier, "premium");

  // Expired trial → free (even though the cron hasn't reconciled the row).
  await query(`UPDATE subscriptions SET trial_ends_at = now() - interval '1 day' WHERE id = $1`, [sub.id]);
  assert.equal((await getEntitlement(u.id)).tier, "free");

  // past_due within grace → premium; beyond grace → free.
  await query(`UPDATE subscriptions SET status='past_due', current_period_end = now() - interval '1 day' WHERE id = $1`, [sub.id]);
  assert.equal((await getEntitlement(u.id)).tier, "premium");
  await query(`UPDATE subscriptions SET current_period_end = now() - interval '60 days' WHERE id = $1`, [sub.id]);
  assert.equal((await getEntitlement(u.id)).tier, "free");

  // HSK prep is gated for free users.
  await assert.rejects(() => getReadiness(u.id), (e: unknown) => e instanceof HskError && (e as any).status === 402);

  await query(`DELETE FROM users WHERE id = $1`, [u.id]); // cascades customer/subscription
  await query(`DELETE FROM plans WHERE id = $1`, [plan.id]);
});

test("SRS scheduling advances on good grades and lapses on bad", { skip }, async () => {
  const rnd = Math.random().toString(36).slice(2, 8);
  const u = (await one<{ id: string }>(`INSERT INTO users (email, status, ui_language) VALUES ($1,'active','en') RETURNING id`, [`srs-${rnd}@x.com`]))!;
  const item = (await one<{ id: string }>(`INSERT INTO mandarin_items (hanzi, pinyin, hsk_level, is_published) VALUES ('好','hǎo',1,true) RETURNING id`))!;
  const card = (await one<{ id: string }>(`INSERT INTO srs_cards (user_id, item_id, due_at) VALUES ($1,$2, now()) RETURNING id`, [u.id, item.id]))!;

  const r1 = await reviewCard(u.id, card.id, 5);
  assert.equal(r1.reps, 1);
  assert.ok(r1.intervalDays >= 1);
  const r2 = await reviewCard(u.id, card.id, 5);
  assert.equal(r2.reps, 2);
  const r3 = await reviewCard(u.id, card.id, 1); // lapse resets reps
  assert.equal(r3.reps, 0);

  await query(`DELETE FROM users WHERE id = $1`, [u.id]);
  await query(`DELETE FROM mandarin_items WHERE id = $1`, [item.id]);
});
