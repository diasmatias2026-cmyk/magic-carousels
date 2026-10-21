import Link from "next/link";
import { PublicPage } from "@/components/site";
export default function NotFound() {
  return (
    <PublicPage title="Esta página não foi encontrada">
      <p>O endereço pode ter mudado.</p>
      <Link href="/" className="button primary">
        Voltar ao início
      </Link>
    </PublicPage>
  );
}
