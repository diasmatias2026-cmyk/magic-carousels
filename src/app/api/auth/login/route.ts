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
    const { email, password } = (await req.json().catch(() => ({}))) as Record<string, string>;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const ip = getClientIp(req);

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { brandKit: true },
    });

    if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    // Atualiza último IP
    await db.user.update({
      where: { id: user.id },
      data: { lastIp: ip },
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
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro ao efetuar login." }, { status: 500 });
  }
}
