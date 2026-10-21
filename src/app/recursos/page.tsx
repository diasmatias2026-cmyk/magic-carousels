import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Recursos para criar seu próximo carrossel",
  description:
    "Recursos para criar seu próximo carrossel — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/recursos" },
};
export default function Page() {
  return (
    <PublicPage title="Recursos para criar seu próximo carrossel">
      <h2>Um editor do começo ao fim</h2>
      <p>
        Escolha entre os templates da biblioteca e personalize cores, fontes,
        alinhamento, imagens e avatar. Organize de 2 a 15 slides em formatos
        1:1, 4:5 e 9:16.
      </p>
      <h2>Conteúdo com sua identidade</h2>
      <p>
        Salve sua marca e seus estilos para reaproveitar nos próximos trabalhos.
        Cada projeto mantém seus textos, legenda e personalizações.
      </p>
      <h2>Escreva ou importe seus textos</h2>
      <p>
        O editor manual funciona sem integração com IA. O gerador de prompts
        ajuda você a preparar uma solicitação, copiar para uma IA de sua escolha
        e importar a resposta. A geração direta depende da disponibilidade do
        provedor configurado.
      </p>
      <h2>Artes prontas para levar às redes</h2>
      <p>
        Exporte um slide em PNG, todos os slides em ZIP ou o carrossel em PDF.
        As artes são geradas com largura de 1080 pixels. A publicação nas redes
        é feita por você.
      </p>
      <Link className="button primary" href="/app?register=1">
        Experimentar o editor
      </Link>
    </PublicPage>
  );
}
