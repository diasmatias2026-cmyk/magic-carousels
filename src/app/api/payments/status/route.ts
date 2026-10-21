import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { check, endpoint, HttpError, limit, uuid } from "@/lib/http";
import { syncPayment } from "@/lib/billing";
export const GET = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "payment-status", 30, 60, u.id);
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  if (id) {
    const owned = await database()
      .from("payments")
      .select("id")
      .eq("id", uuid(id))
      .eq("user_id", u.id)
      .maybeSingle();
    check(owned.error);
    if (!owned.data) throw new HttpError(404, "Pedido não encontrado.");
  }
  const paymentId = q.get("payment_id");
  if (paymentId) {
    const { getMercadoPagoPayment } = await import("@/lib/mercadopago");
    if (!/^\d{1,30}$/.test(paymentId))
      throw new HttpError(400, "Pagamento inválido.");
    const p = await getMercadoPagoPayment(paymentId);
    const order = await database()
      .from("payments")
      .select("id")
      .eq("id", p.external_reference || "00000000-0000-4000-8000-000000000000")
      .eq("user_id", u.id)
      .maybeSingle();
    check(order.error);
    if (!order.data) throw new HttpError(404, "Pedido não encontrado.");
    await syncPayment(paymentId);
  }
  let query = database()
    .from("payments")
    .select("id,status,amount,created_at")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (id) query = query.eq("id", id);
  const r = await query;
  check(r.error);
  return { items: r.data };
});
