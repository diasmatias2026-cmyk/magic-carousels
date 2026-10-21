import "server-only";
import { db } from "./db";
import { getOrder, mapStatus, paymentMode, type PagarmeOrder } from "./pagarme";

/** Marca pagamento como pago e libera o plano vitalício (idempotente). */
export async function markPaymentPaid(paymentId: string, raw?: unknown) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;
  if (payment.status === "paid") return payment;

  const [updated] = await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: { status: "paid", paidAt: new Date(), raw: raw ? JSON.stringify(raw).slice(0, 20000) : payment.raw },
    }),
    db.user.update({ where: { id: payment.userId }, data: { plan: "LIFETIME", planSince: new Date() } }),
  ]);
  return updated;
}

/** Aplica o estado de um pedido Pagar.me no pagamento local. */
export async function applyOrder(order: PagarmeOrder) {
  const payment = await db.payment.findUnique({ where: { orderId: order.id } });
  if (!payment) return null;
  const status = mapStatus(order);
  if (status === "paid") return markPaymentPaid(payment.id, order);
  if (status !== payment.status) {
    return db.payment.update({
      where: { id: payment.id },
      data: { status, raw: JSON.stringify(order).slice(0, 20000) },
    });
  }
  return payment;
}

/** Consulta o gateway quando o pagamento ainda está pendente (fallback sem webhook). */
export async function refreshPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "pending") return payment;
  if (paymentMode() === "mock" || payment.orderId.startsWith("mock_")) return payment;
  try {
    const order = await getOrder(payment.orderId);
    return (await applyOrder(order)) ?? payment;
  } catch (e) {
    console.error("[pagamento] erro ao consultar pedido", e);
    return payment;
  }
}
