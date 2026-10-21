import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magic Carousels — Crie Carrosséis Virais em Segundos",
  description:
    "Crie carrosséis de alto engajamento para Instagram e LinkedIn. IA inteligente de texto, templates visuais por nicho, upload manual de avatar, edição de fundo e exportação em alta resolução.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
