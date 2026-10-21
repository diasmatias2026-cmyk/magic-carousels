import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { database } from "./db";
import { check } from "./http";
export const SESSION_COOKIE = "mc_session";
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 604800,
};
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function signSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const r = await database()
    .from("app_sessions")
    .insert({
      token_hash: tokenHash(token),
      user_id: userId,
      expires_at: new Date(Date.now() + 604800000).toISOString(),
    });
  check(r.error);
  return token;
}
export async function verifySession(token?: string | null) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const r = await database()
    .from("app_sessions")
    .select("user_id")
    .eq("token_hash", tokenHash(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  check(r.error);
  return r.data?.user_id as string | null;
}
export async function revokeSession(token?: string) {
  if (token) {
    const r = await database()
      .from("app_sessions")
      .delete()
      .eq("token_hash", tokenHash(token));
    check(r.error);
  }
}
