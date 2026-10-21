import "server-only";
import { cookies } from "next/headers";
import { database } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
import { check, HttpError } from "./http";
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  freeTrialsUsed: number;
  isAdmin: boolean;
  brandKit: Record<string, unknown> | null;
}
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const uid = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const db = database();
  const [u, a, b] = await Promise.all([
    db
      .from("app_users")
      .select("id,name,email,plan,free_trials_used")
      .eq("id", uid)
      .maybeSingle(),
    db.from("admin_account").select("user_id").eq("user_id", uid).maybeSingle(),
    db.from("brand_kits").select("data").eq("user_id", uid).maybeSingle(),
  ]);
  check(u.error);
  check(a.error);
  check(b.error);
  if (!u.data) return null;
  return {
    ...u.data,
    freeTrialsUsed: u.data.free_trials_used,
    isAdmin: !!a.data,
    brandKit: b.data?.data || null,
  } as CurrentUser;
}
export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, "Entre na sua conta para continuar.");
  return u;
}
export async function requireAdmin() {
  const u = await requireUser();
  if (!u.isAdmin) throw new HttpError(403, "Acesso restrito.");
  return u;
}
