import { db } from "./db";

const FREE_PER_MONTH = Number(process.env.FREE_CAROUSELS_PER_MONTH || 3);
const LIFETIME_AI_PER_DAY = Number(process.env.LIFETIME_AI_PER_DAY || 50);

export function isLifetime(plan: string) {
  return plan === "LIFETIME";
}

/** Verifica se o usuário pode gerar mais um carrossel. */
export async function checkGenerationLimit(userId: string, plan: string) {
  const now = new Date();
  if (isLifetime(plan)) {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const used = await db.usageLog.count({
      where: { userId, kind: "ai_generation", createdAt: { gte: since } },
    });
    return {
      ok: used < LIFETIME_AI_PER_DAY,
      used,
      limit: LIFETIME_AI_PER_DAY,
      period: "dia",
      message: `Limite diário de ${LIFETIME_AI_PER_DAY} gerações atingido. Volte amanhã!`,
    };
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const used = await db.usageLog.count({
    where: { userId, kind: "carousel_created", createdAt: { gte: monthStart } },
  });
  return {
    ok: used < FREE_PER_MONTH,
    used,
    limit: FREE_PER_MONTH,
    period: "mês",
    message: `Você usou os ${FREE_PER_MONTH} carrosséis grátis deste mês. Desbloqueie o acesso vitalício para criar sem limites.`,
  };
}

export async function logUsage(userId: string, kind: "ai_generation" | "carousel_created" | "export") {
  await db.usageLog.create({ data: { userId, kind } });
}
