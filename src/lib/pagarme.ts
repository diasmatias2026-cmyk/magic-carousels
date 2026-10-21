import "server-only";

/**
 * Integração Stone — Pagar.me Core API v5 (empresa do grupo Stone).
 * Docs: https://docs.pagar.me/reference
 * Autenticação: Basic Auth com a Secret Key como usuário e senha vazia.
 */

export type PaymentMode = "mock" | "sandbox" | "live";

export function paymentMode(): PaymentMode {
  const m = (process.env.PAYMENT_MODE || "mock").toLowerCase();
  if ((m === "sandbox" || m === "live") && process.env.PAGARME_SECRET_KEY) return m;
  return "mock";
}

export function lifetimePriceCents() {
  return Number(process.env.LIFETIME_PRICE_CENTS || 4790);
}

export function maxInstallments() {
  return Math.max(1, Math.min(12, Number(process.env.MAX_INSTALLMENTS || 12)));
}

const BASE = () => (process.env.PAGARME_API_URL || "https://api.pagar.me/core/v5").replace(/\/$/, "");

function authHeader() {
  const sk = process.env.PAGARME_SECRET_KEY || "";
  return "Basic " + Buffer.from(`${sk}:`).toString("base64");
}

async function pagarme<T = PagarmeOrder>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "MagicCarousels/1.0",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* resposta não-JSON */
  }
  if (!res.ok) {
    const msg = (json as { message?: string })?.message || text.slice(0, 300);
    throw new PagarmeError(`Pagar.me ${res.status}: ${msg}`, res.status, json);
  }
  return json as T;
}

export class PagarmeError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

export interface PagarmeCharge {
  id: string;
  status: string; // pending | paid | failed | canceled | processing ...
  payment_method: string;
  last_transaction?: {
    status?: string;
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
    acquirer_message?: string;
    gateway_response?: { errors?: { message: string }[] };
  };
}

export interface PagarmeOrder {
  id: string;
  status: string; // pending | paid | canceled | failed
  charges?: PagarmeCharge[];
  metadata?: Record<string, string>;
}

export interface CustomerInput {
  name: string;
  email: string;
  cpf: string; // apenas dígitos
  phone: string; // apenas dígitos com DDD
}

export interface BillingInput {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

function customerPayload(c: CustomerInput, userId: string) {
  const phone = c.phone.replace(/\D/g, "");
  return {
    name: c.name,
    email: c.email,
    code: userId,
    type: "individual",
    document: c.cpf.replace(/\D/g, ""),
    document_type: "CPF",
    phones: {
      mobile_phone: { country_code: "55", area_code: phone.slice(0, 2), number: phone.slice(2) },
    },
  };
}

function itemPayload(amount: number) {
  return [{ amount, description: "Magic Carousels — Acesso Vitalício", quantity: 1, code: "MC-LIFETIME" }];
}

export async function createPixOrder(userId: string, customer: CustomerInput, amount: number) {
  return pagarme("/orders", {
    method: "POST",
    body: JSON.stringify({
      code: `mc_${userId}_${Date.now()}`,
      items: itemPayload(amount),
      customer: customerPayload(customer, userId),
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 1800,
            additional_information: [{ name: "Produto", value: "Magic Carousels Vitalício" }],
          },
        },
      ],
      metadata: { userId, product: "lifetime" },
    }),
  });
}

export async function createCardOrder(
  userId: string,
  customer: CustomerInput,
  amount: number,
  cardToken: string,
  installments: number,
  billing: BillingInput,
) {
  return pagarme("/orders", {
    method: "POST",
    body: JSON.stringify({
      code: `mc_${userId}_${Date.now()}`,
      items: itemPayload(amount),
      customer: customerPayload(customer, userId),
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            installments,
            statement_descriptor: "MAGICCAROUSEL",
            operation_type: "auth_and_capture",
            card_token: cardToken,
            card: {
              billing_address: {
                line_1: `${billing.number}, ${billing.street}, ${billing.neighborhood}`,
                zip_code: billing.zipCode.replace(/\D/g, ""),
                city: billing.city,
                state: billing.state.toUpperCase(),
                country: "BR",
              },
            },
          },
        },
      ],
      metadata: { userId, product: "lifetime" },
    }),
  });
}

export async function getOrder(orderId: string) {
  return pagarme(`/orders/${orderId}`, { method: "GET" });
}

/** Converte o status do pedido/cobrança da Pagar.me para o status interno. */
export function mapStatus(order: PagarmeOrder): "pending" | "paid" | "failed" | "canceled" {
  const charge = order.charges?.[0];
  const s = (charge?.status || order.status || "").toLowerCase();
  if (s === "paid" || order.status === "paid") return "paid";
  if (s === "failed" || s === "not_authorized" || order.status === "failed") return "failed";
  if (s === "canceled" || order.status === "canceled") return "canceled";
  return "pending";
}

export function failureReason(order: PagarmeOrder) {
  const t = order.charges?.[0]?.last_transaction;
  return t?.gateway_response?.errors?.[0]?.message || t?.acquirer_message || "Pagamento não aprovado.";
}

/** Valida o Basic Auth configurado no webhook do painel Pagar.me. */
export function verifyWebhookAuth(header: string | null) {
  const user = process.env.PAGARME_WEBHOOK_USER;
  const pass = process.env.PAGARME_WEBHOOK_PASS;
  if (!user || !pass) return true; // sem credenciais configuradas (dev)
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  return decoded === `${user}:${pass}`;
}
