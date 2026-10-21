import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { body, check, endpoint, limit } from "@/lib/http";
import { appearance } from "@/lib/validation";
export const GET = endpoint(async () => {
  const u = await requireUser();
  return u.brandKit || {};
});
export const PUT = endpoint(async (req) => {
  const u = await requireUser();
  await limit(req, "brand", 20, 60, u.id);
  const data = appearance(await body(req, 1500000));
  const r = await database()
    .from("brand_kits")
    .upsert({ user_id: u.id, data, updated_at: new Date().toISOString() });
  check(r.error);
  return data;
});
