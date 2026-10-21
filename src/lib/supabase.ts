import "server-only";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./http";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new HttpError(
      500,
      "As chaves do Supabase não foram encontradas no servidor (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY). Verifique as variáveis de ambiente na Vercel e faça um Redeploy da aplicação."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
