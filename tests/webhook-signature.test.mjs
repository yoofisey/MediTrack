import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyFastSpringSignature,
  fastspringCountryStatus,
} from "../lib/payments-server.ts";

function sign(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("base64");
}

test("accepts a valid base64 HMAC-SHA256 signature", () => {
  const body = JSON.stringify({ event: "order.completed", data: { total: 100 } });
  const secret = "s3cr3t";
  const sig = sign(body, secret);
  assert.equal(verifyFastSpringSignature(body, sig, secret), true);
});

test("rejects a tampered body", () => {
  const body = JSON.stringify({ event: "order.completed", data: { total: 100 } });
  const tampered = JSON.stringify({ event: "order.completed", data: { total: 999 } });
  const secret = "s3cr3t";
  const sig = sign(body, secret);
  assert.equal(verifyFastSpringSignature(tampered, sig, secret), false);
});

test("rejects with the wrong secret", () => {
  const body = "payload";
  const sig = sign(body, "right-secret");
  assert.equal(verifyFastSpringSignature(body, sig, "wrong-secret"), false);
});

test("fails closed on empty signature or secret", () => {
  const body = "payload";
  const sig = sign(body, "s3cr3t");
  assert.equal(verifyFastSpringSignature(body, "", "s3cr3t"), false);
  assert.equal(verifyFastSpringSignature(body, sig, ""), false);
  assert.equal(verifyFastSpringSignature(body, "", ""), false);
});

test("hex-encoded legacy signatures are rejected (we moved to base64)", () => {
  const body = "payload";
  const secret = "s3cr3t";
  const hex = crypto.createHmac("sha256", secret).update(body).digest("hex");
  // FastSpring sends base64; the old implementation compared hex. Ensure the
  // current base64 check does not accidentally accept the hex form.
  assert.equal(verifyFastSpringSignature(body, hex, secret), false);
});

// ---- fastspringCountryStatus -------------------------------------------------

test("paystack countries route to Paystack", () => {
  ["GH", "ng", "ZA", "KE"].forEach(c => {
    assert.equal(fastspringCountryStatus(c), "paystack");
  });
});

test("blocklisted countries are blocked", () => {
  ["CU", "IR", "KP", "RU", "SY"].forEach(c => {
    assert.equal(fastspringCountryStatus(c), "blocked");
  });
});

test("non-blocked non-paystack country goes fastspring", () => {
  assert.equal(fastspringCountryStatus("US"), "fastspring");
  assert.equal(fastspringCountryStatus("TG"), "fastspring");
});