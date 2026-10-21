import { password as validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";
import { body, check, endpoint, HttpError, limit, text } from "@/lib/http";
import { database } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
export const POST = async (req: Request) => {
  let token: string | undefined;
  const result = await endpoint(async (req) => {
    await limit(req, "register", 5, 3600);
    const b = await body(req);
    const name = text(b.name, 2, 100, "Nome");
    const email = text(b.email, 3, 254, "E-mail").toLowerCase();
    const pass = validatePassword(b.password);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpError(400, "E-mail inválido.");
    if (b.acceptTerms !== true)
      throw new HttpError(400, "Leia e aceite os Termos de Uso.");
    const r = await database()
      .from("app_users")
      .insert({
        name,
        email,
        password_hash: await bcrypt.hash(pass, 12),
        terms_version: "2026-10-21",
      })
      .select("id")
      .single();
    if (r.error?.code === "23505")
      throw new HttpError(
        409,
        "Não foi possível cadastrar. Se já possui conta, entre.",
      );
    check(r.error);
    token = await signSession(r.data!.id);
    return { ok: true };
  })(req);
  if (token) result.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return result;
};
