import Link from "next/link";
import { PublicPage } from "@/components/site";
export const metadata = {
  title: "Um espaço para suas ideias ganharem forma",
  description:
    "Um espaço para suas ideias ganharem forma — Magic Carousels, Grupo SplinkApp.",
  alternates: { canonical: "/sobre" },
};
export default function Page() {
  return (
    <PublicPage title="Um espaço para suas ideias ganharem forma">
      <p>
        O Magic Carousels faz parte do Grupo SplinkApp, presente desde 2019.
        Criamos uma ferramenta online para organizar textos, dar consistência
        visual e produzir carrosséis.
      </p>
      <h2>Clareza no conteúdo, liberdade no visual</h2>
      <p>
        Você escolhe o que comunicar. O editor reúne templates, personalização e
        exportação para transformar esse conteúdo em uma sequência visual.
      </p>
      <p>Grupo SplinkApp · CNPJ 32.657.200/0001-08.</p>
      <Link href="/contato">Entre em contato</Link>
    </PublicPage>
  );
}
