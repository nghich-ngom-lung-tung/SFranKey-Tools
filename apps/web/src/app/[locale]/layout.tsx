import { notFound } from "next/navigation";
import { locales, type Locale } from "@sfrankey/shared";
import { Shell } from "@/components/shell";
import { assertLocale } from "@/lib/locale";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) { const { locale: raw } = await params; const locale = assertLocale(raw); return <Shell locale={locale}>{children}</Shell>; }
