export type SlideType = "cover" | "content" | "list" | "stat" | "quote" | "cta";
export type ImageMode = "none" | "top" | "background";
export type CarouselFormat = "4:5" | "1:1" | "9:16";

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

export const FORMAT_SIZES: Record<CarouselFormat, { w: number; h: number; label: string }> = {
  "4:5": { w: 1080, h: 1350, label: "Retrato 4:5 (Instagram)" },
  "1:1": { w: 1080, h: 1080, label: "Quadrado 1:1" },
  "9:16": { w: 1080, h: 1920, label: "Stories 9:16" },
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

export function uid(prefix = "s") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
