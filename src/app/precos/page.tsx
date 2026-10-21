import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Comece grátis. Amplie quando fizer sentido.",
  description:
    "Comece grátis. Amplie quando fizer sentido. — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/precos" },
};
export default function Page() {
  return (
    <PublicPage title="Comece grátis. Amplie quando fizer sentido.">
      <div className="pricing-grid">
        <section>
          <h2>Teste gratuito</h2>
          <p className="price">R$ 0</p>
          <ul>
            <li>1 carrossel salvo por conta.</li>
            <li>Seleção de templates gratuitos.</li>
            <li>Edição e exportação do projeto salvo.</li>
            <li>Sem cartão para cadastrar.</li>
          </ul>
          <Link className="button" href="/app?register=1">
            Criar conta gratuita
          </Link>
        </section>
        <section>
          <h2>Acesso Vitalício</h2>
          <p className="price">R$ 47,90</p>
          <p>Pagamento único, sem mensalidade.</p>
          <ul>
            <li>Todos os templates da biblioteca.</li>
            <li>Até 50 novos carrosséis por 24 horas.</li>
            <li>Projetos, marca e estilos salvos na conta.</li>
            <li>Exportação PNG, ZIP e PDF.</li>
          </ul>
          <Link className="button primary" href="/app">
            Acessar minha conta e contratar
          </Link>
        </section>
      </div>
      <h2>Como funciona a compra?</h2>
      <p>
        O pagamento é realizado no Mercado Pago. O acesso é liberado após a
        confirmação. “Vitalício” significa acesso enquanto o serviço estiver em
        operação, sujeito aos limites apresentados e aos Termos de Uso. A
        geração direta por IA depende da disponibilidade do provedor e não
        garante um resultado específico.
      </p>
      <p>
        <Link href="/termos">Leia as condições de compra e reembolso</Link>.
      </p>
    </PublicPage>
  );
}
