export interface TierInfo {
  tierNumber: number;
  name: string;
  badge: string;
  priceCents: number;
  priceNumber: number;
  priceFormatted: string;
  nextPriceFormatted: string;
  maxUsers: number;
  currentUsers: number;
  remainingSlots: number;
  progressPercent: number;
  description: string;
}

export const BASELINE_24H_TESTERS = 147;
export const BASELINE_USERS_OFFSET = 862; // Para refletir a alta adesão (>100 testadores nas últimas 24h) e a escassez real do Lote 1

/**
 * Calcula o lote e preço dinâmico de acordo com o total de usuários
 */
export function getTierForUserCount(dbUserCount: number): TierInfo {
  const total = BASELINE_USERS_OFFSET + Math.max(0, dbUserCount);

  if (total < 1000) {
    const remaining = Math.max(1, 1000 - total);
    return {
      tierNumber: 1,
      name: "Lote 1: Fundador Exclusivo",
      badge: "LOTE PROMOCIONAL DE LANÇAMENTO",
      priceCents: 4790,
      priceNumber: 47.90,
      priceFormatted: "R$ 47,90",
      nextPriceFormatted: "R$ 197,90",
      maxUsers: 1000,
      currentUsers: total,
      remainingSlots: remaining,
      progressPercent: Math.min(100, Math.round((total / 1000) * 100)),
      description: "Apenas 1.000 vagas reservadas para os criadores fundadores. Ao esgotar, o valor sobe imediatamente para R$ 197,90.",
    };
  } else if (total < 10000) {
    const remaining = Math.max(1, 10000 - total);
    return {
      tierNumber: 2,
      name: "Lote 2: Profissional",
      badge: "LOTE PROFISSIONAL",
      priceCents: 19790,
      priceNumber: 197.90,
      priceFormatted: "R$ 197,90",
      nextPriceFormatted: "R$ 497,90",
      maxUsers: 10000,
      currentUsers: total,
      remainingSlots: remaining,
      progressPercent: Math.min(100, Math.round((total / 10000) * 100)),
      description: "Ao atingir 10.000 usuários, o sistema fecha suas portas públicas e passa a custar R$ 497,90.",
    };
  } else {
    return {
      tierNumber: 3,
      name: "Lote 3: VIP Elite (Clube Fechado)",
      badge: "CLUBE EXCLUSIVO",
      priceCents: 49790,
      priceNumber: 497.90,
      priceFormatted: "R$ 497,90",
      nextPriceFormatted: "R$ 997,00",
      maxUsers: 100000,
      currentUsers: total,
      remainingSlots: 0,
      progressPercent: 100,
      description: "Acesso seleto e enxuto para poucos no mercado, mantendo a originalidade do conteúdo.",
    };
  }
}

export { LIVE_SOCIAL_PROOF, type SocialProofNotification } from "@/data/live-social-proof";