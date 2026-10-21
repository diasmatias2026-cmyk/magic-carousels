import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { body, check, endpoint, HttpError, limit } from "@/lib/http";
import { password } from "@/lib/password";
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "password", 5, 900, u.id);
  const b = await body(req);
  const old = password(b.currentPassword, 1),
    next = password(b.newPassword);
  const db = database();
  const r = await db
    .from("app_users")
    .select("password_hash")
    .eq("id", u.id)
    .single();
  check(r.error);
  if (!(await bcrypt.compare(old, r.data!.password_hash)))
    throw new HttpError(400, "Senha atual incorreta.");
  const update = await db
    .from("app_users")
    .update({ password_hash: await bcrypt.hash(next, 12) })
    .eq("id", u.id);
  check(update.error);
  const revoke = await db.from("app_sessions").delete().eq("user_id", u.id);
  check(revoke.error);
  return { ok: true };
});
