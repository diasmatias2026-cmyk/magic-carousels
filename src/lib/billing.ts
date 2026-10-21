import "server-only";
import { getMercadoPagoPayment } from "./mercadopago";
import { database } from "./db";
import { check, HttpError } from "./http";
import { paymentStatus } from "./rules";
export async function syncPayment(id: string) {
  if (!/^\d{1,30}$/.test(id)) throw new HttpError(400, "Pagamento inválido.");
  const p = await getMercadoPagoPayment(id);
  if (!p.external_reference || p.currency_id !== "BRL")
    throw new HttpError(400, "Pagamento não corresponde a um pedido.");
  if (
    process.env.MERCADOPAGO_COLLECTOR_ID &&
    String(p.collector_id) !== process.env.MERCADOPAGO_COLLECTOR_ID
  )
    throw new HttpError(400, "Recebedor inválido.");
  if (process.env.NODE_ENV === "production" && p.live_mode !== true)
    throw new HttpError(400, "Pagamento de teste não libera produção.");
  const amount = Math.round(Number(p.transaction_amount) * 100);
  const r = await database().rpc("app_apply_payment", {
    p_order: p.external_reference,
    p_payment: String(p.id),
    p_status: paymentStatus(p.status || ""),
    p_amount: amount,
  });
  check(r.error);
  return p.external_reference;
}
