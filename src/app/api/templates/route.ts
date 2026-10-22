import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import {
  body,
  check,
  endpoint,
  limit,
  text,
  uuid,
  HttpError,
} from "@/lib/http";
import { appearance } from "@/lib/validation";
export const GET = endpoint(async () => {
  const u = await requireUser();
  const r = await database()
    .from("custom_templates")
    .select("id,data")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false })
    .limit(100);
  check(r.error);
  return { items: r.data };
});
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  if (u.plan !== "LIFETIME") {
    throw new HttpError(
      402,
      "O estúdio de templates personalizados é exclusivo do plano Vitalício."
    );
  }
  await limit(req, "template", 10, 60, u.id);
  const b = await body(req, 1500000);
  const count = await database()
    .from("custom_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", u.id);
  check(count.error);
  if ((count.count || 0) >= 100)
    throw new HttpError(409, "Limite de 100 estilos salvos.");
  const r = await database()
    .from("custom_templates")
    .insert({
      user_id: u.id,
      data: {
        name: text(b.name, 2, 60, "Nome"),
        appearance: appearance(b.appearance),
      },
    })
    .select("id,data")
    .single();
  check(r.error);
  return r.data;
});
export const DELETE = endpoint(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const r = await database()
    .from("custom_templates")
    .delete()
    .eq("id", uuid(b.id))
    .eq("user_id", u.id);
  check(r.error);
  return { ok: true };
});
