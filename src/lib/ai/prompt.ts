/**
 * Prompt + parser compartilhados (cliente e servidor).
 * Usado tanto pelo fluxo "Prompt Mágico" (copiar/colar em qualquer IA)
 * quanto pelas integrações de API (Gemini, OpenAI, OpenRouter).
 */
import { getNiche } from "@/data/niches";
import { uid, type GeneratedCarousel, type Slide, type SlideType } from "@/lib/types";

export interface PromptInput {
  topic: string;
  niche: string;
  slideCount: number;
  tone: string;
  audience?: string;
  handle?: string;
  details?: string;
}

export const TONES: Record<string, { label: string; desc: string }> = {
  didatico: { label: "Didático", desc: "didático e claro, como um professor que simplifica" },
  profissional: { label: "Profissional", desc: "profissional e técnico, com autoridade" },
  provocativo: { label: "Provocativo", desc: "provocativo e direto, que quebra crenças" },
  inspirador: { label: "Inspirador", desc: "inspirador e motivacional" },
  descontraido: { label: "Descontraído", desc: "descontraído, leve e bem-humorado" },
};

export function buildPrompt(input: PromptInput) {
  const n = getNiche(input.niche);
  const tone = TONES[input.tone]?.desc ?? TONES.didatico.desc;
  return `Você é um copywriter brasileiro especialista em carrosséis virais para Instagram e LinkedIn.
Crie o TEXTO completo de um carrossel em português do Brasil.

TEMA: "${input.topic}"
NICHO: ${n.name}
PÚBLICO: ${input.audience || "seguidores interessados no nicho"}
TOM: ${tone}
QUANTIDADE DE SLIDES: exatamente ${input.slideCount}${input.handle ? `\nPERFIL: @${input.handle.replace(/^@/, "")}` : ""}${input.details ? `\nINFORMAÇÕES EXTRAS: ${input.details}` : ""}

REGRAS:
- Slide 1 é "cover": gancho fortíssimo no "title" (máx. 60 caracteres), "kicker" curto (máx. 3 palavras) e "body" com uma linha que gera curiosidade.
- Último slide é "cta": chamada para salvar/compartilhar/seguir, com "cta" = texto do botão (máx. 3 palavras).
- Slides do meio: majoritariamente "content" ("title" até 50 caracteres + "body" até 180 caracteres).
  Pode usar no máximo 1 "list" ("bullets" com 3 a 5 itens curtos), 1 "stat" ("stat" = número curto como "73%" ou "3x") e 1 "quote" ("title" = a frase, "author" = autor).
- "caption": legenda magnética completa para Instagram e LinkedIn (gancho nos primeiros 120 caracteres antes do "ver mais", resumo estruturado dos slides, CTA persuasiva e bloco com 10 a 14 hashtags estratégicas nichadas sem shadowban).

RESPONDA APENAS COM O JSON ABAIXO, SEM TEXTO ANTES OU DEPOIS:
{
  "title": "título interno do carrossel",
  "caption": "legenda do post",
  "slides": [
    {"type": "cover", "kicker": "...", "title": "...", "body": "..."},
    {"type": "content", "title": "...", "body": "..."},
    {"type": "list", "title": "...", "bullets": ["...", "..."]},
    {"type": "stat", "stat": "73%", "title": "...", "body": "..."},
    {"type": "quote", "title": "frase", "author": "autor"},
    {"type": "cta", "title": "...", "body": "...", "cta": "Salvar post"}
  ]
}`;
}

const VALID: SlideType[] = ["cover", "content", "list", "stat", "quote", "cta"];
const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);

export function normalizeCarousel(raw: unknown, fallbackTitle = "Meu carrossel"): GeneratedCarousel {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawSlides = Array.isArray(r.slides) ? (r.slides as Record<string, unknown>[]) : Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];

  let slides: Slide[] = rawSlides
    .map((s) => {
      const t = String(s.type || "").toLowerCase();
      const type: SlideType = VALID.includes(t as SlideType) ? (t as SlideType) : s.bullets ? "list" : s.stat ? "stat" : "content";
      return {
        id: uid(),
        type,
        kicker: str(s.kicker),
        title: str(s.title) || str(s.headline) || str(s.titulo) || "",
        body: str(s.body) || str(s.text) || str(s.texto) || str(s.subtitle),
        bullets: Array.isArray(s.bullets) ? (s.bullets as unknown[]).map((b) => String(b).trim()).filter(Boolean).slice(0, 6) : undefined,
        stat: str(s.stat),
        author: str(s.author) || str(s.autor),
        cta: str(s.cta),
      } satisfies Slide;
    })
    .filter((s) => s.title || s.body || s.bullets?.length);

  if (slides.length < 2) throw new Error("Não encontrei slides suficientes na resposta.");
  slides[0].type = "cover";
  const last = slides[slides.length - 1];
  last.type = "cta";
  if (!last.cta) last.cta = "Salvar post";

  let k = 1;
  slides = slides.map((s) => (s.type === "content" ? { ...s, kicker: String(k++).padStart(2, "0") } : s));

  return {
    title: str(r.title) || slides[0].title || fallbackTitle,
    caption: str(r.caption) || str(r.legenda) || "",
    slides,
  };
}

/** Lê a resposta colada da IA: aceita JSON puro, JSON dentro de ```blocos``` ou texto "Slide 1: ...". */
export function parseAIResponse(text: string, fallbackTitle?: string): GeneratedCarousel {
  const cleaned = text.replace(/```(?:json)?/gi, "").replace(/[“”]/g, '"').trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return normalizeCarousel(JSON.parse(cleaned.slice(start, end + 1)), fallbackTitle);
    } catch {
      /* tenta texto livre */
    }
  }
  return normalizeCarousel(parsePlainText(text), fallbackTitle);
}

/** Fallback: "Slide 1 - Título\ntexto..." ou blocos separados por linha em branco. */
function parsePlainText(text: string) {
  const blocks = text
    .split(/\n(?=\s*(?:slide|lâmina|card)\s*\d+)/i)
    .map((b) => b.trim())
    .filter(Boolean);
  const parts = blocks.length > 1 ? blocks : text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const slides = parts.map((b) => {
    const lines = b
      .split("\n")
      .map((l) => l.replace(/^\s*(?:slide|lâmina|card)\s*\d+\s*[:\-–—.)]*\s*/i, "").replace(/^\*+|\*+$/g, "").trim())
      .filter(Boolean);
    const bullets = lines.filter((l) => /^[-•*✓✔]\s+/.test(l)).map((l) => l.replace(/^[-•*✓✔]\s+/, ""));
    const rest = lines.filter((l) => !/^[-•*✓✔]\s+/.test(l));
    const title = (rest[0] || "").replace(/^(t[ií]tulo|title)\s*:\s*/i, "");
    const body = rest.slice(1).join(" ").replace(/^(texto|body|corpo)\s*:\s*/i, "");
    return bullets.length >= 2 ? { type: "list", title, bullets } : { type: "content", title, body };
  });
  return { slides };
}
