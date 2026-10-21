import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Ajuda para começar e continuar",
  description:
    "Ajuda para começar e continuar — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/ajuda" },
};
export default function Page() {
  return (
    <PublicPage title="Ajuda para começar e continuar">
      <details open>
        <summary>Preciso instalar o sistema?</summary>
        <p>
          Não. O Magic Carousels é um SaaS acessado pelo navegador. Você exporta
          as artes para publicar nas suas redes.
        </p>
      </details>
      <details>
        <summary>Como crio meu primeiro projeto?</summary>
        <p>
          Crie sua conta, abra Templates ou Novo carrossel, escreva seus slides
          e clique em Salvar projeto. O primeiro salvamento utiliza seu projeto
          gratuito.
        </p>
      </details>
      <details>
        <summary>Posso editar depois de usar o teste?</summary>
        <p>
          Sim. O projeto gratuito salvo continua disponível para edição e
          exportação. Excluir esse projeto não devolve a cota de criação.
        </p>
      </details>
      <details>
        <summary>Como uso o prompt?</summary>
        <p>
          No editor, abra Criar conteúdo ou importar resposta. Informe tema e
          nicho, monte o prompt, copie para uma IA e cole a resposta no editor.
          Revise todas as informações antes de publicar.
        </p>
      </details>
      <details>
        <summary>O pagamento foi aprovado e meu acesso não mudou.</summary>
        <p>
          Abra Meu plano e clique em Atualizar status. Se continuar pendente,
          envie o identificador do pedido para comercial@splinkapp.com.br. Não
          envie dados do cartão ou senha.
        </p>
      </details>
      <details>
        <summary>Como recupero o acesso à conta?</summary>
        <p>
          Entre em contato com comercial@splinkapp.com.br pelo e-mail
          cadastrado. O atendimento verificará a titularidade antes de orientar
          a recuperação.
        </p>
      </details>
      <details>
        <summary>Como excluo meus dados?</summary>
        <p>
          Envie uma solicitação pelo e-mail cadastrado para
          comercial@splinkapp.com.br. A solicitação será tratada conforme a
          Política de Privacidade e as obrigações legais aplicáveis.
        </p>
      </details>
      <Link href="/contato">Falar com o atendimento</Link>
    </PublicPage>
  );
}
