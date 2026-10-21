"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  FREE_TEMPLATE_IDS,
  FONTS,
  type FontKey,
} from "@/templates";
import { NICHES } from "@/data/niches";
import { buildPrompt, parseAIResponse } from "@/lib/ai/prompt";
import {
  FORMAT_SIZES,
  uid,
  type Slide,
  type CarouselFormat,
} from "@/lib/types";
import { SlideView } from "./slide";
import { PRICE_LABEL } from "@/lib/pricing";
type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
  freeTrialsUsed: number;
  isAdmin: boolean;
  brandKit: Record<string, unknown> | null;
};
type Project = {
  id: string;
  title: string;
  format: CarouselFormat;
  updated_at: string;
};
type SavedStyle = {
  id: string;
  data: { name: string; appearance: Record<string, unknown> };
};
type Order = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};
type Admin = {
  totalUsers: number;
  paidRevenue: number;
  revenueScope: string;
  users: (User & { created_at: string })[];
  payments: Order[];
  sessions: { user_id: string; last_seen_at: string; current_page: string }[];
};
async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || "Não foi possível concluir.");
  return b;
}
function blank(): Slide[] {
  return [
    {
      id: "cover",
      type: "cover",
      title: "Sua próxima ideia",
      body: "Apresente o tema que você quer compartilhar.",
    },
    {
      id: "content",
      type: "content",
      title: "Desenvolva sua ideia",
      body: "Adicione um exemplo, uma dica ou uma explicação.",
    },
    {
      id: "cta",
      type: "cta",
      title: "Continue a conversa",
      body: "Convide seu público a compartilhar uma experiência.",
      cta: "Salve para depois",
    },
  ];
}
export default function Workspace() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [register, setRegister] = useState(false),
    [tab, setTab] = useState("projects"),
    [projects, setProjects] = useState<Project[]>([]),
    [styles, setStyles] = useState<SavedStyle[]>([]);
  const [id, setId] = useState<string | null>(null),
    [title, setTitle] = useState("Meu carrossel"),
    [slides, setSlides] = useState<Slide[]>(blank()),
    [caption, setCaption] = useState(""),
    [format, setFormat] = useState<CarouselFormat>("4:5"),
    [templateId, setTemplateId] = useState([...FREE_TEMPLATE_IDS][0]),
    [appearance, setAppearance] = useState<Record<string, unknown>>({}),
    [index, setIndex] = useState(0),
    [dirty, setDirty] = useState(false);
  const [topic, setTopic] = useState(""),
    [niche, setNiche] = useState("marketing"),
    [tone, setTone] = useState("didatico"),
    [slideCount, setSlideCount] = useState(7),
    [prompt, setPrompt] = useState(""),
    [pasted, setPasted] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [styleName, setStyleName] = useState("Meu estilo");
  const [admin, setAdmin] = useState<Admin | null>(null),
    [payments, setPayments] = useState<Order[]>([]);
  const [exported, setExported] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  async function refresh() {
    const r = await api("auth/me");
    setUser(r.user);
    return r.user as User | null;
  }
  async function loadProjects() {
    setProjects((await api("carousels")).items);
  }
  async function loadStyles() {
    setStyles((await api("templates")).items);
  }
  async function run(fn: () => Promise<void>) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api("auth/me")
      .then((r) => {
        setUser(r.user);
        setAppearance(r.user?.brandKit || {});
        setRegister(
          new URLSearchParams(location.search).get("register") === "1",
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    api("carousels")
      .then((r) => setProjects(r.items))
      .catch((e) => setError(e.message));
    api("templates")
      .then((r) => setStyles(r.items))
      .catch((e) => setError(e.message));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    const ping = () => {
      if (document.visibilityState === "visible")
        api("presence", "POST", { page: tab }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 30000);
    return () => clearInterval(timer);
  }, [user?.id, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (tab !== "admin" || !user?.isAdmin) return;
    let canceled = false;
    const poll = () =>
      api("admin")
        .then((data) => {
          if (!canceled) setAdmin(data);
        })
        .catch((e) => {
          if (!canceled) setError(e.message);
        });
    poll();
    const timer = setInterval(poll, 15000);
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }, [tab, user?.isAdmin]);
  useEffect(() => {
    if (tab === "billing" && user)
      api("payments/status")
        .then((r) => setPayments(r.items))
        .catch((e) => setError(e.message));
  }, [tab, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    const q = new URLSearchParams(location.search);
    if (q.get("payment") === "return") {
      api(
        "payments/status" +
          (q.get("payment_id")
            ? "?payment_id=" + encodeURIComponent(q.get("payment_id")!)
            : ""),
      )
        .then(() => refresh())
        .then(() => {
          setTab("billing");
          setMessage(
            "Status consultado. A confirmação pode levar alguns instantes.",
          );
        })
        .catch((e) => setError(e.message));
      history.replaceState(null, "", "/app");
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  function updateSlide(v: Partial<Slide>) {
    setSlides((s) => s.map((old, i) => (i === index ? { ...old, ...v } : old)));
    setDirty(true);
  }
  function updateAppearance(v: Record<string, unknown>) {
    setAppearance((a) => ({ ...a, ...v }));
    setDirty(true);
  }
  async function openProject(pid: string) {
    const p = await api("carousels/" + pid);
    setId(p.id);
    setTitle(p.title);
    setSlides(p.slides);
    setCaption(p.caption);
    setTemplateId(p.template_id);
    setFormat(p.format);
    setAppearance(p.appearance || {});
    setIndex(0);
    setDirty(false);
    setTab("editor");
  }
  function canLeave() {
    return (
      !dirty ||
      window.confirm("Há alterações não salvas. Descartar essas alterações?")
    );
  }
  function newProject(tid = templateId) {
    if (!canLeave()) return;
    setId(null);
    setTitle("Meu carrossel");
    setSlides(blank());
    setCaption("");
    setTemplateId(tid);
    setAppearance(user?.brandKit || {});
    setIndex(0);
    setDirty(false);
    setTab("editor");
  }
  async function save() {
    const data = {
      title,
      slides,
      caption,
      templateId,
      format,
      appearance,
      niche,
    };
    if (id) await api("carousels/" + id, "PUT", data);
    else {
      const r = await api("carousels", "POST", data);
      setId(r.id);
      await refresh();
    }
    setDirty(false);
    await loadProjects();
    setMessage("Projeto salvo no seu perfil.");
  }
  async function exportFile(kind: "png" | "zip" | "pdf") {
    await save();
    await document.fonts.ready;
    const { toPng } = await import("html-to-image");
    const nodes = Array.from(
      exportRef.current?.children || [],
    ) as HTMLElement[];
    const { w, h } = FORMAT_SIZES[format];
    const capture = async (node: HTMLElement) => {
      if (node.scrollHeight > node.clientHeight + 1)
        throw new Error(
          "Há texto maior que o slide. Reduza o conteúdo antes de exportar.",
        );
      return toPng(node, { pixelRatio: 3, cacheBust: true });
    };
    const download = (url: string, name: string) => {
      setExported({ url, name });
    };
    if (kind === "png")
      download(await capture(nodes[index]), "slide-" + (index + 1) + ".png");
    if (kind === "zip") {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (let n = 0; n < nodes.length; n++)
        zip.file(
          "slide-" + String(n + 1).padStart(2, "0") + ".png",
          (await capture(nodes[n])).split(",")[1],
          { base64: true },
        );
      download(
        "data:application/zip;base64," +
          (await zip.generateAsync({ type: "base64" })),
        "carrossel.zip",
      );
    }
    if (kind === "pdf") {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [w, h],
        hotfixes: ["px_scaling"],
      });
      for (let n = 0; n < nodes.length; n++) {
        if (n) pdf.addPage([w, h]);
        pdf.addImage(await capture(nodes[n]), "PNG", 0, 0, w, h);
      }
      download(pdf.output("datauristring"), "carrossel.pdf");
    }
    setMessage("Arquivo pronto. Use o botão Baixar arquivo para salvar.");
  }
  async function upload(file: File | undefined, target: "avatar" | "slide") {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1000000
    )
      throw new Error("Escolha PNG, JPG ou WebP de até 1 MB.");
    const url = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    if (target === "avatar") updateAppearance({ avatarUrl: url });
    else updateSlide({ image: url, imageMode: "top" });
  }
  if (loading)
    return (
      <main id="conteudo" className="auth-wrap">
        <p role="status">Abrindo seu espaço…</p>
      </main>
    );
  if (!user)
    return (
      <main id="conteudo" className="auth-wrap">
        <Link className="wordmark" href="/">
          Magic<span>Carousels</span>
        </Link>
        <section className="auth-card">
          <h1>
            {register
              ? "Comece seu primeiro carrossel"
              : "Bom ter você de volta"}
          </h1>
          <p>
            {register
              ? "Crie uma conta e experimente com 1 projeto gratuito."
              : "Entre para acessar seus projetos."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              run(async () => {
                await api("auth/" + (register ? "register" : "login"), "POST", {
                  name: data.get("name"),
                  email: data.get("email"),
                  password: data.get("password"),
                  acceptTerms: data.get("terms") === "on",
                });
                await refresh();
              });
            }}
          >
            {register && (
              <label>
                Seu nome
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
            )}
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 12 : 1}
                maxLength={72}
                required
              />
              {register && <small>Use de 12 a 72 caracteres.</small>}
            </label>
            {register && (
              <label className="check">
                <input name="terms" type="checkbox" required />
                Li e aceito os{" "}
                <Link href="/termos" target="_blank">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank">
                  Política de Privacidade
                </Link>
                .
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Aguarde…" : register ? "Criar minha conta" : "Entrar"}
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Já tenho conta" : "Criar conta gratuita"}
          </button>
          <p>
            <Link href="/contato">Preciso de ajuda para acessar</Link>
          </p>
        </section>
      </main>
    );
  const slide = slides[index];
  const nav = [
    ["projects", "Meus projetos"],
    ["editor", "Editor"],
    ["templates", "Templates"],
    ["brand", "Minha marca"],
    ["billing", "Meu plano"],
    ...(user.isAdmin ? [["admin", "Administração"]] : []),
  ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link className="wordmark" href="/">
          Magic<span>Carousels</span>
        </Link>
        <nav aria-label="Área do cliente">
          {nav.map(([key, label]) => (
            <button
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <strong>{user.name}</strong>
          <small>
            {user.plan === "LIFETIME"
              ? "Acesso Vitalício"
              : user.freeTrialsUsed
                ? "Teste utilizado"
                : "1 projeto gratuito"}
          </small>
          <Link href="/contato">Ajuda e suporte</Link>
          <button
            disabled={busy}
            onClick={() => {
              if (canLeave())
                run(async () => {
                  await api("auth/logout", "POST");
                  setUser(null);
                  setDirty(false);
                });
            }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main id="conteudo" className="work-main">
        <header className="work-header">
          <div>
            <h1>{nav.find((n) => n[0] === tab)?.[1]}</h1>
            <p>
              {tab === "editor"
                ? "Dê forma à sua próxima ideia."
                : tab === "projects"
                  ? "Seu conteúdo, organizado e pronto para continuar."
                  : "Seu espaço no Magic Carousels."}
            </p>
          </div>
          {tab !== "editor" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => newProject()}
            >
              Novo carrossel
            </button>
          )}
        </header>
        <div aria-live="polite">
          {exported && (
            <p>
              <a
                className="button primary"
                href={exported.url}
                download={exported.name}
              >
                Baixar arquivo: {exported.name}
              </a>
            </p>
          )}
          {message && <p className="notice">{message}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        {tab === "projects" && (
          <section>
            {projects.length === 0 ? (
              <div className="empty">
                <h2>Sua primeira ideia começa aqui</h2>
                <p>
                  Escolha um template, escreva seus slides e salve seu primeiro
                  projeto.
                </p>
                <button className="primary" onClick={() => setTab("templates")}>
                  Explorar templates
                </button>
              </div>
            ) : (
              <div className="project-list">
                {projects.map((p) => (
                  <article key={p.id}>
                    <div>
                      <h2>{p.title}</h2>
                      <p>
                        {p.format} · Atualizado em{" "}
                        {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="actions">
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (canLeave()) run(() => openProject(p.id));
                        }}
                      >
                        Editar
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api("carousels", "POST", {
                              duplicateId: p.id,
                            });
                            await loadProjects();
                            await refresh();
                            setMessage("Cópia criada.");
                          })
                        }
                      >
                        Duplicar
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Excluir este projeto definitivamente?",
                            )
                          )
                            run(async () => {
                              await api("carousels/" + p.id, "DELETE");
                              await loadProjects();
                              if (id === p.id) {
                                setId(null);
                                setDirty(false);
                              }
                              setMessage("Projeto excluído.");
                            });
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {tab === "templates" && (
          <section>
            <div className="filters">
              <label>
                Buscar template
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou nicho"
                />
              </label>
              <label>
                Categoria
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Todos</option>
                  {TEMPLATE_CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="template-grid">
              {TEMPLATES.filter(
                (t) =>
                  (category === "Todos" || t.category === category) &&
                  (t.name + " " + t.niche)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              ).map((t) => (
                <button
                  className="template-option"
                  key={t.id}
                  disabled={busy}
                  onClick={() => {
                    if (
                      user.plan !== "LIFETIME" &&
                      !FREE_TEMPLATE_IDS.has(t.id)
                    ) {
                      setTab("billing");
                      setMessage("Este template faz parte do plano Vitalício.");
                    } else newProject(t.id);
                  }}
                >
                  <div
                    className="template-sample"
                    style={{
                      background: t.colors.bg,
                      color: t.colors.text,
                      fontFamily: FONTS[t.fonts.heading].css,
                    }}
                  >
                    <span style={{ color: t.colors.accent }}>{t.category}</span>
                    <strong>
                      Uma ideia.
                      <br />
                      Muitas formas.
                    </strong>
                    <i style={{ background: t.colors.accent }} />
                  </div>
                  <div>
                    {t.name}
                    <small>
                      {FREE_TEMPLATE_IDS.has(t.id)
                        ? "Disponível no teste"
                        : "Vitalício"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        {tab === "editor" && (
          <>
            <div className="editor-toolbar">
              <label className="title-field">
                Nome do projeto
                <input
                  value={title}
                  maxLength={140}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <span className="muted">
                {dirty ? "Alterações não salvas" : id ? "Salvo" : "Rascunho"}
              </span>
              <div className="actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => run(save)}
                >
                  {busy ? "Aguarde…" : "Salvar projeto"}
                </button>
                {(["png", "zip", "pdf"] as const).map((k) => (
                  <button
                    key={k}
                    disabled={busy}
                    onClick={() => run(() => exportFile(k))}
                  >
                    {k === "png" ? "PNG atual" : k.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="editor-grid">
              <section className="editor-controls">
                <details>
                  <summary>Criar conteúdo ou importar resposta</summary>
                  <label>
                    Tema
                    <input
                      value={topic}
                      maxLength={300}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="O que você quer explicar?"
                    />
                  </label>
                  <div className="field-pair">
                    <label>
                      Nicho
                      <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                      >
                        {NICHES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tom
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      >
                        {[
                          "didatico",
                          "profissional",
                          "inspirador",
                          "descontraido",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Quantidade de slides
                    <input
                      type="number"
                      min={2}
                      max={15}
                      value={slideCount}
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                    />
                  </label>
                  <div className="actions">
                    <button
                      disabled={busy || topic.length < 5}
                      onClick={() =>
                        setPrompt(
                          buildPrompt({ topic, niche, tone, slideCount }),
                        )
                      }
                    >
                      Montar prompt
                    </button>
                    <button
                      disabled={busy || topic.length < 5}
                      onClick={() => {
                        if (canLeave())
                          run(async () => {
                            const r = await api("generate", "POST", {
                              topic,
                              niche,
                              tone,
                              slideCount,
                              templateId,
                              format,
                            });
                            await openProject(r.id);
                            await refresh();
                            await loadProjects();
                          });
                      }}
                    >
                      Gerar com IA
                    </button>
                  </div>
                  <small>
                    A IA direta depende de um provedor ativo. O prompt pode ser
                    usado em uma IA da sua escolha.
                  </small>
                  {prompt && (
                    <>
                      <label>
                        Prompt pronto
                        <textarea readOnly value={prompt} rows={5} />
                      </label>
                      <button
                        onClick={() =>
                          run(async () => {
                            await navigator.clipboard.writeText(prompt);
                            setMessage("Prompt copiado.");
                          })
                        }
                      >
                        Copiar prompt
                      </button>
                    </>
                  )}
                  <label>
                    Resposta da IA
                    <textarea
                      value={pasted}
                      maxLength={100000}
                      rows={4}
                      onChange={(e) => setPasted(e.target.value)}
                      placeholder="Cole JSON ou texto organizado por Slide 1, Slide 2…"
                    />
                  </label>
                  <button
                    disabled={busy || !pasted}
                    onClick={() => {
                      if (canLeave())
                        run(async () => {
                          const r = parseAIResponse(pasted, topic);
                          setSlides(r.slides);
                          setTitle(r.title.slice(0, 140));
                          setCaption(r.caption);
                          setIndex(0);
                          setDirty(true);
                          setMessage(
                            "Conteúdo importado. Revise os textos e salve.",
                          );
                        });
                    }}
                  >
                    Importar para o editor
                  </button>
                </details>
                <h2>
                  Slide {index + 1} de {slides.length}
                </h2>
                <label>
                  Título
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={slide.title}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </label>
                <label>
                  Texto
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={slide.body || ""}
                    onChange={(e) => updateSlide({ body: e.target.value })}
                  />
                </label>
                <label>
                  Lista (um item por linha)
                  <textarea
                    rows={3}
                    value={slide.bullets?.join("\n") || ""}
                    onChange={(e) =>
                      updateSlide({
                        bullets: e.target.value
                          ? e.target.value.split("\n").slice(0, 10)
                          : undefined,
                      })
                    }
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Chamada final
                    <input
                      value={slide.cta || ""}
                      maxLength={100}
                      onChange={(e) => updateSlide({ cta: e.target.value })}
                    />
                  </label>
                  <label>
                    Alinhamento
                    <select
                      value={slide.align || "left"}
                      onChange={(e) =>
                        updateSlide({
                          align: e.target.value as "left" | "center",
                        })
                      }
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                    </select>
                  </label>
                </div>
                <details>
                  <summary>Imagem do slide</summary>
                  <label>
                    Enviar imagem (até 1 MB)
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        run(() => upload(e.target.files?.[0], "slide"))
                      }
                    />
                  </label>
                  {slide.image && (
                    <>
                      <label>
                        Posição
                        <select
                          value={slide.imageMode}
                          onChange={(e) =>
                            updateSlide({
                              imageMode: e.target.value as Slide["imageMode"],
                            })
                          }
                        >
                          <option value="top">Acima do texto</option>
                          <option value="background">Plano de fundo</option>
                        </select>
                      </label>
                      <button
                        onClick={() =>
                          updateSlide({ image: undefined, imageMode: "none" })
                        }
                      >
                        Remover imagem
                      </button>
                    </>
                  )}
                </details>
                <div className="actions">
                  <button
                    disabled={slides.length >= 15}
                    onClick={() => {
                      setSlides((s) => [
                        ...s,
                        {
                          id: uid(),
                          type: "content",
                          title: "Nova ideia",
                          body: "Desenvolva este ponto.",
                        },
                      ]);
                      setIndex(slides.length);
                      setDirty(true);
                    }}
                  >
                    Adicionar slide
                  </button>
                  <button
                    disabled={slides.length <= 2}
                    onClick={() => {
                      setSlides((s) => s.filter((_, i) => i !== index));
                      setIndex(Math.max(0, index - 1));
                      setDirty(true);
                    }}
                  >
                    Excluir slide
                  </button>
                </div>
                <details>
                  <summary>Legenda da publicação</summary>
                  <label>
                    Legenda e hashtags
                    <textarea
                      rows={6}
                      value={caption}
                      maxLength={4000}
                      onChange={(e) => {
                        setCaption(e.target.value);
                        setDirty(true);
                      }}
                    />
                  </label>
                  <button
                    onClick={() =>
                      run(async () => {
                        await navigator.clipboard.writeText(caption);
                        setMessage("Legenda copiada.");
                      })
                    }
                  >
                    Copiar legenda
                  </button>
                </details>
              </section>
              <section
                className="preview-panel"
                aria-label="Prévia do carrossel"
              >
                <div className="preview-stage">
                  <SlideView
                    slide={slide}
                    index={index}
                    total={slides.length}
                    templateId={templateId}
                    format={format}
                    appearance={appearance}
                  />
                </div>
                <div className="slide-nav">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={"Ir para slide " + (i + 1)}
                      aria-current={index === i ? "step" : undefined}
                      onClick={() => setIndex(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="actions">
                  {[-1, 1].map((dir) => (
                    <button
                      key={dir}
                      disabled={
                        dir < 0 ? index === 0 : index === slides.length - 1
                      }
                      onClick={() => {
                        const next = [...slides];
                        [next[index + dir], next[index]] = [
                          next[index],
                          next[index + dir],
                        ];
                        setSlides(next);
                        setIndex(index + dir);
                        setDirty(true);
                      }}
                    >
                      {dir < 0 ? "Mover antes" : "Mover depois"}
                    </button>
                  ))}
                </div>
                <small>
                  {FORMAT_SIZES[format].w} × {FORMAT_SIZES[format].h} pixels na
                  exportação. Revise se todo o texto cabe.
                </small>
              </section>
              <section className="appearance-panel">
                <h2>Visual</h2>
                <label>
                  Formato
                  <select
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value as CarouselFormat);
                      setDirty(true);
                    }}
                  >
                    {Object.entries(FORMAT_SIZES).map(([key, v]) => (
                      <option key={key} value={key}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Template
                  <select
                    value={templateId}
                    onChange={(e) => {
                      setTemplateId(e.target.value);
                      setDirty(true);
                    }}
                  >
                    {TEMPLATES.filter(
                      (t) =>
                        user.plan === "LIFETIME" || FREE_TEMPLATE_IDS.has(t.id),
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <AppearanceFields
                  appearance={appearance}
                  onChange={updateAppearance}
                />
                <button
                  onClick={() => {
                    setAppearance(user.brandKit || {});
                    setDirty(true);
                  }}
                >
                  Aplicar minha marca
                </button>
                <h3>Estilos salvos</h3>
                <label>
                  Nome do estilo
                  <input
                    value={styleName}
                    maxLength={60}
                    onChange={(e) => setStyleName(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await api("templates", "POST", {
                        name: styleName,
                        appearance,
                      });
                      await loadStyles();
                      setMessage("Estilo salvo.");
                    })
                  }
                >
                  Salvar estilo
                </button>
                {styles.map((s) => (
                  <div key={s.id} className="actions">
                    <button
                      onClick={() => {
                        setAppearance(s.data.appearance);
                        setDirty(true);
                      }}
                    >
                      {s.data.name}
                    </button>
                    <button
                      aria-label={"Excluir estilo " + s.data.name}
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await api("templates", "DELETE", { id: s.id });
                          await loadStyles();
                        })
                      }
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
        {tab === "brand" && (
          <section className="settings">
            <h2>Reconhecível em cada publicação</h2>
            <p>As configurações salvas serão aplicadas aos novos projetos.</p>
            <label>
              Nome de exibição
              <input
                value={String(appearance.displayName || "")}
                maxLength={60}
                onChange={(e) =>
                  updateAppearance({ displayName: e.target.value })
                }
              />
            </label>
            <label>
              Perfil (@)
              <input
                value={String(appearance.handle || "")}
                maxLength={60}
                onChange={(e) => updateAppearance({ handle: e.target.value })}
              />
            </label>
            <label>
              Avatar (até 1 MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  run(() => upload(e.target.files?.[0], "avatar"))
                }
              />
            </label>
            {!!appearance.avatarUrl && (
              <>
                <img
                  src={String(appearance.avatarUrl)}
                  alt="Seu avatar"
                  width={64}
                  height={64}
                />
                <button onClick={() => updateAppearance({ avatarUrl: null })}>
                  Remover avatar
                </button>
              </>
            )}
            <AppearanceFields
              appearance={appearance}
              onChange={updateAppearance}
            />
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api("brand", "PUT", appearance);
                  await refresh();
                  setMessage("Sua marca foi salva.");
                })
              }
            >
              Salvar minha marca
            </button>
            <h2>Segurança da conta</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run(async () => {
                  await api("auth/password", "POST", {
                    currentPassword: f.get("current"),
                    newPassword: f.get("new"),
                  });
                  setUser(null);
                  setDirty(false);
                  setMessage("Senha alterada. Entre novamente.");
                });
              }}
            >
              <label>
                Senha atual
                <input
                  name="current"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                Nova senha
                <input
                  name="new"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button disabled={busy}>Alterar senha e encerrar sessões</button>
            </form>
          </section>
        )}
        {tab === "billing" && (
          <section className="settings">
            <h2>
              {user.plan === "LIFETIME"
                ? "Seu acesso Vitalício está ativo"
                : "Mais espaço para criar"}
            </h2>
            <p>
              Teste: 1 carrossel gratuito, com edição e exportação do projeto
              salvo.
            </p>
            <p>
              Vitalício: pagamento único de <strong>{PRICE_LABEL}</strong>,
              todos os templates e até 50 novos carrosséis por 24 horas,
              enquanto o serviço estiver em operação.
            </p>
            {user.plan !== "LIFETIME" && (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await api("payments/create", "POST");
                    location.assign(r.url);
                  })
                }
              >
                Continuar no Mercado Pago
              </button>
            )}
            <p>
              Você escolhe a forma de pagamento no Mercado Pago. A liberação
              ocorre após a confirmação.
            </p>
            <Link href="/termos">Condições de uso e compra</Link>
            <h3>Seus pagamentos</h3>
            {payments.length ? (
              payments.map((p) => (
                <p key={p.id}>
                  {new Date(p.created_at).toLocaleDateString("pt-BR")} ·{" "}
                  {(p.amount / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  · {p.status}
                </p>
              ))
            ) : (
              <p>Nenhum pagamento registrado.</p>
            )}
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await refresh();
                  setPayments((await api("payments/status")).items);
                  setMessage("Status atualizado.");
                })
              }
            >
              Atualizar status
            </button>
          </section>
        )}
        {tab === "admin" && user.isAdmin && (
          <section>
            {!admin ? (
              <p>Carregando painel…</p>
            ) : (
              <>
                <div className="metrics">
                  <div>
                    <span>Cadastros</span>
                    <strong>{admin.totalUsers}</strong>
                  </div>
                  <div>
                    <span>Usuários ativos agora</span>
                    <strong>
                      {new Set(admin.sessions.map((s) => s.user_id)).size}
                    </strong>
                  </div>
                  <div>
                    <span>Vendas aprovadas</span>
                    <strong>
                      {(admin.paidRevenue / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </div>
                </div>
                <p className="muted">
                  Atualização a cada 15 segundos. Ativo = sessão com atividade
                  nos últimos 90 segundos. Receita:{" "}
                  {admin.revenueScope.toLowerCase()}.
                </p>
                <h2>Atividade recente</h2>
                {admin.sessions.length ? (
                  admin.sessions.map((s, i) => (
                    <p key={i}>
                      {admin.users.find((u) => u.id === s.user_id)?.email ||
                        s.user_id}{" "}
                      · {s.current_page} ·{" "}
                      {new Date(s.last_seen_at).toLocaleTimeString("pt-BR")}
                    </p>
                  ))
                ) : (
                  <p>Nenhum usuário ativo.</p>
                )}
                <h2>Últimos 100 cadastros</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Plano</th>
                        <th>Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admin.users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.plan}</td>
                          <td>
                            {new Date(u.created_at).toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h2>Últimos 100 pagamentos</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admin.payments.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id.slice(0, 8)}</td>
                          <td>
                            {(p.amount / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td>{p.status}</td>
                          <td>
                            {new Date(p.created_at).toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
        <footer className="app-footer">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos de Uso</Link>
          <a href="mailto:comercial@splinkapp.com.br">Contato</a>
        </footer>
      </main>
      <div ref={exportRef} className="export-stage" aria-hidden="true">
        {slides.map((s, i) => (
          <SlideView
            key={s.id}
            slide={s}
            index={i}
            total={slides.length}
            templateId={templateId}
            format={format}
            appearance={appearance}
          />
        ))}
      </div>
    </div>
  );
}
function AppearanceFields({
  appearance: a,
  onChange,
}: {
  appearance: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="color-fields">
        {[
          ["bgColor", "Fundo", "#14141a"],
          ["textColor", "Texto", "#ffffff"],
          ["accent", "Destaque", "#e1306c"],
        ].map(([key, label, fallback]) => (
          <label key={key}>
            {label}
            <input
              type="color"
              value={String(a[key] || fallback)}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {[
        ["headingFont", "Fonte do título"],
        ["bodyFont", "Fonte do texto"],
      ].map(([key, label]) => (
        <label key={key}>
          {label}
          <select
            value={String(a[key] || "jakarta")}
            onChange={(e) => onChange({ [key]: e.target.value })}
          >
            {Object.keys(FONTS).map((k) => (
              <option key={k} value={k}>
                {FONTS[k as FontKey].label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Tamanho do título
        <input
          type="range"
          min={18}
          max={60}
          value={Number(a.titleSize || 32)}
          onChange={(e) => onChange({ titleSize: Number(e.target.value) })}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={!!a.uppercase}
          onChange={(e) => onChange({ uppercase: e.target.checked })}
        />
        Títulos em maiúsculas
      </label>
    </>
  );
}
