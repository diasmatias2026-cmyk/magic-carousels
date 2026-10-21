import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCarouselText } from "@/lib/ai";
import { checkGenerationLimit, isLifetime, logUsage } from "@/lib/limits";
import { defaultTemplateForNiche, FREE_TEMPLATE_IDS, getTemplate } from "@/templates";
import type { CarouselFormat } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const topic = String(body.topic || "").trim();
  const niche = String(body.niche || "marketing");
  const slideCount = Math.max(4, Math.min(10, Number(body.slideCount) || 8));
  const tone = String(body.tone || "didatico");
  const audience = String(body.audience || "").slice(0, 160);
  const format = (["4:5", "1:1", "9:16"].includes(String(body.format)) ? body.format : "4:5") as CarouselFormat;
  let templateId = String(body.templateId || defaultTemplateForNiche(niche));
  if (!isLifetime(user.plan) && !FREE_TEMPLATE_IDS.has(templateId)) templateId = defaultTemplateForNiche(niche);
  templateId = getTemplate(templateId).id;

  if (topic.length < 5) return NextResponse.json({ error: "Descreva o tema com pelo menos 5 caracteres." }, { status: 400 });
  if (topic.length > 300) return NextResponse.json({ error: "Tema muito longo (máx. 300 caracteres)." }, { status: 400 });

  const limit = await checkGenerationLimit(user.id, user.plan);
  if (!limit.ok) return NextResponse.json({ error: limit.message, upgrade: !isLifetime(user.plan) }, { status: 402 });

  const result = await generateCarouselText({ topic, niche, slideCount, tone, audience, handle: user.brandKit?.handle });

  const carousel = await db.carousel.create({
    data: {
      userId: user.id,
      title: result.title.slice(0, 140),
      niche,
      templateId,
      prompt: topic,
      slides: JSON.stringify(result.slides),
      caption: result.caption,
      format,
      useBrand: user.brandKit?.useBrand ?? false,
    },
  });
  await logUsage(user.id, "ai_generation");
  await logUsage(user.id, "carousel_created");

  return NextResponse.json({ id: carousel.id, provider: result.provider });
}
