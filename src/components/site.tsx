import Link from "next/link";

export function Header() {
  return (
    <header
      style={{
        background: "rgba(10, 10, 14, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 90,
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          userSelect: "none",
        }}
      >
        <img
          src="/favicon.png"
          alt="Magic Carousels Logo"
          style={{
            width: "36px",
            height: "36px",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 14px rgba(225, 48, 108, 0.5))",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "19px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
              Magic
            </span>
            <span
              style={{
                fontSize: "19px",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                background: "var(--ig-sunset)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Carousels
            </span>
          </div>
          <span
            style={{
              fontSize: "8.5px",
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            PRO STUDIO
          </span>
        </div>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link
          href="/"
          style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}
        >
          Início
        </Link>
        <Link
          href="/#section-recursos"
          style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}
        >
          Recursos
        </Link>
        <Link
          href="/#section-hero"
          style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}
        >
          Preços
        </Link>
        <Link
          href="/"
          className="btn-primary-ig"
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            fontSize: "12.5px",
            fontWeight: 800,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ✨ Acessar Estúdio
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: "#08080c",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "40px 24px 30px",
        marginTop: "auto",
        color: "#94a3b8",
        fontSize: "12.5px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "30px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ maxWidth: "340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <img src="/favicon.png" alt="Magic Carousels Logo" style={{ width: "26px", height: "26px" }} />
            <span style={{ fontSize: "17px", fontWeight: 900, color: "#ffffff" }}>Magic</span>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 900,
                background: "var(--ig-sunset)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Carousels
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: "#64748b" }}>
            O estúdio profissional de carrosséis no navegador. Crie artes de alto padrão com inteligência artificial para o Instagram em segundos.
          </p>
          <p style={{ fontSize: "11px", color: "#475569", marginTop: "12px" }}>
            Parte do Grupo SplinkApp · CNPJ 32.657.200/0001-08
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <strong style={{ color: "#ffffff", fontSize: "13px", marginBottom: "4px" }}>Institucional</strong>
          <Link href="/sobre" style={{ color: "#94a3b8", textDecoration: "none" }}>
            Sobre Nós
          </Link>
          <Link href="/contato" style={{ color: "#94a3b8", textDecoration: "none" }}>
            Contato & Suporte
          </Link>
          <a
            href="https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#25D366", textDecoration: "none", fontWeight: 700 }}
          >
            💬 Canal Oficial WhatsApp
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <strong style={{ color: "#ffffff", fontSize: "13px", marginBottom: "4px" }}>Legal & Privacidade</strong>
          <Link href="/termos" style={{ color: "#94a3b8", textDecoration: "none" }}>
            Termos de Uso
          </Link>
          <Link href="/privacidade" style={{ color: "#94a3b8", textDecoration: "none" }}>
            Política de Privacidade
          </Link>
          <a href="mailto:comercial@splinkapp.com.br" style={{ color: "#f472b6", textDecoration: "none" }}>
            comercial@splinkapp.com.br
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "30px auto 0",
          paddingTop: "20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "11.5px",
          color: "#64748b",
        }}
      >
        <span>© 2026 Magic Carousels. Todos os direitos reservados.</span>
        <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
          🔒 Ambiente Seguro & Criptografado
        </span>
      </div>
    </footer>
  );
}

export function PublicPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
          maxWidth: "880px",
          margin: "0 auto",
          width: "100%",
          padding: "48px 24px 80px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 900,
            letterSpacing: "-1px",
            color: "#ffffff",
            marginBottom: "28px",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            background: "rgba(18, 18, 24, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "32px 28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            lineHeight: 1.7,
            color: "#cbd5e1",
          }}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
