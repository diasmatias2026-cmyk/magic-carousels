import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const OFFICIAL_WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H";

// POST: Registrar cadastro do popup de primeiro acesso
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const source = String(body.source || "popup_primeiro_acesso").trim().slice(0, 50);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Por favor, informe um e-mail válido." },
        { status: 400 }
      );
    }

    let leadId: string | null = null;
    try {
      const db = database();
      const { data, error } = await db
        .from("popup_leads")
        .insert({
          name: name || null,
          email,
          phone: phone || "Não informado",
          source,
          whatsapp_clicks: 0,
        })
        .select("id")
        .single();

      if (!error && data?.id) {
        leadId = data.id;
      }
    } catch (dbErr) {
      // Se a tabela ainda não tiver sido criada no Supabase, não bloqueia o fluxo do usuário
      console.warn("Aviso ao salvar lead no Supabase:", dbErr);
    }

    return NextResponse.json({
      success: true,
      leadId,
      whatsappUrl: OFFICIAL_WHATSAPP_CHANNEL,
    });
  } catch (err) {
    console.error("Erro na API de leads:", err);
    return NextResponse.json({
      success: true,
      leadId: null,
      whatsappUrl: OFFICIAL_WHATSAPP_CHANNEL,
    });
  }
}

// PATCH: Registrar clique para entrar no WhatsApp
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = body.leadId;

    if (leadId) {
      try {
        const db = database();
        // Buscar lead atual para incrementar
        const { data: lead } = await db
          .from("popup_leads")
          .select("whatsapp_clicks")
          .eq("id", leadId)
          .single();

        const currentClicks = Number(lead?.whatsapp_clicks || 0);

        await db
          .from("popup_leads")
          .update({
            whatsapp_clicks: currentClicks + 1,
            last_clicked_at: new Date().toISOString(),
          })
          .eq("id", leadId);
      } catch (err) {
        console.warn("Aviso ao atualizar clique de WhatsApp:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

// GET: Listar cadastros (apenas para administradores)
export async function GET() {
  try {
    await requireAdmin();
    const db = database();
    const { data, error } = await db
      .from("popup_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ leads: [] });
    }

    return NextResponse.json({ leads: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Acesso não autorizado." },
      { status: 401 }
    );
  }
}
