import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTemplate } from "@/templates";
import type { Slide } from "@/lib/types";

async function owned(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  const carousel = await db.carousel.findFirst({ where: { id, userId: user.id } });
  if (!carousel) return { error: NextResponse.json({ error: "Carrossel não encontrado." }, { status: 404 }) };
  return { user, carousel };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/carousels/[id]">) {
  const { id } = await ctx.params;
  const r = await owned(id);
  if (r.error) return r.error;
  return NextResponse.json({ ...r.carousel, slides: JSON.parse(r.carousel.slides) });
}

export async function PUT(req: Request, ctx: RouteContext<"/api/carousels/[id]">) {
  const { id } = await ctx.params;
  const r = await owned(id);
  if (r.error) return r.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.slice(0, 140);
  if (typeof body.caption === "string") data.caption = body.caption.slice(0, 4000);
  if (typeof body.templateId === "string") data.templateId = getTemplate(body.templateId).id;
  if (typeof body.format === "string" && ["4:5", "1:1", "9:16"].includes(body.format)) data.format = body.format;
  if (typeof body.useBrand === "boolean") data.useBrand = body.useBrand;
  if (Array.isArray(body.slides)) {
    const slides = (body.slides as Slide[]).slice(0, 15);
    const json = JSON.stringify(slides);
    if (json.length > 12_000_000) return NextResponse.json({ error: "Imagens muito grandes. Use arquivos menores." }, { status: 413 });
    data.slides = json;
  }

  const updated = await db.carousel.update({ where: { id }, data });
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/carousels/[id]">) {
  const { id } = await ctx.params;
  const r = await owned(id);
  if (r.error) return r.error;
  await db.carousel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
