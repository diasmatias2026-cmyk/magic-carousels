import Link from "next/link";
export function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        Magic<span>Carousels</span>
      </Link>
      <nav aria-label="Principal">
        <Link href="/recursos">Recursos</Link>
        <Link href="/precos">Preços</Link>
        <Link href="/ajuda">Ajuda</Link>
        <Link className="button" href="/app">
          Entrar
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark" href="/">
          Magic<span>Carousels</span>
        </Link>
        <p>Crie, edite e organize seu conteúdo pelo navegador.</p>
        <p>
          Parte do Grupo SplinkApp · Desde 2019
          <br />
          CNPJ 32.657.200/0001-08
        </p>
      </div>
      <nav aria-label="Institucional">
        <Link href="/sobre">Sobre</Link>
        <Link href="/contato">Contato</Link>
        <a href="https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H" target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }}>Canal WhatsApp</a>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos de Uso</Link>
      </nav>
      <a href="mailto:comercial@splinkapp.com.br">comercial@splinkapp.com.br</a>
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
    <div className="saas-shell">
      <Header />
      <main id="conteudo" className="reading">
        <h1>{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  );
}
