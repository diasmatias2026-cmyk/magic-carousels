import { requireUser } from "@/lib/auth";
import { generateCarouselText, activeProvider } from "@/lib/ai";
import { createCarousel } from "@/lib/carousels";
import { body, endpoint, HttpError, limit, text } from "@/lib/http";
import * as validate from "@/lib/validation";
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "ai", 3, 60, u.id);
  if (u.plan !== "LIFETIME" && u.freeTrialsUsed >= 1)
    throw new HttpError(402, "Teste gratuito utilizado.");
  if (activeProvider() === "mock")
    throw new HttpError(
      503,
      "Geração por IA ainda indisponível. Use o editor ou importe uma resposta com o Prompt.",
    );
  const b = await body(req);
  const topic = text(b.topic, 5, 300, "Tema");
  const niche = text(b.niche || "marketing", 1, 60, "Nicho");
  const templateId = validate.template(b.templateId, u.plan);
  const fmt = validate.format(b.format || "4:5");
  const count = Number(b.slideCount || 7);
  if (!Number.isInteger(count) || count < 2 || count > 15)
    throw new HttpError(400, "Quantidade inválida.");
  const result = await generateCarouselText({
    topic,
    niche,
    slideCount: count,
    tone: text(b.tone || "didatico", 1, 40, "Tom"),
  });
  return createCarousel(u.id, {
    title: result.title.slice(0, 140),
    niche,
    template_id: templateId,
    format: fmt,
    slides: validate.slides(result.slides),
    caption: result.caption.slice(0, 4000),
  });
});
