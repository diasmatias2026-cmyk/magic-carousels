import { NextResponse } from "next/server";
import { applyOrder, markPaymentPaid } from "@/lib/billing";
import { verifyWebhookAuth, type PagarmeOrder } from "@/lib/pagarme";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!verifyWebhookAuth(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Payload vazio" }, { status: 400 });
    }

    const event = String(payload.type || payload.event || "");
    const data = payload.data;

    // Eventos de pedido ou cobrança
    if (event.startsWith("order.") || event.startsWith("charge.")) {
      const orderId = data?.order?.id || data?.id;
      if (orderId) {
        const payment = await db.payment.findUnique({ where: { orderId } });
        if (payment) {
          if (event === "order.paid" || event === "charge.paid") {
            await markPaymentPaid(payment.id, payload);
          } else {
            await applyOrder(data as PagarmeOrder);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[webhook/pagarme] erro:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
