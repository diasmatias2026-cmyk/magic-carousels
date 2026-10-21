import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/privacidade" },
};
export default function Page() {
  return (
    <PublicPage title="Política de Privacidade">
      <p>Atualizada em 21 de outubro de 2026.</p>
      <p>
        Esta política explica o tratamento de dados no Magic Carousels, serviço
        do Grupo SplinkApp, CNPJ 32.657.200/0001-08. Contato para privacidade:{" "}
        <a href="mailto:comercial@splinkapp.com.br">
          comercial@splinkapp.com.br
        </a>
        .
      </p>
      <h2>Dados e finalidades</h2>
      <p>
        Tratamos nome, e-mail, senha protegida por hash, projetos, imagens
        enviadas, preferências de marca, registros de sessão e informações dos
        pedidos para manter a conta e prestar o serviço. Registramos atividade
        recente na área do cliente para segurança e acompanhamento operacional
        pelo administrador.
      </p>
      <p>
        O servidor utiliza identificadores derivados do IP ou da conta para
        limitar tentativas abusivas. Informações técnicas também podem constar
        nos registros de infraestrutura. Não há pixels de publicidade ou
        rastreamento de marketing instalados nesta versão.
      </p>
      <h2>Bases e compartilhamento</h2>
      <p>
        O tratamento necessário à conta e ao serviço está ligado à execução do
        contrato; registros exigidos por lei atendem obrigações legais. A
        prevenção de abuso e proteção do serviço consideram o legítimo
        interesse, respeitando os direitos do titular. Usos opcionais que
        dependam de consentimento devem ser apresentados separadamente.
      </p>
      <p>
        Utilizamos Supabase para armazenamento, Vercel para hospedagem e Mercado
        Pago para pagamento. Não armazenamos número completo do cartão nem
        código de segurança. Quando a geração direta por IA estiver ativa e você
        a solicitar, o tema e as instruções serão enviados ao provedor
        configurado. Evite incluir dados pessoais sensíveis nos conteúdos.
      </p>
      <h2>Armazenamento e transferências</h2>
      <p>
        Os provedores de infraestrutura podem processar dados fora do Brasil.
        Projetos e perfil são mantidos durante o uso da conta; registros de
        transações, segurança e solicitações podem precisar ser conservados para
        atender obrigações legais ou exercer direitos. A eliminação é avaliada
        quando a finalidade termina, observadas essas exceções.
      </p>
      <h2>Cookies e segurança</h2>
      <p>
        Usamos o cookie essencial mc_session para manter a sessão por até sete
        dias. Ele não é acessível por JavaScript e usa transmissão segura em
        produção. O encerramento da sessão revoga o acesso no servidor. Não
        utilizamos cookies opcionais de publicidade nesta versão.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação e acesso aos dados, correção,
        informações sobre compartilhamento, eliminação quando aplicável e
        revisão de situações previstas na LGPD. Envie a solicitação ao contato
        acima. Poderemos solicitar informações proporcionais para confirmar a
        titularidade e proteger a conta.
      </p>
      <p>
        Mais informações:{" "}
        <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares">
          direitos dos titulares na ANPD
        </a>
        .
      </p>
      <h2>Alterações</h2>
      <p>
        Mudanças serão registradas nesta página com a data de atualização.
        Alterações relevantes de finalidade exigirão comunicação adequada e,
        quando necessário, novo consentimento.
      </p>
    </PublicPage>
  );
}
