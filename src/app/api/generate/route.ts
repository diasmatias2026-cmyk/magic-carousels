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
  const b = await body(req);
  const userApiKey =
    typeof b.apiKey === "string" && b.apiKey.trim().length > 5
      ? b.apiKey.trim()
      : undefined;
  const userProvider =
    typeof b.provider === "string" ? (b.provider as any) : undefined;
  const userModel =
    typeof b.model === "string" && b.model.trim().length > 0
      ? b.model.trim()
      : undefined;

  if (activeProvider() === "mock" && !userApiKey)
    throw new HttpError(
      503,
      "Geração por IA direta ainda indisponível. Conecte sua chave grátis ou use o Super Prompt.",
    );

  const topic = text(b.topic, 5, 300, "Tema");
  const niche = text(b.niche || "marketing", 1, 60, "Nicho");
  const templateId = validate.template(b.templateId, u.plan);
  const fmt = validate.format(b.format || "4:5");
  const count = Number(b.slideCount || 7);
  if (!Number.isInteger(count) || count < 2 || count > 15)
    throw new HttpError(400, "Quantidade inválida.");
  const result = await generateCarouselText(
    {
      topic,
      niche,
      slideCount: count,
      tone: text(b.tone || "didatico", 1, 40, "Tom"),
    },
    {
      provider: userProvider,
      apiKey: userApiKey,
      model: userModel,
    },
  );
  return createCarousel(u.id, {
    title: result.title.slice(0, 140),
    niche,
    template_id: templateId,
    format: fmt,
    slides: validate.slides(result.slides),
    caption: result.caption.slice(0, 4000),
  });
});
