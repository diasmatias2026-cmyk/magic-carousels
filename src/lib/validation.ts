import { HttpError, text } from "./http";
import { FONTS, FREE_TEMPLATE_IDS, TEMPLATES } from "@/templates";
import type { Slide } from "./types";
export function avatar(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    typeof value !== "string" ||
    value.length > 1400000 ||
    !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value)
  )
    throw new HttpError(400, "Use uma imagem PNG, JPG ou WebP de até 1 MB.");
  return value;
}
export function slides(value: unknown): Slide[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 15)
    throw new HttpError(400, "Use de 2 a 15 slides.");
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new HttpError(400, "Slide inválido.");
    const s = raw as Record<string, unknown>;
    const result: Slide = {
      id: typeof s.id === "string" ? s.id.slice(0, 80) : String(index),
      title: text(s.title, 1, 500, "Título do slide"),
      type: ["cover", "content", "list", "stat", "quote", "cta"].includes(
        String(s.type),
      )
        ? (s.type as Slide["type"])
        : "content",
    };
    for (const key of ["body", "kicker", "stat", "author", "cta"] as const)
      if (s[key] !== undefined) result[key] = text(s[key], 0, 2000, key);
    if (s.bullets !== undefined) {
      if (!Array.isArray(s.bullets) || s.bullets.length > 10)
        throw new HttpError(400, "Lista inválida.");
      result.bullets = s.bullets.map((v) => text(v, 1, 500, "Item"));
    }
    result.image = avatar(s.image);
    result.imageMode = ["top", "background", "card", "avatar"].includes(
      String(s.imageMode),
    )
      ? (s.imageMode as Slide["imageMode"])
      : "none";
    result.align = s.align === "center" ? "center" : "left";
    return result;
  });
}
export function template(id: unknown, plan: string) {
  const t = TEMPLATES.find((t) => t.id === id);
  if (!t) throw new HttpError(400, "Template inválido.");
  if (plan !== "LIFETIME" && !FREE_TEMPLATE_IDS.has(t.id))
    throw new HttpError(402, "Este template faz parte do plano Vitalício.");
  return t.id;
}
export function format(v: unknown) {
  if (!["4:5", "3:4", "1:1", "9:16"].includes(String(v)))
    throw new HttpError(400, "Formato inválido.");
  return String(v);
}
export function appearance(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new HttpError(400, "Personalização inválida.");
  const b = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["bgColor", "textColor", "accent", "primary", "secondary"])
    if (b[key] !== undefined) {
      if (!/^#[a-f0-9]{6}$/i.test(String(b[key])))
        throw new HttpError(400, "Cor inválida.");
      out[key] = b[key];
    }
  for (const key of ["headingFont", "bodyFont"])
    if (b[key] !== undefined) {
      if (!Object.hasOwn(FONTS, String(b[key])))
        throw new HttpError(400, "Fonte inválida.");
      out[key] = b[key];
    }
  for (const key of ["displayName", "handle"])
    if (b[key] !== undefined) out[key] = text(b[key], 0, 60, key);
  if (b.avatarUrl !== undefined) out.avatarUrl = avatar(b.avatarUrl) || null;
  if (b.useBrand !== undefined) out.useBrand = b.useBrand === true;
  if (b.uppercase !== undefined) out.uppercase = b.uppercase === true;
  if (b.titleSize !== undefined) {
    const n = Number(b.titleSize);
    if (!Number.isFinite(n) || n < 18 || n > 60)
      throw new HttpError(400, "Tamanho inválido.");
    out.titleSize = n;
  }
  if (b.customTemplate !== undefined) {
    const t = b.customTemplate as Record<string, unknown>;
    if (!t || typeof t !== "object" || Array.isArray(t))
      throw new HttpError(400, "Template personalizado inválido.");
    if (!["clean", "bold", "gradient", "editorial", "tweet", "card", "neo-brutal", "glass", "vector-business"].includes(String(t.style)) ||
        !["blobs", "grid", "dots", "rings", "corner", "lines", "waves", "geometric-vector", "glass-card", "none"].includes(String(t.decoration)))
      throw new HttpError(400, "Estilo inválido.");
    const colors = t.colors as Record<string, unknown>;
    const fonts = t.fonts as Record<string, unknown>;
    if (!colors || !fonts) throw new HttpError(400, "Cores e fontes são obrigatórias.");
    const safeColors: Record<string, string> = {};
    for (const key of ["bg", "bg2", "text", "muted", "accent", "accent2", "surface", "surfaceText", "borderColor"]) {
      if (key === "borderColor" && colors[key] === undefined) continue;
      if (typeof colors[key] !== "string" || !/^#[a-f0-9]{6}([a-f0-9]{2})?$/i.test(colors[key]))
        throw new HttpError(400, "Cor do template inválida.");
      safeColors[key] = colors[key];
    }
    if (!Object.hasOwn(FONTS, String(fonts.heading)) || !Object.hasOwn(FONTS, String(fonts.body)))
      throw new HttpError(400, "Fonte do template inválida.");
    const id = text(t.id, 1, 80, "Identificador");
    if (!/^custom_[a-zA-Z0-9_-]+$/.test(id)) throw new HttpError(400, "Identificador inválido.");
    out.customTemplate = {
      id, name: text(t.name, 1, 100, "Nome"), category: "Criativo & Agência", niche: "geral",
      style: t.style, decoration: t.decoration, colors: safeColors,
      fonts: { heading: fonts.heading, body: fonts.body }, uppercase: t.uppercase === true,
      badge: "CRIADO POR VOCÊ",
    };
  }
  return out;
}
