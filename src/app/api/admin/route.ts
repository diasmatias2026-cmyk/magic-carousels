import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { check, endpoint, limit } from "@/lib/http";
export const GET = endpoint(async (req) => {
  const u = await requireAdmin();
  await limit(req, "admin", 10, 60, u.id);
  const db = database();
  const [users, payments, sessions, stats] = await Promise.all([
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
  ]);
  for (const r of [users, payments, sessions, stats]) check(r.error);
  return {
    users: users.data,
    payments: payments.data,
    sessions: sessions.data,
    ...stats.data,
    revenueScope: "Todos os pagamentos aprovados, sem estornos",
    updatedAt: new Date().toISOString(),
  };
});
