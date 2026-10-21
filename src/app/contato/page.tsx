import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Vamos conversar",
  description: "Vamos conversar — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/contato" },
};
export default function Page() {
  return (
    <PublicPage title="Vamos conversar">
      <p>
        Para dúvidas sobre a conta, pagamentos, suporte ou privacidade, escreva
        para:
      </p>
      <p>
        <a className="contact-link" href="mailto:comercial@splinkapp.com.br">
          comercial@splinkapp.com.br
        </a>
      </p>
      <p>
        Informe o e-mail da conta e descreva o que aconteceu. Para pagamentos,
        inclua o identificador do pedido. Nunca envie sua senha, código de
        acesso ou dados completos do cartão.
      </p>
      <p>
        📲 <strong>Canal Oficial no WhatsApp:</strong>{" "}
        <a
          href="https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#25D366", fontWeight: 700 }}
        >
          Acessar Canal Magic Carousels no WhatsApp
        </a>
      </p>
      <p>
        Magic Carousels · Grupo SplinkApp
        <br />
        CNPJ 32.657.200/0001-08
      </p>
      <Link href="/ajuda">Consultar dúvidas frequentes</Link>
    </PublicPage>
  );
}
