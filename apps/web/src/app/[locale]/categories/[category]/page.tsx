import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, toolDefinitions, type Locale, type ToolCategory } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { localePath } from "@/lib/locale";
import { Card } from "@sfrankey/ui";
export function generateStaticParams() { return ["vi", "en"].flatMap((locale) => categories.map((category) => ({ locale, category }))); }
export default async function CategoryPage({ params }: { params: Promise<{ locale: Locale; category: string }> }) { const { locale, category: raw } = await params; if (!categories.includes(raw as ToolCategory)) notFound(); const category = raw as ToolCategory; const t = getDictionary(locale); const tools = toolDefinitions.filter((tool) => tool.category === category); return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><p className="text-sm font-semibold text-brand-600">{t.nav.tools}</p><h1 className="mt-3 text-4xl font-black">{t.categories[category]}</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Link key={tool.id} href={localePath(locale, `tools/${tool.slug}`)}><Card className="h-full hover:border-brand-300"><span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-xl dark:bg-brand-950">{tool.icon}</span><h2 className="mt-4 font-bold">{tool.title[locale]}</h2><p className="mt-2 text-sm text-slate-500">{tool.description[locale]}</p></Card></Link>)}</div></div>; }
