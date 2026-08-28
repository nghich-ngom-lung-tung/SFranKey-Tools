import type { MetadataRoute } from "next";
import { toolDefinitions, categories } from "@sfrankey/shared";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sfrankey.bond";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = [{ path: "", priority: 1 }, { path: "/tools", priority: 0.9 }, { path: "/about", priority: 0.5 }, { path: "/privacy", priority: 0.5 }, { path: "/security", priority: 0.5 }, { path: "/request-a-tool", priority: 0.3 }, { path: "/report-a-bug", priority: 0.2 }];
  return ["vi", "en"].flatMap((locale) => [...base.map(({ path, priority }) => ({ url: `${siteUrl}/${locale}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority })), ...categories.map((category) => ({ url: `${siteUrl}/${locale}/categories/${category}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })), ...toolDefinitions.map((tool) => ({ url: `${siteUrl}/${locale}/tools/${tool.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: tool.featured ? 0.8 : 0.6 }))]);
}
