import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/termos" },
};
export default function Page() {
  return (
    <PublicPage title="Termos de Uso">
      <p>Versão de 21 de outubro de 2026.</p>
      <p>
        O Magic Carousels é um serviço online do Grupo SplinkApp, CNPJ
        32.657.200/0001-08. Contato:{" "}
        <a href="mailto:comercial@splinkapp.com.br">
          comercial@splinkapp.com.br
        </a>
        .
      </p>
      <h2>Acesso e conta</h2>
      <p>
        O serviço permite criar, editar, salvar e exportar carrosséis pelo
        navegador. Você deve fornecer dados corretos, proteger sua senha e não
        compartilhar credenciais. O suporte pode exigir verificação de
        titularidade para operações na conta.
      </p>
      <h2>Planos e limites</h2>
      <p>
        O teste gratuito oferece um carrossel salvo por conta e templates
        selecionados. Esse projeto pode ser editado e exportado. A exclusão não
        restaura o teste. O plano Vitalício custa R$ 47,90 em pagamento único e
        inclui a biblioteca completa de templates e até 50 novas criações por
        período de 24 horas.
      </p>
      <p>
        O termo Vitalício corresponde ao acesso enquanto o serviço estiver em
        operação, sem mensalidade para os recursos incluídos na contratação. Não
        representa garantia de operação perpétua. Alterações materiais deverão
        ser comunicadas, respeitando os direitos adquiridos e a legislação
        aplicável.
      </p>
      <h2>Pagamento e reembolso</h2>
      <p>
        O pagamento ocorre no Mercado Pago e o acesso é liberado após
        confirmação. Estornos e contestações podem suspender o acesso pago
        correspondente. Para exercer o direito de arrependimento em contratação
        online, solicite o cancelamento em até sete dias, nos termos do Código
        de Defesa do Consumidor, pelo e-mail de atendimento. Informe o e-mail da
        conta e o pedido. Outros direitos legais permanecem preservados.
      </p>
      <h2>Conteúdo e uso responsável</h2>
      <p>
        Você mantém a responsabilidade pelos textos e imagens enviados,
        inclusive autorizações e direitos de terceiros. O serviço recebe
        permissão de processamento apenas na medida necessária à sua operação.
        Não use a ferramenta para fraude, violação de direitos, conteúdo ilícito
        ou tentativas de acesso a dados de outras pessoas.
      </p>
      <p>
        Respostas de IA podem conter erros. Revise informações, fontes, direitos
        de imagem e adequação ao seu público. Não há promessa de viralização,
        engajamento, vendas ou resultado profissional específico. A geração
        direta depende do provedor disponível; o editor manual e a importação de
        texto são recursos independentes.
      </p>
      <h2>Disponibilidade e suporte</h2>
      <p>
        Manutenções e dependências externas podem causar interrupções. Você pode
        exportar seus materiais e deve manter cópias dos conteúdos importantes.
        Reporte falhas ao atendimento. Restrições por abuso devem ser
        proporcionais e respeitar a legislação.
      </p>
      <h2>Privacidade e legislação</h2>
      <p>
        O tratamento de dados está descrito na{" "}
        <Link href="/privacidade">Política de Privacidade</Link>. Estes termos
        observam a legislação brasileira, sem afastar direitos de consumidores,
        inclusive quanto ao foro competente.
      </p>
    </PublicPage>
  );
}
