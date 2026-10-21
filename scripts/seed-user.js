import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
const email = "suporte.splinkagencia@gmail.com";
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const existing = await db.from("admin_account").select("user_id").maybeSingle();
if (existing.error) throw new Error("Não foi possível consultar admin.");
if (existing.data) {
  console.log("Administrador já provisionado; nenhuma alteração.");
  process.exit(0);
}
const account = await db
  .from("app_users")
  .select("id")
  .eq("email", email)
  .maybeSingle();
if (account.error) throw new Error("Falha na consulta.");
if (account.data)
  throw new Error(
    "Conta existente: confirme a titularidade antes de promover. Nenhuma alteração executada.",
  );
const password = randomBytes(24).toString("base64url");
const u = await db
  .from("app_users")
  .insert({
    email,
    name: "Splink Agência",
    password_hash: await bcrypt.hash(password, 12),
    plan: "LIFETIME",
    terms_version: "admin-provisioned-2026-10-21",
  })
  .select("id")
  .single();
if (u.error) throw new Error("Falha ao criar conta.");
const r = await db
  .from("admin_account")
  .insert({ singleton: true, user_id: u.data.id });
if (r.error) throw new Error("Falha na promoção; revisar antes de repetir.");
mkdirSync(".private", { recursive: true });
writeFileSync(
  ".private/admin-access.txt",
  "Acesso administrativo — guardar em gerenciador de senhas.\nLogin: " +
    email +
    "\nSenha inicial: " +
    password +
    "\nURL: /app\nTroque a senha em Minha marca após entrar.\n",
  { mode: 0o600 },
);
console.log(
  "Único administrador provisionado. Acesso salvo em .private/admin-access.txt; segredo não exibido.",
);
