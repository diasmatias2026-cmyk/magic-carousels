import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.sessionId || "anonymous").slice(0, 80);
    const eventType = String(body.eventType || "unknown").slice(0, 50);
    const section = body.section ? String(body.section).slice(0, 50) : null;
    const details = typeof body.details === "object" ? body.details : {};

    try {
      const db = database();
      await db.from("page_behavior_events").insert({
        session_id: sessionId,
        event_type: eventType,
        section,
        details,
      });
    } catch (dbErr) {
      // Ignora silenciosamente se a tabela ainda não tiver sido criada
      console.warn("Aviso ao salvar evento de analytics:", dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const db = database();

    // Buscar últimos 1000 eventos para computar o funil
    const { data: events, error } = await db
      .from("page_behavior_events")
      .select("session_id,event_type,section,details,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !events) {
      return NextResponse.json({
        totalSessions: 0,
        sectionViews: {},
        dropOffPoints: {},
        scrollDepths: { "25%": 0, "50%": 0, "75%": 0, "100%": 0 },
        ctaClicks: {},
      });
    }

    const uniqueSessions = new Set(events.map((e) => e.session_id));
    const sectionViews: Record<string, number> = {};
    const dropOffPoints: Record<string, number> = {};
    const scrollDepths: Record<string, number> = { "25%": 0, "50%": 0, "75%": 0, "100%": 0 };
    const ctaClicks: Record<string, number> = {};

    // Agrupar eventos por sessão para detectar o último ponto visto antes de parar
    const sessionSections: Record<string, string[]> = {};

    for (const ev of events) {
      if (ev.event_type === "section_view" && ev.section) {
        sectionViews[ev.section] = (sectionViews[ev.section] || 0) + 1;
        if (!sessionSections[ev.session_id]) sessionSections[ev.session_id] = [];
        if (!sessionSections[ev.session_id].includes(ev.section)) {
          sessionSections[ev.session_id].push(ev.section);
        }
      } else if (ev.event_type === "scroll_depth" && ev.section) {
        scrollDepths[ev.section] = (scrollDepths[ev.section] || 0) + 1;
      } else if (ev.event_type === "cta_click" && ev.section) {
        ctaClicks[ev.section] = (ctaClicks[ev.section] || 0) + 1;
      } else if (ev.event_type === "exit_section" && ev.section) {
        dropOffPoints[ev.section] = (dropOffPoints[ev.section] || 0) + 1;
      }
    }

    return NextResponse.json({
      totalSessions: uniqueSessions.size,
      sectionViews,
      dropOffPoints,
      scrollDepths,
      ctaClicks,
      recentEventsCount: events.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Acesso não autorizado." },
      { status: 401 }
    );
  }
}
