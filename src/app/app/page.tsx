import type { Metadata } from "next";
import Workspace from "@/components/workspace";
export const metadata: Metadata = {
  title: "Seus projetos",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <div className="saas-shell"><Workspace /></div>;
}
