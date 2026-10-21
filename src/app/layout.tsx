import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./saas.css";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Magic Carousels — Editor online de carrosséis",
    template: "%s | Magic Carousels",
  },
  description:
    "Crie carrosséis com templates, personalize com sua marca e exporte suas artes. Um espaço online para organizar seu conteúdo.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Magic Carousels",
    title: "Magic Carousels — Suas ideias em carrosséis",
    description: "Crie, edite e organize conteúdo visual direto no navegador.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
