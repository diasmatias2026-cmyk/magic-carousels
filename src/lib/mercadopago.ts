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
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base?.startsWith("https://") || !process.env.MERCADOPAGO_WEBHOOK_SECRET)
    throw new HttpError(
      503,
      "Pagamento em configuração. Entre em contato com comercial@splinkapp.com.br.",
    );
  const url = new URL(base).origin;
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
