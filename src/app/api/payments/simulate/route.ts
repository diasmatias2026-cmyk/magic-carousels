import { NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/billing";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { paymentId, orderId } = (await req.json().catch(() => ({}))) as Record<string, string>;
    if (!paymentId && !orderId) {
      return NextResponse.json({ error: "Informe paymentId ou orderId" }, { status: 400 });
    }

    const payment = paymentId
      ? await db.payment.findUnique({ where: { id: paymentId } })
      : await db.payment.findUnique({ where: { orderId: orderId! } });

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    const updated = await markPaymentPaid(payment.id, { simulatedBy: "user_dev_action" });

    return NextResponse.json({
      success: true,
      message: "Pagamento simulado com sucesso! Plano Vitalício ativado.",
      payment: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao simular" },
      { status: 500 }
    );
  }
}
