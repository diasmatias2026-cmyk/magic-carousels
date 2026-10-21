import { endpoint } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { connection } from "next/server";
export const GET = endpoint(async () => {
  await connection();
  return { user: await getCurrentUser() };
});
