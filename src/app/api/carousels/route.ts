import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkGenerationLimit, isLifetime, logUsage } from "@/lib/limits";
import { buildNicheCarousel } from "@/lib/sample";
import { defaultTemplateForNiche, FREE_TEMPLATE_IDS, getTemplate } from "@/templates";
import { uid } from "@/lib/types";

/** Cria um carrossel a partir de um template (sem IA) ou duplica um existente. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;

  const limit = await checkGenerationLimit(user.id, user.plan);
  if (!isLifetime(user.plan) && !limit.ok) {
    return NextResponse.json({ error: limit.message, upgrade: true }, { status: 402 });
  }

  if (body.duplicateId) {
    const src = await db.carousel.findFirst({ where: { id: body.duplicateId, userId: user.id } });
    if (!src) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    const slides = JSON.parse(src.slides).map((s: { id: string }) => ({ ...s, id: uid() }));
    const copy = await db.carousel.create({
      data: { ...src, id: undefined, createdAt: undefined, updatedAt: undefined, title: `${src.title} (cópia)`, slides: JSON.stringify(slides) },
    });
    await logUsage(user.id, "carousel_created");
    return NextResponse.json({ id: copy.id });
  }

  const niche = body.niche || "marketing";
  let templateId = body.templateId || defaultTemplateForNiche(niche);
  const tpl = getTemplate(templateId);
  if (!isLifetime(user.plan) && !FREE_TEMPLATE_IDS.has(tpl.id)) {
    return NextResponse.json({ error: "Este template é exclusivo do plano Vitalício.", upgrade: true }, { status: 402 });
  }
  templateId = tpl.id;
  const sample = buildNicheCarousel(tpl.niche === "geral" ? niche : tpl.niche, 8);
  const carousel = await db.carousel.create({
    data: {
      userId: user.id,
      title: sample.title,
      niche: tpl.niche === "geral" ? niche : tpl.niche,
      templateId,
      slides: JSON.stringify(sample.slides),
      caption: sample.caption,
      useBrand: user.brandKit?.useBrand ?? false,
    },
  });
  await logUsage(user.id, "carousel_created");
  return NextResponse.json({ id: carousel.id });
}
