import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { check, endpoint, HttpError, limit } from "@/lib/http";
import { checkout } from "@/lib/mercadopago";
import { PRICE_CENTS } from "@/lib/pricing";
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  if (u.plan === "LIFETIME")
    throw new HttpError(409, "Seu acesso já está ativo.");
  await limit(req, "checkout", 3, 300, u.id);
  const db = database();
  const existing = await db
    .from("payments")
    .select("id,checkout_url")
    .eq("user_id", u.id)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 3600000).toISOString())
    .not("checkout_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  check(existing.error);
  if (existing.data)
    return { id: existing.data.id, url: existing.data.checkout_url };
  const r = await db
    .from("payments")
    .insert({ user_id: u.id, amount: PRICE_CENTS })
    .select("id")
    .single();
  check(r.error);
  const p = await checkout(r.data!.id, u.email, PRICE_CENTS);
  if (!p.init_point) throw new HttpError(502, "Checkout indisponível.");
  const save = await db
    .from("payments")
    .update({ preference_id: p.id, checkout_url: p.init_point })
    .eq("id", r.data!.id);
  check(save.error);
  return { id: r.data!.id, url: p.init_point };
});
