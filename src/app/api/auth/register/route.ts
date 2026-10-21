import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    const { name, email, password } = (await req.json().catch(() => ({}))) as Record<string, string>;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const ip = getClientIp(req);

    if (!cleanName || cleanName.length < 2) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });

    const exists = await db.user.findUnique({ where: { email: cleanEmail } });
    if (exists) return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });

    // Checagem anti-fraude de IP: Se o IP já tem contas e já gastou o teste grátis
    const ipTrack = await db.ipTracking.findUnique({ where: { ipAddress: ip } });
    if (ipTrack && ipTrack.trialsUsed >= 1 && ipTrack.userCount >= 2) {
      return NextResponse.json(
        {
          error: "IP_LIMIT",
          message: "Seu IP já utilizou a criação de contas com teste gratuito. Para continuar, faça login na sua conta existente ou adquira o plano vitalício.",
        },
        { status: 403 }
      );
    }

    const handle = cleanEmail.split("@")[0].replace(/[^a-z0-9_.]/g, "").slice(0, 24) || "meuperfil";
    const user = await db.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash: await bcrypt.hash(password, 10),
        signupIp: ip,
        lastIp: ip,
        brandKit: { create: { displayName: cleanName, handle } },
      },
      include: { brandKit: true },
    });

    // Registra IP
    await db.ipTracking.upsert({
      where: { ipAddress: ip },
      update: { userCount: { increment: 1 }, updatedAt: new Date() },
      create: { ipAddress: ip, userCount: 1, trialsUsed: 0 },
    });

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
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
