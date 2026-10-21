import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCardOrder,
  createPixOrder,
  paymentMode,
  type BillingInput,
  type CustomerInput,
} from "@/lib/pagarme";
import {
  createMercadoPagoPix,
  getMercadoPagoClient,
} from "@/lib/mercadopago";
import QRCode from "qrcode";
import { getTierForUserCount } from "@/lib/pricing-tiers";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const gateway = String(body.gateway || "mercadopago").toLowerCase(); // "mercadopago" | "pagarme"
    const method = String(body.method || "pix").toLowerCase(); // "pix" | "credit_card"
    const installments = Math.max(1, Math.min(12, Number(body.installments) || 1));

    // Determinar preço de acordo com os limites de usuários (Lote 1: 47,90 / Lote 2: 197,90 / Lote 3: 497,90)
    const totalUsers = await db.user.count();
    const currentTier = getTierForUserCount(totalUsers);
    const amount = currentTier.priceCents;

    // Dados do pagador
    const customer: CustomerInput = {
      name: String(body.name || user?.name || "Cliente Magic Carousels").trim(),
      email: String(body.email || user?.email || "cliente@magiccarousels.com").trim().toLowerCase(),
      cpf: String(body.cpf || "11144477735").replace(/\D/g, ""),
      phone: String(body.phone || "11999999999").replace(/\D/g, ""),
    };

    // Obter ou criar usuário no banco para vincular ao pagamento
    let targetUserId = user?.id;
    if (!targetUserId) {
      let existing = await db.user.findUnique({ where: { email: customer.email } });
      if (!existing) {
        existing = await db.user.create({
          data: {
            name: customer.name,
            email: customer.email,
            passwordHash: "oauth_or_guest",
            brandKit: { create: { displayName: customer.name, handle: customer.email.split("@")[0] } },
          },
        });
      }
      targetUserId = existing.id;
    }

    // ==========================================
    // FLUXO 1: MERCADO PAGO (PIX Instantâneo)
    // ==========================================
    if (gateway === "mercadopago" && method === "pix") {
      const mpClient = getMercadoPagoClient();

      if (mpClient && !body.simulate) {
        try {
          // Chamada real à API do Mercado Pago
          const mpPix = await createMercadoPagoPix({
            amountInCents: amount,
            description: `Magic Carousels - Plano Vitalício (${currentTier.name})`,
            customer: {
              name: customer.name,
              email: customer.email,
              cpf: customer.cpf,
            },
          });

          let qrDataUrl = "";
          if (mpPix.qrCodeBase64) {
            qrDataUrl = `data:image/png;base64,${mpPix.qrCodeBase64}`;
          } else if (mpPix.qrCode) {
            qrDataUrl = await QRCode.toDataURL(mpPix.qrCode, { width: 320 });
          }

          const payment = await db.payment.create({
            data: {
              userId: targetUserId,
              provider: "mercadopago",
              orderId: mpPix.paymentId,
              chargeId: mpPix.paymentId,
              method: "pix",
              amount,
              installments: 1,
              status: mpPix.status === "approved" ? "paid" : "pending",
              qrCode: mpPix.qrCode,
              qrExpires: new Date(Date.now() + 30 * 60 * 1000),
              raw: JSON.stringify(mpPix.raw),
            },
          });

          return NextResponse.json({
            success: true,
            gateway: "mercadopago",
            mode: "live",
            paymentId: payment.id,
            orderId: mpPix.paymentId,
            method: "pix",
            status: payment.status,
            qrCode: mpPix.qrCode,
            qrCodeUrl: qrDataUrl,
            ticketUrl: mpPix.ticketUrl,
            amount,
          });
        } catch (mpErr: unknown) {
          console.warn("[MercadoPago Live Error]", mpErr instanceof Error ? mpErr.message : mpErr);
        }
      }

      // Mock Mercado Pago (Quando em teste ou quando a conta do MP ainda está pendente de ativação)
      const mockMpId = `mp_${Date.now()}`;
      const mockPixCode = `00020126580014br.gov.bcb.pix0136mercadopago-magic-${mockMpId}5204000053039865802BR5920Magic Carousels MP6009SAO PAULO62070503***6304ABCD`;
      const qrDataUrl = await QRCode.toDataURL(mockPixCode, { width: 320 });

      const payment = await db.payment.create({
        data: {
          userId: targetUserId,
          provider: "mercadopago_mock",
          orderId: mockMpId,
          chargeId: mockMpId,
          method: "pix",
          amount,
          installments: 1,
          status: "pending",
          qrCode: mockPixCode,
          qrExpires: new Date(Date.now() + 30 * 60 * 1000),
          raw: JSON.stringify({ gateway: "mercadopago", mode: "mock" }),
        },
      });

      return NextResponse.json({
        success: true,
        gateway: "mercadopago",
        mode: "mock",
        paymentId: payment.id,
        orderId: mockMpId,
        method: "pix",
        status: payment.status,
        qrCode: mockPixCode,
        qrCodeUrl: qrDataUrl,
        amount,
      });
    }

    // ==========================================
    // FLUXO 2: STONE (Pagar.me API v5)
    // ==========================================
    const stoneMode = paymentMode();

    if (stoneMode === "mock" || body.simulate === true) {
      const mockOrderId = `stone_mock_${Date.now()}`;
      const mockPixCode = `00020126580014br.gov.bcb.pix0136magic-stone-${mockOrderId}5204000053039865802BR5920Magic Carousels6009SAO PAULO62070503***6304ABCD`;
      const qrDataUrl = await QRCode.toDataURL(mockPixCode, { width: 320 });

      const payment = await db.payment.create({
        data: {
          userId: targetUserId,
          provider: "pagarme_mock",
          orderId: mockOrderId,
          method,
          amount,
          installments,
          status: method === "credit_card" ? "paid" : "pending",
          qrCode: mockPixCode,
          qrExpires: new Date(Date.now() + 30 * 60 * 1000),
          paidAt: method === "credit_card" ? new Date() : null,
          raw: JSON.stringify({ mode: "mock", simulated: true }),
        },
      });

      if (method === "credit_card") {
        await db.user.update({
          where: { id: targetUserId },
          data: { plan: "LIFETIME", planSince: new Date() },
        });
      }

      return NextResponse.json({
        success: true,
        gateway: "pagarme",
        mode: "mock",
        paymentId: payment.id,
        orderId: mockOrderId,
        method,
        status: payment.status,
        qrCode: mockPixCode,
        qrCodeUrl: qrDataUrl,
        amount,
      });
    }

    // Stone / Pagar.me Produção (PIX)
    if (method === "pix") {
      const order = await createPixOrder(targetUserId, customer, amount);
      const charge = order.charges?.[0];
      const pixTrans = charge?.last_transaction;
      const pixCode = pixTrans?.qr_code || "";
      let qrDataUrl = pixTrans?.qr_code_url || "";
      if (pixCode && !qrDataUrl) {
        qrDataUrl = await QRCode.toDataURL(pixCode, { width: 320 });
      }

      const payment = await db.payment.create({
        data: {
          userId: targetUserId,
          provider: "pagarme",
          orderId: order.id,
          chargeId: charge?.id,
          method: "pix",
          amount,
          installments: 1,
          status: "pending",
          qrCode: pixCode,
          qrExpires: pixTrans?.expires_at ? new Date(pixTrans.expires_at) : new Date(Date.now() + 30 * 60 * 1000),
          raw: JSON.stringify(order),
        },
      });

      return NextResponse.json({
        success: true,
        gateway: "pagarme",
        mode: stoneMode,
        paymentId: payment.id,
        orderId: order.id,
        method: "pix",
        status: "pending",
        qrCode: pixCode,
        qrCodeUrl: qrDataUrl,
        amount,
      });
    }

    // Stone / Pagar.me Produção (Cartão de Crédito)
    const cardToken = String(body.cardToken || "");
    const billing: BillingInput = {
      zipCode: String(body.zipCode || "01310-100"),
      street: String(body.street || "Av. Paulista"),
      number: String(body.number || "1000"),
      neighborhood: String(body.neighborhood || "Bela Vista"),
      city: String(body.city || "São Paulo"),
      state: String(body.state || "SP"),
    };

    const order = await createCardOrder(targetUserId, customer, amount, cardToken, installments, billing);
    const charge = order.charges?.[0];
    const isPaid = (charge?.status || order.status || "").toLowerCase() === "paid";

    const payment = await db.payment.create({
      data: {
        userId: targetUserId,
        provider: "pagarme",
        orderId: order.id,
        chargeId: charge?.id,
        method: "credit_card",
        amount,
        installments,
        status: isPaid ? "paid" : "failed",
        paidAt: isPaid ? new Date() : null,
        raw: JSON.stringify(order),
      },
    });

    if (isPaid) {
      await db.user.update({
        where: { id: targetUserId },
        data: { plan: "LIFETIME", planSince: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      gateway: "pagarme",
      mode: stoneMode,
      paymentId: payment.id,
      orderId: order.id,
      method: "credit_card",
      status: payment.status,
      amount,
    });
  } catch (err: unknown) {
    console.error("[payments/create] Erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}
