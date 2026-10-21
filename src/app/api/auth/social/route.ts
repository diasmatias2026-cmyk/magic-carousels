import { database } from "@/lib/db";
import { body, check, endpoint, HttpError, limit } from "@/lib/http";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export const POST = async (req: Request) => {
  let token: string | undefined;
  const result = await endpoint(async (req) => {
    await limit(req, "social-login", 15, 60);
    const b = await body(req);
    const credential =
      typeof b.credential === "string" ? b.credential.trim() : "";

    if (!credential) {
      throw new HttpError(400, "Credencial do Google não informada.");
    }

    // Verificação oficial do token ID com a API do Google
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store" },
    );

    if (!verifyRes.ok) {
      throw new HttpError(401, "Token do Google inválido ou expirado.");
    }

    const payload = await verifyRes.json();
    const email =
      typeof payload.email === "string" ? payload.email.toLowerCase().trim() : "";
    const emailVerified =
      payload.email_verified === "true" || payload.email_verified === true;
    const name =
      (typeof payload.name === "string" && payload.name.trim()) ||
      email.split("@")[0] ||
      "Usuário Google";
    const picture = typeof payload.picture === "string" ? payload.picture : null;

    if (!email || !emailVerified) {
      throw new HttpError(400, "E-mail não verificado pelo Google.");
    }

    // Validação opcional de Client ID se fornecido no ambiente
    const expectedClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      throw new HttpError(401, "Token emitido para um Client ID divergente.");
    }

    const db = database();

    // Localiza conta existente pelo e-mail
    const existing = await db
      .from("app_users")
      .select("id,name,email,plan,free_trials_used")
      .eq("email", email)
      .maybeSingle();

    check(existing.error);

    let userId: string;

    if (!existing.data) {
      // Cria novo usuário cadastrado via Google
      const randomPass = randomBytes(24).toString("hex");
      const passHash = await bcrypt.hash(randomPass, 10);

      const insertRes = await db
        .from("app_users")
        .insert({
          name: name.slice(0, 100),
          email,
          password_hash: passHash,
          terms_version: "2026-10-21",
        })
        .select("id")
        .single();

      check(insertRes.error);
      userId = insertRes.data!.id;

      // Salva o brand kit padrão com a foto de perfil do Google
      if (picture) {
        try {
          const handle = email
            .split("@")[0]
            .replace(/[^a-z0-9_.]/g, "")
            .slice(0, 24);
          await db
            .from("brand_kits")
            .upsert({
              user_id: userId,
              data: {
                avatarUrl: picture,
                displayName: name,
                handle: handle || "meuperfil",
              },
            });
        } catch {
          // ignora falha secundária de brand kit
        }
      }
    } else {
      userId = existing.data.id;

      // Se o usuário ainda não tiver foto no BrandKit, aplica a do Google
      if (picture) {
        try {
          const bk = await db
            .from("brand_kits")
            .select("data")
            .eq("user_id", userId)
            .maybeSingle();

          const currentData = (bk.data?.data as Record<string, unknown>) || {};
          if (!currentData.avatarUrl) {
            await db
              .from("brand_kits")
              .upsert({
                user_id: userId,
                data: { ...currentData, avatarUrl: picture },
              });
          }
        } catch {
          // ignora falha secundária de foto
        }
      }
    }

    token = await signSession(userId);
    return { ok: true, email };
  })(req);

  if (token) {
    result.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  }
  return result;
};
