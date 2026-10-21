import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "127.0.0.1";
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { allowed: false, error: "AUTH_REQUIRED", message: "Faça login ou crie sua conta para gerar seu carrossel." },
        { status: 401 }
      );
    }

    if (user.plan === "LIFETIME") {
      return NextResponse.json({ allowed: true, plan: "LIFETIME" });
    }

    // Plano FREE: permite apenas 1 uso
    if (user.freeTrialsUsed >= 1) {
      return NextResponse.json(
        {
          allowed: false,
          error: "TRIAL_EXHAUSTED",
          message: "Você já utilizou seu 1 carrossel de teste gratuito! Ative o Plano Vitalício por apenas R$ 47,90 para continuar criando sem limites.",
        },
        { status: 403 }
      );
    }

    // Consome o teste gratuito
    const ip = getClientIp(req);
    await db.user.update({
      where: { id: user.id },
      data: { freeTrialsUsed: 1, lastIp: ip },
    });

    await db.ipTracking.upsert({
      where: { ipAddress: ip },
      update: { trialsUsed: { increment: 1 }, updatedAt: new Date() },
      create: { ipAddress: ip, trialsUsed: 1, userCount: 1 },
    });

    return NextResponse.json({
      allowed: true,
      remaining: 0,
      plan: "FREE",
      message: "Este é seu carrossel de teste gratuito! Aproveite para baixar e testar a qualidade.",
    });
  } catch (err) {
    console.error("Trial usage error:", err);
    return NextResponse.json({ error: "Erro ao verificar cota de uso." }, { status: 500 });
  }
}
