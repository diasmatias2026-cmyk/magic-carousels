import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magic Carousels — Crie Carrosséis Virais em Segundos",
  description:
    "Crie carrosséis de alto engajamento para Instagram e LinkedIn. IA inteligente de texto, templates visuais por nicho, upload manual de avatar, edição de fundo e exportação em alta resolução.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/app-icon.png",
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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
