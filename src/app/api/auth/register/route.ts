import { password as validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";
import { body, endpoint, HttpError, limit, text } from "@/lib/http";
import { database } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
export const POST = async (req: Request) => {
  let token: string | undefined;
  const result = await endpoint(async (req) => {
    await limit(req, "register", 30, 900);
    const b = await body(req);
    const name = text(b.name, 2, 100, "Nome");
    const email = text(b.email, 3, 254, "E-mail").toLowerCase();
    const pass = validatePassword(b.password, 6);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpError(400, "E-mail inválido.");
    if (b.acceptTerms !== true)
      throw new HttpError(400, "Leia e aceite os Termos de Uso.");
    const isAdminEmail =
      email === "suporte.splinkagencia@gmail.com" ||
      email === "matias.splink@gmail.com" ||
      email === "marcomatias@gmail.com" ||
      email.endsWith("@splinkagencia.com");

    const r = await database()
      .from("app_users")
      .insert({
        name,
        email,
        password_hash: await bcrypt.hash(pass, 12),
        terms_version: "2026-10-21",
        plan: isAdminEmail ? "LIFETIME" : "FREE",
      })
      .select("id")
      .single();
    if (
      r.error?.code === "23505" ||
      r.error?.message?.toLowerCase().includes("unique") ||
      r.error?.message?.toLowerCase().includes("duplicate")
    ) {
      throw new HttpError(
        409,
        "Este e-mail já está cadastrado. Clique em 'Entrar na Conta' para fazer login.",
      );
    }
    if (r.error) {
      console.error("Erro no cadastro:", r.error);
      throw new HttpError(
        400,
        `Erro no banco de dados (${r.error.code || "db"}): ${r.error.message || "Não foi possível cadastrar."}`,
      );
    }

    if (!r.data?.id) {
      throw new HttpError(500, "Não foi possível confirmar criação do usuário.");
    }

    if (isAdminEmail) {
      try {
        await database().from("admin_account").upsert({ user_id: r.data.id });
      } catch (err) {
        console.warn("Falha ao registrar admin_account:", err);
      }
    }

    // Inicializar BrandKit padrão do usuário
    const handle = email
      .split("@")[0]
      .replace(/[^a-z0-9_.]/g, "")
      .slice(0, 24);
    try {
      await database().from("brand_kits").upsert({
        user_id: r.data.id,
        data: { displayName: name, handle: handle || "meuperfil", avatarUrl: null },
      });
    } catch {
      // ignora falha não-crítica de brand kit
    }

    token = await signSession(r.data!.id);
    return { ok: true };
  })(req);
  if (token) result.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return result;
};
