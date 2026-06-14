import { test } from "node:test";
import assert from "node:assert/strict";
import { splitInclusive, taxRateBps, resolveCountry } from "../src/server/tax";
import { addInterval, USD } from "../src/server/billing";
import { hashPassword, verifyPassword, signAccess, verifyAccess } from "../src/server/auth";

test("tax: inclusive split extracts VAT and preserves the gross", () => {
  const { subtotalMinor, taxMinor } = splitInclusive(599, taxRateBps("TH")); // 7%
  assert.equal(subtotalMinor + taxMinor, 599);
  assert.ok(taxMinor > 0);
  assert.equal(taxMinor, 599 - Math.round((599 * 10000) / 10700));
});

test("tax: zero-rate market keeps the full gross", () => {
  assert.deepEqual(splitInclusive(599, taxRateBps("US")), { subtotalMinor: 599, taxMinor: 0 });
});

test("tax: resolveCountry prefers billing, then language, then home entity", () => {
  assert.equal(resolveCountry("th", "en"), "TH");
  assert.equal(resolveCountry(null, "vi"), "VN");
  assert.equal(resolveCountry(null, null), "SG");
});

test("billing: addInterval advances and USD formats", () => {
  const base = new Date("2026-01-15T00:00:00Z");
  assert.equal(addInterval(base, "month").getUTCMonth(), 1); // Feb
  assert.equal(addInterval(base, "year").getUTCFullYear(), 2027);
  assert.equal(USD(599), "$5.99");
  assert.equal(USD(4499), "$44.99");
});

test("auth: password hash verifies and rejects wrong input", () => {
  const h = hashPassword("supersecret");
  assert.ok(verifyPassword("supersecret", h));
  assert.ok(!verifyPassword("wrong", h));
});

test("auth: JWT round-trips and rejects tampering", () => {
  const token = signAccess("user-123");
  assert.equal(verifyAccess(token), "user-123");
  assert.equal(verifyAccess(token + "x"), null);
  assert.equal(verifyAccess("not.a.jwt"), null);
});
