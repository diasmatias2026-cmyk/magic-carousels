import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshPayment } from "@/lib/billing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");

  if (!paymentId && !orderId) {
    return NextResponse.json({ error: "Informe paymentId ou orderId" }, { status: 400 });
  }

  let payment = paymentId
    ? await db.payment.findUnique({ where: { id: paymentId } })
    : await db.payment.findUnique({ where: { orderId: orderId! } });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  if (payment.status === "pending") {
    payment = (await refreshPayment(payment.id)) ?? payment;
  }

  return NextResponse.json({
    id: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    paidAt: payment.paidAt,
  });
}
