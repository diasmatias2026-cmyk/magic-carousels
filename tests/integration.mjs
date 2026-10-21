import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const base = process.env.TEST_URL || "http://localhost:3000";
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const users = [];
let count = 0;
async function request(path, method = "GET", data, cookie, origin = base) {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  let b;
  try {
    b = await r.json();
  } catch {
    b = {};
  }
  return {
    status: r.status,
    body: b,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
function equal(got, want, label) {
  assert.equal(got, want, label);
  count++;
  console.log("PASS " + label);
}
async function account() {
  const email = "qa-" + randomUUID() + "@example.invalid";
  const password = "Test-only-" + randomUUID();
  const r = await request("auth/register", "POST", {
    name: "Conta temporária QA",
    email,
    password,
    acceptTerms: true,
  });
  equal(r.status, 200, "cadastro");
  const me = await request("auth/me", "GET", undefined, r.cookie);
  users.push(me.body.user.id);
  return { email, password, cookie: r.cookie, id: me.body.user.id };
}
const a = await account(),
  b = await account();
try {
  equal((await request("carousels")).status, 401, "API privada exige sessão");
  equal(
    (await request("admin", "GET", undefined, a.cookie)).status,
    403,
    "usuário comum não acessa admin",
  );
  equal(
    (await request("auth/social", "POST", { email: a.email })).status,
    410,
    "login social simulado desativado",
  );
  equal(
    (await request("payments/simulate", "POST", {})).status,
    410,
    "pagamento simulado desativado",
  );
  equal(
    (await request("brand", "PUT", {}, a.cookie, "https://attacker.invalid"))
      .status,
    403,
    "CSRF bloqueado",
  );
  // The first explicitly free entry from the public module is resolved without executing application server code.
  const mod = await import("../src/templates/index.ts");
  const templateId = [...mod.FREE_TEMPLATE_IDS][0];
  const data = {
    title: "Projeto QA",
    niche: "marketing",
    templateId,
    slides: [
      { id: "one", type: "cover", title: "Primeiro slide" },
      { id: "two", type: "cta", title: "Segundo slide" },
    ],
    caption: "Legenda QA",
    format: "4:5",
    appearance: {},
  };
  const created = await request("carousels", "POST", data, a.cookie);
  equal(created.status, 200, "criação persistida");
  const id = created.body.id;
  equal(
    (await request("carousels", "POST", data, a.cookie)).status,
    402,
    "quota gratuita atômica",
  );
  equal(
    (await request("carousels/" + id, "GET", undefined, b.cookie)).status,
    404,
    "leitura isolada por dono",
  );
  equal(
    (await request("carousels/" + id, "PUT", data, b.cookie)).status,
    404,
    "edição isolada por dono",
  );
  equal(
    (await request("carousels/" + id, "DELETE", undefined, b.cookie)).status,
    404,
    "exclusão isolada por dono",
  );
  equal(
    (
      await request(
        "carousels/" + id,
        "PUT",
        { ...data, title: "Atualizado" },
        a.cookie,
      )
    ).status,
    200,
    "edição após teste continua liberada",
  );
  equal(
    (await request("carousels/" + id, "GET", undefined, a.cookie)).body.title,
    "Atualizado",
    "alteração recuperada do banco",
  );
  equal(
    (
      await request(
        "carousels/" + id,
        "PUT",
        { ...data, slides: [null, null] },
        a.cookie,
      )
    ).status,
    400,
    "rejeita slides malformados",
  );
  equal(
    (
      await request(
        "brand",
        "PUT",
        { avatarUrl: "data:image/svg+xml;base64,PHN2Zz4=" },
        a.cookie,
      )
    ).status,
    400,
    "rejeita SVG em avatar",
  );
  equal(
    (
      await request(
        "brand",
        "PUT",
        { displayName: "Marca QA", bgColor: "#123456" },
        a.cookie,
      )
    ).status,
    200,
    "salva marca",
  );
  equal(
    (
      await request(
        "templates",
        "POST",
        { name: "Estilo QA", appearance: { bgColor: "#123456" } },
        a.cookie,
      )
    ).status,
    200,
    "salva estilo",
  );
  equal(
    (await request("templates", "GET", undefined, b.cookie)).body.items.length,
    0,
    "estilos isolados",
  );
  equal(
    (await request("presence", "POST", { page: "editor" }, a.cookie)).status,
    200,
    "presença autenticada",
  );
  equal(
    (await request("webhooks/mercadopago?data.id=123", "POST", {})).status,
    401,
    "webhook forjado rejeitado",
  );
  const order = await db
    .from("payments")
    .insert({ user_id: a.id, amount: 4790 })
    .select("id")
    .single();
  assert.ifError(order.error);
  equal(
    (
      await request(
        "payments/status?id=" + order.data.id,
        "GET",
        undefined,
        b.cookie,
      )
    ).status,
    404,
    "pedido isolado",
  );
  const mismatch = await db.rpc("app_apply_payment", {
    p_order: order.data.id,
    p_payment: "qa-" + randomUUID(),
    p_status: "paid",
    p_amount: 1,
  });
  equal(!!mismatch.error, true, "valor incorreto não libera plano");
  const payment = "qa-" + randomUUID();
  const apply = async (status) => {
    const r = await db.rpc("app_apply_payment", {
      p_order: order.data.id,
      p_payment: payment,
      p_status: status,
      p_amount: 4790,
    });
    assert.ifError(r.error);
  };
  await apply("paid");
  await apply("paid");
  equal(
    (await request("auth/me", "GET", undefined, a.cookie)).body.user.plan,
    "LIFETIME",
    "confirmação idempotente",
  );
  await apply("pending");
  equal(
    (await request("auth/me", "GET", undefined, a.cookie)).body.user.plan,
    "LIFETIME",
    "evento antigo não rebaixa plano",
  );
  await apply("refunded");
  equal(
    (await request("auth/me", "GET", undefined, a.cookie)).body.user.plan,
    "FREE",
    "estorno revoga acesso pago",
  );
  await apply("paid");
  equal(
    (await request("auth/me", "GET", undefined, a.cookie)).body.user.plan,
    "FREE",
    "evento antigo não restaura estorno",
  );
  equal(
    (await request("auth/logout", "POST", {}, a.cookie)).status,
    200,
    "logout",
  );
  equal(
    (await request("carousels", "GET", undefined, a.cookie)).status,
    401,
    "sessão revogada",
  );
  const login = await request("auth/login", "POST", {
    email: a.email,
    password: a.password,
  });
  equal(login.status, 200, "login com senha correta");
  equal(
    (
      await request("auth/login", "POST", {
        email: a.email,
        password: "senha-invalida",
      })
    ).status,
    401,
    "senha incorreta rejeitada",
  );
  equal(
    (
      await request(
        "carousels",
        "GET",
        undefined,
        "mc_session=" + "a".repeat(64),
      )
    ).status,
    401,
    "cookie forjado rejeitado",
  );
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  equal(
    !!(await anon.from("app_users").select("id")).error,
    true,
    "Data API pública sem acesso",
  );
  const adminText = readFileSync(".private/admin-access.txt", "utf8");
  const adminPass = adminText.match(/Senha inicial: (.+)/)[1];
  const adminLogin = await request("auth/login", "POST", {
    email: "suporte.splinkagencia@gmail.com",
    password: adminPass,
  });
  equal(adminLogin.status, 200, "admin entra no login normal");
  equal(
    (await request("admin", "GET", undefined, adminLogin.cookie)).status,
    200,
    "admin autorizado",
  );
  await request("auth/logout", "POST", {}, adminLogin.cookie);
  mkdirSync(".private", { recursive: true });
  writeFileSync(
    ".private/browser-test.json",
    JSON.stringify({ email: a.email, password: a.password, id: a.id }),
  );
  console.log("TOTAL " + count + " verificações aprovadas.");
  writeFileSync(
    ".private/test-results.txt",
    count +
      " verificações de integração aprovadas em " +
      new Date().toISOString(),
  );
  // Keep only first disposable account for browser tests; clean fixtures in finally.
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  for (const id of users) {
    await db.from("audit_events").delete().eq("actor_id", id);
    await db.from("payments").delete().eq("user_id", id);
    if (id !== a.id || process.exitCode)
      await db.from("app_users").delete().eq("id", id);
  }
}
