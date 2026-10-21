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
import * as validate from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
async function owned(ctx: Context) {
  const u = await requireUser();
  const { id } = await ctx.params;
  const r = await database()
    .from("carousels")
    .select("*")
    .eq("id", uuid(id))
    .eq("user_id", u.id)
    .maybeSingle();
  check(r.error);
  if (!r.data) throw new HttpError(404, "Projeto não encontrado.");
  return { u, item: r.data };
}
export const GET = (req: Request, ctx: Context) =>
  endpoint(async () => {
    const { item } = await owned(ctx);
    return item;
  })(req);
export const PUT = (req: Request, ctx: Context) =>
  endpoint(async (req) => {
    const { u, item } = await owned(ctx);
    await limit(req, "save", 60, 60, u.id);
    const b = await body(req, 4000000);
    const data = {
      title: text(b.title, 1, 140, "Título"),
      caption: text(b.caption || "", 0, 4000, "Legenda"),
      template_id: validate.template(b.templateId, u.plan),
      format: validate.format(b.format),
      slides: validate.slides(b.slides),
      appearance: validate.appearance(b.appearance || {}),
      updated_at: new Date().toISOString(),
    };
    const r = await database()
      .from("carousels")
      .update(data)
      .eq("id", item.id)
      .eq("user_id", u.id);
    check(r.error);
    return { ok: true };
  })(req);
export const DELETE = (req: Request, ctx: Context) =>
  endpoint(async () => {
    const { u, item } = await owned(ctx);
    const r = await database()
      .from("carousels")
      .delete()
      .eq("id", item.id)
      .eq("user_id", u.id);
    check(r.error);
    return { ok: true };
  })(req);
