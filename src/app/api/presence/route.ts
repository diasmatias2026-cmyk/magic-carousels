import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { body, check, endpoint, limit } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";
export const POST = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "presence", 10, 60, u.id);
  const b = await body(req);
  const token = (await cookies()).get(SESSION_COOKIE)!.value;
  const r = await database()
    .from("app_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
      current_page: [
        "editor",
        "projects",
        "templates",
        "brand",
        "billing",
        "admin",
      ].includes(String(b.page))
        ? "/app/" + b.page
        : "/app",
    })
    .eq("token_hash", createHash("sha256").update(token).digest("hex"))
    .eq("user_id", u.id);
  check(r.error);
  return { ok: true };
});
