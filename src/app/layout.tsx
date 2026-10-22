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
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/favicon.png?v=3", type: "image/png" },
      { url: "/icon.png?v=3", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png?v=3" }],
    shortcut: ["/favicon.ico?v=3"],
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
                  document.addEventListener("contextmenu", function(e) {
                    if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
                      e.preventDefault();
                    }
                  });
                  document.addEventListener("keydown", function(e) {
                    if (
                      e.key === "F12" ||
                      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
                      (e.ctrlKey && (e.key === "U" || e.key === "u"))
                    ) {
                      e.preventDefault();
                    }
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
