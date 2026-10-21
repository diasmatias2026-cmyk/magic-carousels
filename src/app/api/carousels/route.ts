import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import {
  body,
  check,
  endpoint,
  HttpError,
  limit,
  text,
  uuid,
} from "@/lib/http";
import { createCarousel } from "@/lib/carousels";
import * as validate from "@/lib/validation";
export const GET = endpoint(async () => {
  const u = await requireUser();
  const r = await database()
    .from("carousels")
    .select("id,title,template_id,format,updated_at")
    .eq("user_id", u.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  check(r.error);
  return { items: r.data };
});
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "create", 20, 60, u.id);
  const b = await body(req, 4000000);
  if (b.duplicateId) {
    const r = await database()
      .from("carousels")
      .select("*")
      .eq("id", uuid(b.duplicateId))
      .eq("user_id", u.id)
      .maybeSingle();
    check(r.error);
    if (!r.data) throw new HttpError(404, "Projeto não encontrado.");
    validate.template(r.data.template_id, u.plan);
    return createCarousel(u.id, {
      ...r.data,
      title: (r.data.title + " (cópia)").slice(0, 140),
    });
  }
  return createCarousel(u.id, {
    title: text(b.title, 1, 140, "Título"),
    niche: text(b.niche || "marketing", 1, 60, "Nicho"),
    template_id: validate.template(b.templateId, u.plan),
    slides: validate.slides(b.slides),
    caption: text(b.caption || "", 0, 4000, "Legenda"),
    format: validate.format(b.format || "4:5"),
    appearance: validate.appearance(b.appearance || {}),
  });
});
