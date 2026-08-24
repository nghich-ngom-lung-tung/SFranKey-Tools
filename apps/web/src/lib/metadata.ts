import type { Metadata } from "next";
import type { Locale } from "@sfrankey/shared";

export function localizedMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const suffix = path ? `/${path.replace(/^\//, "")}` : "";
  return { title, description, alternates: { canonical: `/${locale}${suffix}`, languages: { vi: `/vi${suffix}`, en: `/en${suffix}`, "x-default": `/vi${suffix}` } }, openGraph: { title, description, url: `/${locale}${suffix}` } };
}
