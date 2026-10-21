import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/recursos",
    "/precos",
    "/ajuda",
    "/sobre",
    "/contato",
    "/privacidade",
    "/termos",
  ].map((path) => ({ url: SITE_URL + path }));
}
