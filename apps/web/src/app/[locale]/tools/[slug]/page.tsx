import { notFound } from "next/navigation";
import { getTool, toolDefinitions, type Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { ToolClient } from "@/components/tool-client";
import { ToolPageFrame } from "@/components/tool-page-frame";

export function generateStaticParams() { return ["vi", "en"].flatMap((locale) => toolDefinitions.map((tool) => ({ locale, slug: tool.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }) { const { locale, slug } = await params; const tool = getTool(slug); if (!tool) return {}; return { title: tool.title[locale], description: tool.description[locale], alternates: { canonical: `/${locale}/tools/${tool.slug}`, languages: { vi: `/vi/tools/${tool.slug}`, en: `/en/tools/${tool.slug}` } } }; }
export default async function ToolPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) { const { locale, slug } = await params; const tool = getTool(slug); if (!tool) notFound(); const t = getDictionary(locale); return <ToolPageFrame locale={locale} tool={tool} dictionary={t}><ToolClient locale={locale} slug={tool.slug} /></ToolPageFrame>; }
