import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyWebhook(
  id: string,
  requestId: string,
  signature: string,
  secret: string,
  now = Date.now(),
) {
  const parts = Object.fromEntries(
    signature.split(",").map((v) => v.trim().split("=")),
  );
  const ts = Number(parts.ts);
  const millis = ts < 1e12 ? ts * 1000 : ts;
  if (
    !secret ||
    !id ||
    !requestId ||
    !Number.isFinite(ts) ||
    Math.abs(now - millis) > 300000 ||
    !/^[a-f0-9]{64}$/i.test(parts.v1 || "")
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}
export function paymentStatus(status: string) {
  return (
    (
      {
        approved: "paid",
        rejected: "failed",
        cancelled: "canceled",
        refunded: "refunded",
        charged_back: "charged_back",
      } as Record<string, string>
    )[status] || "pending"
  );
}
