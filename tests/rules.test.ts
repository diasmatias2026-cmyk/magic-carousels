import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhook, paymentStatus } from "../src/lib/rules";
test("assinatura válida, adulteração e expiração", () => {
  const now = Date.now();
  const id = "123";
  const rid = "request";
  const secret = "test-only";
  const mac = createHmac("sha256", secret)
    .update(`id:${id};request-id:${rid};ts:${now};`)
    .digest("hex");
  const sig = `ts=${now},v1=${mac}`;
  assert.equal(verifyWebhook(id, rid, sig, secret, now), true);
  assert.equal(verifyWebhook("124", rid, sig, secret, now), false);
  assert.equal(verifyWebhook(id, rid, sig, secret, now + 300001), false);
  assert.equal(verifyWebhook(id, rid, sig, "", now), false);
  assert.equal(verifyWebhook(id, rid, "ts=abc,v1=bad", secret, now), false);
});
test("somente aprovado libera acesso", () => {
  assert.equal(paymentStatus("approved"), "paid");
  assert.equal(paymentStatus("in_process"), "pending");
  assert.equal(paymentStatus("refunded"), "refunded");
  assert.equal(paymentStatus("charged_back"), "charged_back");
  assert.equal(paymentStatus("unknown"), "pending");
});
