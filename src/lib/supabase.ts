import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kgtgqxppgptkvzcatbjb.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDYwNDAsImV4cCI6MjEwODEyMjA0MH0.q-jBGSysPV34m-k4ZwZy48sD4ywjmZZjL8vw1888JBg";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU0NjA0MCwiZXhwIjoyMTA4MTIyMDQwfQ.Ba0xWuBpA1XYISRH2wlZVDmGGb_ob22Q96W6kfiYN1A";

/**
 * Cliente Supabase público (executado no browser ou em rotas client-side)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Cliente Supabase Admin (executado APENAS no servidor Node / API Routes)
 * Possui permissão de service_role para operações administrativas e storage
 */
export function getSupabaseAdmin() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no .env");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
