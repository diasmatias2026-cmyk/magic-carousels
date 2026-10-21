import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { check, endpoint, limit } from "@/lib/http";

export const GET = endpoint(async (req) => {
  const u = await requireAdmin();
  await limit(req, "admin", 10, 60, u.id);
  const db = database();

  const [users, payments, sessions, stats, leadsRes, behaviorRes] = await Promise.all([
    db
      .from("app_users")
      .select("id,name,email,plan,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("payments")
      .select("id,user_id,amount,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("app_sessions")
      .select("user_id,last_seen_at,current_page")
      .gt("expires_at", new Date().toISOString())
      .gte("last_seen_at", new Date(Date.now() - 90000).toISOString()),
    db.rpc("app_admin_stats"),
    db
      .from("popup_leads")
      .select("id,name,email,phone,source,whatsapp_clicks,last_clicked_at,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    db
      .from("page_behavior_events")
      .select("session_id,event_type,section,created_at")
      .order("created_at", { ascending: false })
      .limit(800),
  ]);

  for (const r of [users, payments, sessions, stats]) check(r.error);

  const leads = leadsRes?.data || [];
  const totalLeads = leads.length;
  const totalWhatsappClicks = leads.reduce((acc, curr) => acc + (curr.whatsapp_clicks || 0), 0);

  // Computar onde as pessoas param e seções mais visualizadas
  const behaviorEvents = behaviorRes?.data || [];
  const sectionViews: Record<string, number> = {};
  const dropOffPoints: Record<string, number> = {};
  const ctaClicks: Record<string, number> = {};

  for (const ev of behaviorEvents) {
    if (ev.event_type === "section_view" && ev.section) {
      sectionViews[ev.section] = (sectionViews[ev.section] || 0) + 1;
    } else if (ev.event_type === "cta_click" && ev.section) {
      ctaClicks[ev.section] = (ctaClicks[ev.section] || 0) + 1;
    } else if (ev.event_type === "exit_section" && ev.section) {
      dropOffPoints[ev.section] = (dropOffPoints[ev.section] || 0) + 1;
    }
  }

  return {
    users: users.data,
    payments: payments.data,
    sessions: sessions.data,
    leads,
    totalLeads,
    totalWhatsappClicks,
    behavior: {
      sectionViews,
      dropOffPoints,
      ctaClicks,
      totalEvents: behaviorEvents.length,
    },
    ...stats.data,
    revenueScope: "Todos os pagamentos aprovados, sem estornos",
    updatedAt: new Date().toISOString(),
  };
});
