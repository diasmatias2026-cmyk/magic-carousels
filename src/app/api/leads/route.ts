import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

function getClientIp(h: Headers): string {
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "127.0.0.1";
}

export async function POST(req: Request) {
  try {
    const h = await headers();
    const ip = getClientIp(h);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").replace(/\D/g, "");
    const source = String(body.source || "whatsapp_popup");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "E-mail inválido." }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        name: name || email.split("@")[0],
        email,
        phone,
        source,
        ipAddress: ip,
      },
    });

    const whatsappUrl = process.env.WHATSAPP_COMMUNITY_URL || "https://chat.whatsapp.com/exemplo-comunidade-vip";

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Erro ao registrar lead:", error);
    return NextResponse.json({ success: false, error: "Erro interno ao cadastrar." }, { status: 500 });
  }
}
