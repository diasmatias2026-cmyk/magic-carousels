import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BASELINE_24H_TESTERS, getTierForUserCount, LIVE_SOCIAL_PROOF } from "@/lib/pricing-tiers";

export async function GET() {
  try {
    const userCount = await db.user.count();
    const tier = getTierForUserCount(userCount);

    return NextResponse.json({
      success: true,
      activeTesters24h: BASELINE_24H_TESTERS + (userCount % 15),
      tier,
      recentActivity: LIVE_SOCIAL_PROOF,
    });
  } catch (error) {
    console.error("Erro ao buscar escassez:", error);
    const fallbackTier = getTierForUserCount(0);
    return NextResponse.json({
      success: true,
      activeTesters24h: BASELINE_24H_TESTERS,
      tier: fallbackTier,
      recentActivity: LIVE_SOCIAL_PROOF,
    });
  }
}
