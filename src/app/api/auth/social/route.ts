import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "127.0.0.1";
}

export async function POST(req: Request) {
  try {
    const { provider, email, name, avatarUrl } = (await req.json().catch(() => ({}))) as Record<string, string>;
    const cleanProvider = String(provider || "google").toLowerCase();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || (cleanProvider === "apple" ? "Usuário Apple" : "Usuário Google")).trim();
    const ip = getClientIp(req);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "E-mail inválido da conta social." }, { status: 400 });
    }

    // Procura usuário existente
    let user = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { brandKit: true },
    });

    if (!user) {
      // Checa se o IP já atingiu limite de contas gratuitas
      const ipTrack = await db.ipTracking.findUnique({ where: { ipAddress: ip } });
      if (ipTrack && ipTrack.trialsUsed >= 1 && ipTrack.userCount >= 2) {
        return NextResponse.json(
          {
            error: "IP_BLOCKED",
            message: "Este endereço de IP já utilizou a cota de 1 teste gratuito. Ative o plano vitalício para continuar.",
          },
          { status: 403 }
        );
      }

      const defaultHandle = cleanEmail.split("@")[0].replace(/[^a-z0-9_.]/g, "").slice(0, 24) || "meuperfil";

      user = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          provider: cleanProvider,
          signupIp: ip,
          lastIp: ip,
          brandKit: {
            create: {
              displayName: cleanName,
              handle: defaultHandle,
              avatarUrl: avatarUrl || null,
            },
          },
        },
        include: { brandKit: true },
      });

      // Atualiza IP Tracking
      await db.ipTracking.upsert({
        where: { ipAddress: ip },
        update: { userCount: { increment: 1 }, updatedAt: new Date() },
        create: { ipAddress: ip, userCount: 1, trialsUsed: 0 },
      });
    } else {
      // Atualiza último IP
      await db.user.update({
        where: { id: user.id },
        data: { lastIp: ip },
      });
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        freeTrialsUsed: user.freeTrialsUsed,
        brandKit: user.brandKit,
      },
    });

    res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions);
    return res;
  } catch (err) {
    console.error("Social login error:", err);
    return NextResponse.json({ error: "Erro ao processar login social." }, { status: 500 });
  }
}
