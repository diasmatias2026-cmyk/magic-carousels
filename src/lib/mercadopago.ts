import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { HttpError } from "./http";
export function client() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new HttpError(503, "Pagamento indisponível no momento.");
  return new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 10000 },
  });
}
export function getMercadoPagoPayment(id: string) {
  return new Payment(client()).get({ id });
}
export async function checkout(id: string, email: string, amount: number) {
  const rawBase =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://magiccarousels.vercel.app");

  const url = rawBase.startsWith("http")
    ? new URL(rawBase).origin
    : `https://${rawBase}`;

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new HttpError(
      503,
      "Configure a variável MERCADOPAGO_ACCESS_TOKEN na Vercel para ativar o checkout.",
    );
  }

  return new Preference(client()).create({
    body: {
      items: [
        {
          id: "lifetime",
          title: "Magic Carousels — Acesso Vitalício",
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount / 100,
        },
      ],
      payer: { email },
      external_reference: id,
      notification_url: url + "/api/webhooks/mercadopago",
      back_urls: {
        success: url + "/app?payment=return",
        pending: url + "/app?payment=return",
        failure: url + "/app?payment=return",
      },
      auto_return: "approved",
    },
  });
}
