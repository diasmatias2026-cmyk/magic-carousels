import { endpoint, HttpError } from "@/lib/http";
import { verifyWebhook } from "@/lib/rules";
import { syncPayment } from "@/lib/billing";
export const POST = endpoint(async (req) => {
  const q = new URL(req.url).searchParams;
  const id = q.get("data.id") || "";
  if (
    !verifyWebhook(
      id,
      req.headers.get("x-request-id") || "",
      req.headers.get("x-signature") || "",
      process.env.MERCADOPAGO_WEBHOOK_SECRET || "",
    )
  )
    throw new HttpError(401, "Assinatura inválida.");
  if (q.get("type") && q.get("type") !== "payment") return { ok: true };
  await syncPayment(id);
  return { ok: true };
});
