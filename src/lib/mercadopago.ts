import { MercadoPagoConfig, Payment } from "mercadopago";

export function getMercadoPagoClient(): MercadoPagoConfig | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || token.trim() === "") {
    return null;
  }
  return new MercadoPagoConfig({ accessToken: token.trim(), options: { timeout: 7000 } });
}

export interface MercadoPagoPaymentInput {
  amountInCents: number; // ex: 4790 -> R$ 47,90
  description: string;
  customer: {
    name: string;
    email: string;
    cpf?: string;
  };
  notificationUrl?: string;
}

export interface MercadoPagoPixResponse {
  paymentId: string;
  status: string;
  qrCode: string; // Copia e cola
  qrCodeBase64: string; // Imagem em base64
  ticketUrl?: string;
  raw: unknown;
}

/**
 * Cria cobrança PIX via Mercado Pago API v1
 */
export async function createMercadoPagoPix(
  input: MercadoPagoPaymentInput
): Promise<MercadoPagoPixResponse> {
  const client = getMercadoPagoClient();
  if (!client) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não está configurado no .env");
  }

  const payment = new Payment(client);
  const amountInReais = Number((input.amountInCents / 100).toFixed(2));

  const names = input.customer.name.trim().split(" ");
  const firstName = names[0] || "Cliente";
  const lastName = names.slice(1).join(" ") || "MagicCarousels";
  const cleanCpf = (input.customer.cpf || "11144477735").replace(/\D/g, "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magic-carousels.vercel.app";
  const notificationUrl =
    input.notificationUrl || `${appUrl}/api/webhooks/mercadopago`;

  const response = await payment.create({
    body: {
      transaction_amount: amountInReais,
      description: input.description,
      payment_method_id: "pix",
      notification_url: notificationUrl,
      payer: {
        email: input.customer.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: "CPF",
          number: cleanCpf,
        },
      },
    },
  });

  const pointOfInteraction = response.point_of_interaction?.transaction_data;
  const qrCode = pointOfInteraction?.qr_code || "";
  const qrCodeBase64 = pointOfInteraction?.qr_code_base64 || "";
  const ticketUrl = pointOfInteraction?.ticket_url;

  return {
    paymentId: String(response.id),
    status: response.status || "pending",
    qrCode,
    qrCodeBase64,
    ticketUrl,
    raw: response,
  };
}

/**
 * Consulta status de um pagamento no Mercado Pago
 */
export async function getMercadoPagoPayment(paymentId: string) {
  const client = getMercadoPagoClient();
  if (!client) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não está configurado");
  }

  const payment = new Payment(client);
  return await payment.get({ id: paymentId });
}
