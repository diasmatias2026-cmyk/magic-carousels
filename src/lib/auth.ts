import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getCurrentUser() {
  const store = await cookies();
  const uid = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  return db.user.findUnique({ where: { id: uid }, include: { brandKit: true } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
