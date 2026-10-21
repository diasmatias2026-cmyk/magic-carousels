import { password as validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";
import { database } from "@/lib/db";
import { body, check, endpoint, HttpError, limit, text } from "@/lib/http";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
export const POST = async (req: Request) => {
  let token: string | undefined;
  const result = await endpoint(async (req) => {
    await limit(req, "login", 10, 900);
    const b = await body(req);
    const email = text(b.email, 3, 254, "E-mail").toLowerCase();
    const pass = validatePassword(b.password, 1);
    await limit(req, "login-account", 10, 900, email);
    const r = await database()
      .from("app_users")
      .select("id,password_hash")
      .eq("email", email)
      .maybeSingle();
    check(r.error);
    const valid = await bcrypt.compare(
      pass,
      r.data?.password_hash ||
        "$2b$12$eImiTXuWVxfM37uY4JANjQeZlFi83ZbQMIzU0z2jP7ZLEUo3zkL2e",
    );
    if (!r.data || !valid)
      throw new HttpError(401, "E-mail ou senha incorretos.");
    token = await signSession(r.data.id);
    return { ok: true };
  })(req);
  if (token) result.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return result;
};
