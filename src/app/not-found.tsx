import Link from "next/link";
import { Header, Footer } from "@/components/site";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-dark)",
        color: "#f8fafc",
      }}
    >
      <Header />
      <main
        id="conteudo"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 24px",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(225, 48, 108, 0.12)",
            border: "1px solid rgba(225, 48, 108, 0.35)",
            padding: "6px 18px",
            borderRadius: "9999px",
            color: "#f472b6",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          <span>⚠️ ERRO 404</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(30px, 5vw, 44px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            marginBottom: "12px",
          }}
        >
          Página não encontrada
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "15px",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          O endereço que você tentou acessar não existe ou foi atualizado. Volte para a página principal para continuar criando seus carrosséis.
        </p>

        <Link
          href="/"
          className="btn-primary-ig"
          style={{
            padding: "14px 32px",
            borderRadius: "9999px",
            fontSize: "15px",
            fontWeight: 800,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✨ Voltar para o Magic Carousels
        </Link>
      </main>
      <Footer />
    </div>
  );
}
