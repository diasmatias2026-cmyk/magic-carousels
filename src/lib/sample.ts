import { getNiche, type NicheContent } from "@/data/niches";
import { uid, type GeneratedCarousel, type Slide } from "./types";

/** Monta um carrossel completo a partir do banco de conteúdo de um nicho. */
export function buildNicheCarousel(nicheId: string, slideCount = 8, topic?: string): GeneratedCarousel {
  const n = getNiche(nicheId);
  const count = Math.max(4, Math.min(10, slideCount));
  const slides: Slide[] = [];

  slides.push({
    id: uid(),
    type: "cover",
    kicker: n.cover.kicker,
    title: topic ? capitalize(topic) : n.cover.title,
    body: n.cover.subtitle,
  });

  const middle = buildMiddle(n, count - 2);
  slides.push(...middle);

  slides.push({ id: uid(), type: "cta", title: n.cta.title, body: n.cta.body, cta: n.cta.cta });

  return {
    title: topic ? capitalize(topic) : n.cover.title,
    caption: buildCaption(n, topic),
    slides,
  };
}

function buildMiddle(n: NicheContent, howMany: number): Slide[] {
  const pool: Slide[] = [
    ...n.tips.map((t, i) => ({ id: uid(), type: "content" as const, kicker: String(i + 1).padStart(2, "0"), title: t.title, body: t.body })),
  ];
  const extras: Slide[] = [
    { id: uid(), type: "stat", stat: n.stat.value, title: n.stat.title, body: n.stat.body },
    { id: uid(), type: "list", title: n.list.title, bullets: n.list.bullets },
    { id: uid(), type: "quote", title: n.quote.text, author: n.quote.author },
  ];
  const out: Slide[] = [];
  // intercala: 2 dicas, 1 extra...
  let ti = 0;
  let ei = 0;
  while (out.length < howMany) {
    if ((out.length + 1) % 3 === 0 && ei < extras.length) out.push(extras[ei++]);
    else if (ti < pool.length) out.push(pool[ti++]);
    else if (ei < extras.length) out.push(extras[ei++]);
    else break;
  }
  // renumera as dicas
  let k = 1;
  for (const s of out) if (s.type === "content") s.kicker = String(k++).padStart(2, "0");
  return out;
}

function buildCaption(n: NicheContent, topic?: string) {
  const t = topic ? capitalize(topic) : n.cover.title;
  return `${n.emoji} ${t}\n\n${n.cover.subtitle}\n\nArrasta para o lado e salva para consultar depois. Qual dica você vai aplicar primeiro? Me conta nos comentários 👇\n\n${n.hashtags.join(" ")}`;
}

export function capitalize(s: string) {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
