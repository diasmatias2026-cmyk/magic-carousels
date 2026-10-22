import type { Metadata } from "next";
import MagicCarouselsApp from "@/app/page";

export const metadata: Metadata = {
  title: "Magic Carousels Pro Studio — Editor Oficial",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <MagicCarouselsApp initialTab="creator" />;
}
