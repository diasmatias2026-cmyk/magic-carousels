import "server-only";
import { database } from "./db";
import { check, HttpError } from "./http";
export async function createCarousel(
  userId: string,
  data: Record<string, unknown>,
) {
  const r = await database().rpc("app_create_carousel", {
    p_user: userId,
    p_data: data,
  });
  if (r.error?.message.includes("TRIAL_EXHAUSTED"))
    throw new HttpError(
      402,
      "Seu carrossel gratuito já foi criado. Você pode continuar editando e exportando ele ou contratar o Vitalício.",
    );
  if (r.error?.message.includes("DAILY_LIMIT"))
    throw new HttpError(429, "Limite de 50 criações em 24 horas atingido.");
  check(r.error);
  return { id: r.data };
}
