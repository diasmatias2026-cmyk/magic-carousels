import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMercadoPagoPayment } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // O Mercado Pago pode enviar o ID no query param (?data.id=... ou ?id=...) ou no body ({ data: { id: ... } })
    const dataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      (body.data && typeof body.data === "object" && "id" in body.data ? String((body.data as { id: unknown }).id) : null) ||
      (body.id ? String(body.id) : null);

    const type = url.searchParams.get("type") || (body.type as string) || (body.action as string) || "payment";

    if (!dataId) {
      return NextResponse.json({ ok: true, message: "Sem payment ID para processar" });
    }

    // Se for notificação de pagamento
    if (type.includes("payment")) {
      const paymentData = await getMercadoPagoPayment(dataId);

      const status = paymentData.status; // approved | pending | in_process | rejected | cancelled
      const isApproved = status === "approved";

      console.log(`[Webhook MercadoPago] Payment ID: ${dataId}, Status: ${status}`);

      // Buscar pagamento local associado
      const payment = await db.payment.findFirst({
        where: {
          OR: [
            { orderId: String(dataId) },
            { chargeId: String(dataId) },
          ],
        },
      });

      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: isApproved ? "paid" : status || "pending",
            paidAt: isApproved ? new Date() : payment.paidAt,
            raw: JSON.stringify(paymentData),
          },
        });

        if (isApproved) {
          await db.user.update({
            where: { id: payment.userId },
            data: {
              plan: "LIFETIME",
              planSince: new Date(),
            },
          });
          console.log(`[Webhook MercadoPago] Usuário ${payment.userId} ativado como LIFETIME com sucesso!`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[Webhook MercadoPago] Erro:", err);
    // Sempre responder 200 pro webhook não ficar retentando em loop caso seja erro de payload
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" }, { status: 200 });
  }
}

// Mercado Pago também envia GET para validar se o webhook endpoint existe
export async function GET() {
  return NextResponse.json({ status: "ok", gateway: "mercadopago" });
}
