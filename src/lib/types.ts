export type SlideType = "cover" | "content" | "list" | "stat" | "quote" | "cta";
export type ImageMode = "none" | "top" | "background" | "card" | "avatar";
export type CarouselFormat = "4:5" | "3:4" | "1:1" | "9:16";

export interface Slide {
  id: string;
  type: SlideType;
  kicker?: string;
  title: string;
  body?: string;
  bullets?: string[];
  stat?: string;
  author?: string;
  cta?: string;
  image?: string;
  imageMode?: ImageMode;
  align?: "left" | "center";
}

export interface GeneratedCarousel {
  title: string;
  caption: string;
  slides: Slide[];
}

export interface BrandData {
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
  primary: string;
  secondary: string;
  accent: string;
  bgColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  useBrand: boolean;
}

export const FORMAT_SIZES: Record<
  CarouselFormat,
  { w: number; h: number; label: string }
> = {
  "4:5": { w: 1080, h: 1350, label: "Retrato 4:5 (Instagram Feed)" },
  "3:4": { w: 1080, h: 1440, label: "Alto 3:4 (Máx. Engajamento)" },
  "1:1": { w: 1080, h: 1080, label: "Quadrado 1:1 (Universal)" },
  "9:16": { w: 1080, h: 1920, label: "Stories / Reels 9:16" },
};

export const DEFAULT_BRAND: BrandData = {
  displayName: "Seu Nome",
  handle: "seuperfil",
  avatarUrl: null,
  primary: "#E1306C",
  secondary: "#833AB4",
  accent: "#FCAF45",
  bgColor: "#FFFFFF",
  textColor: "#111827",
  headingFont: "poppins",
  bodyFont: "inter",
  useBrand: false,
};

let uidCounter = 0;
export function uid(prefix = "s") {
  uidCounter = (uidCounter + 1) % 1000000;
  return `${prefix}_${uidCounter}_${((uidCounter * 2654435761) >>> 0).toString(36)}`;
}
