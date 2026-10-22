import { connection, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await connection();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasMpToken = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  const hasMpWebhookSecret = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);
  const appUrl = process.env.APP_URL || "https://magiccarousels.vercel.app";
  const nodeEnv = process.env.NODE_ENV;

  // Verificar se o usuário autenticado é admin
  let isAdmin = false;
  try {
    const user = await getCurrentUser();
    if (user?.isAdmin) isAdmin = true;
  } catch {
    isAdmin = false;
  }

  // Se não for admin, retorna resposta pública segura e simplificada
  if (!isAdmin) {
    const isConfigured = Boolean(supabaseUrl && hasSecretKey);
    return NextResponse.json(
      {
        status: isConfigured ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        service: "Magic Carousels API",
      },
      { status: isConfigured ? 200 : 503 }
    );
  }

  const tables: Record<string, string> = {
    app_users: "não testado",
    admin_account: "não testado",
    brand_kits: "não testado",
    leads: "não testado",
    user_behavior_logs: "não testado",
  };

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv,
    appUrl,
    environmentVariables: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : "NÃO CONFIGURADO ❌",
      SUPABASE_SECRET_KEY: hasSecretKey ? "CONFIGURADO (service_role) ✅" : "NÃO CONFIGURADO ❌",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "CONFIGURADO ✅" : "NÃO CONFIGURADO ❌",
      MERCADOPAGO_ACCESS_TOKEN: hasMpToken ? "CONFIGURADO (token ativo) ✅" : "NÃO CONFIGURADO ⚠️ (necessário p/ checkout)",
      MERCADOPAGO_WEBHOOK_SECRET: hasMpWebhookSecret ? "CONFIGURADO ✅" : "NÃO CONFIGURADO ⚠️ (necessário p/ webhook automático)",
    },
    tables,
    connected: false,
    status: "pending",
  };

  if (!supabaseUrl || !hasSecretKey) {
    diagnostics.status = "error";
    diagnostics.message =
      "Variáveis do Supabase faltando na Vercel! Adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no painel da Vercel e faça um REDEPLOY.";
    return NextResponse.json(diagnostics, { status: 500 });
  }

  try {
    const db = database();

    // Test app_users
    const usersTest = await db.from("app_users").select("id").limit(1);
    if (usersTest.error) {
      tables.app_users = `ERRO: ${usersTest.error.message} (Código: ${usersTest.error.code})`;
    } else {
      tables.app_users = "OK ✅";
    }

    // Test admin_account
    const adminTest = await db.from("admin_account").select("user_id").limit(1);
    if (adminTest.error) {
      tables.admin_account = `ERRO: ${adminTest.error.message}`;
    } else {
      tables.admin_account = "OK ✅";
    }

    // Test brand_kits
    const brandTest = await db.from("brand_kits").select("user_id").limit(1);
    if (brandTest.error) {
      tables.brand_kits = `ERRO: ${brandTest.error.message}`;
    } else {
      tables.brand_kits = "OK ✅";
    }

    // Test leads
    const leadsTest = await db.from("leads").select("id").limit(1);
    if (leadsTest.error) {
      tables.leads = `ERRO: ${leadsTest.error.message}`;
    } else {
      tables.leads = "OK ✅";
    }

    // Test user_behavior_logs
    const logsTest = await db.from("user_behavior_logs").select("id").limit(1);
    if (logsTest.error) {
      tables.user_behavior_logs = `ERRO: ${logsTest.error.message}`;
    } else {
      tables.user_behavior_logs = "OK ✅";
    }

    diagnostics.connected = true;
    diagnostics.status =
      usersTest.error ? "tables_missing" : "ready_and_working";
    diagnostics.message = usersTest.error
      ? "Supabase conectado, mas tabelas não foram criadas. Execute o script supabase/setup.sql no SQL Editor do Supabase."
      : "Banco de dados e autenticação 100% operacionais!";

    return NextResponse.json(diagnostics);
  } catch (err) {
    diagnostics.status = "error";
    diagnostics.connected = false;
    diagnostics.message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
