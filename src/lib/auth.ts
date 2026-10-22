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
  createdAt?: string;
}
const ADMIN_EMAILS = new Set([
  "suporte.splinkagencia@gmail.com",
  "matias.splink@gmail.com",
  "marcomatias@gmail.com",
]);

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const uid = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const db = database();

  const u = await db
    .from("app_users")
    .select("id,name,email,plan,free_trials_used,created_at")
    .eq("id", uid)
    .maybeSingle();

  check(u.error);
  if (!u.data) return null;

  const normalizedEmail = (u.data.email || "").toLowerCase().trim();
  let isAdmin =
    ADMIN_EMAILS.has(normalizedEmail) ||
    normalizedEmail.endsWith("@splinkagencia.com");

  let brandKit: Record<string, unknown> | null = null;

  try {
    const a = await db
      .from("admin_account")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (a?.data) isAdmin = true;
  } catch (err) {
    console.warn("admin_account check:", err);
  }

  try {
    const b = await db
      .from("brand_kits")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();
    if (b?.data?.data) brandKit = b.data.data;
  } catch (err) {
    console.warn("brand_kits check:", err);
  }

  return {
    ...u.data,
    freeTrialsUsed: u.data.free_trials_used,
    createdAt: u.data.created_at,
    isAdmin,
    brandKit,
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
