import Link from "next/link";
import type { Dictionary } from "@sfrankey/i18n";
import type { Locale, ToolDefinition } from "@sfrankey/shared";
import { toolDefinitions } from "@sfrankey/shared";
import { Badge, InfoCard, PrivacyBadge, ShieldCheck, ShieldQuestion, Sparkles, ToolCard, ToolIcon } from "@sfrankey/ui";
import { localePath } from "@/lib/locale";
import { ToolActions } from "./tool-actions";

export function ToolPageFrame({ locale, tool, dictionary, children }: { locale: Locale; tool: ToolDefinition; dictionary: Dictionary; children: React.ReactNode }) {
  const sameCategory = toolDefinitions.filter((item) => item.category === tool.category && item.id !== tool.id);
  const otherTools = toolDefinitions.filter((item) => item.category !== tool.category && item.id !== tool.id);
  const related = [...sameCategory, ...otherTools].slice(0, 3);
  const specific = dictionary.toolDetails[tool.slug as keyof typeof dictionary.toolDetails];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sfrankey.bond";
  const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: tool.title[locale], description: tool.description[locale], applicationCategory: "DeveloperApplication", operatingSystem: "Any", isAccessibleForFree: true, url: siteUrl + "/" + locale + "/tools/" + tool.slug };
  const privacyLabel = tool.privacyMode === "network-required" ? dictionary.common.networkRequired : dictionary.common.onDevice;

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <nav aria-label={dictionary.ui.breadcrumb} className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-800/55 dark:text-brand-200/55">
      <Link href={localePath(locale)} className="transition hover:text-brand-600">SFranKey</Link><span aria-hidden="true">/</span>
      <Link href={localePath(locale, "tools")} className="transition hover:text-brand-600">{dictionary.nav.tools}</Link><span aria-hidden="true">/</span>
      <span aria-current="page" className="text-brand-800/80 dark:text-brand-200/80">{tool.title[locale]}</span>
    </nav>
    <header className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-card)] bg-gradient-to-br from-[var(--surface-card)] via-[var(--surface-card-tinted)] to-[var(--surface-card)] p-6 shadow-soft sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10" aria-hidden="true" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-600 shadow-soft dark:bg-brand-400/15 dark:text-brand-300">
              <ToolIcon iconKey={tool.iconKey} size={24} />
            </span>
            <Badge>{dictionary.categories[tool.category]}</Badge>
            <PrivacyBadge label={privacyLabel} mode={tool.privacyMode} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl lg:text-5xl dark:text-brand-50">{tool.title[locale]}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-brand-900/65 sm:text-lg dark:text-brand-100/65">{tool.description[locale]}</p>
        </div>
        <div className="shrink-0 self-start lg:self-center">
          <ToolActions locale={locale} toolId={tool.id} />
        </div>
      </div>
    </header>
    <div className="relative mt-8">
      <div className="pointer-events-none absolute -inset-x-8 -top-8 h-40 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      <InfoCard
        tone="amber"
        icon={<Sparkles size={18} />}
        title={dictionary.tool.guide}
        badge="HƯỚNG DẪN • NHANH"
        description={specific?.guide ?? dictionary.tool.guideText}
      />
      <InfoCard
        tone="emerald"
        icon={<ShieldCheck size={18} />}
        title={dictionary.tool.privacy}
        badge="LOCAL • 100%"
        description={specific?.privacy ?? dictionary.tool.privacyText}
      />
      <InfoCard
        tone="sky"
        icon={<ShieldQuestion size={18} />}
        title={dictionary.tool.faq}
        badge="HỖ TRỢ • FAQ"
        description={specific?.faq ?? dictionary.tool.faqText}
      />
    </div>
    {related.length ? (
      <section className="mt-16 border-t border-[var(--border-subtle)] pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em] text-brand-600 dark:text-brand-400">
              <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
              {locale === "vi" ? "Gợi ý tiếp theo" : "Next recommendations"}
            </span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-brand-950 sm:text-3xl dark:text-brand-50">
              {dictionary.tool.related}
            </h2>
          </div>
          <Link
            href={localePath(locale, "tools")}
            className="group inline-flex items-center gap-2 rounded-full border border-brand-300/70 bg-[var(--surface-card)] px-4 py-2 text-xs font-bold text-brand-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:text-brand-950 hover:shadow-soft dark:border-brand-700/60 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-400 dark:hover:text-brand-950"
          >
            <span>{dictionary.ui.viewAll}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <ToolCard
              key={item.id}
              tool={item}
              locale={locale}
              variant="related"
              relationLabel={dictionary.categories[item.category]}
              href={localePath(locale, "tools/" + item.slug)}
              privacyLabel={item.privacyMode === "network-required" ? dictionary.common.networkRequired : dictionary.common.onDevice}
              categoryLabel={dictionary.categories[item.category]}
              openLabel={dictionary.ui.openRelated}
            />
          ))}
        </div>
      </section>
    ) : null}
  </div>;
}
