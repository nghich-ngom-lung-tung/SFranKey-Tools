import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categories,
  toolDefinitions,
  type Locale,
  type ToolCategory,
} from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { Badge, getCategoryTone, Sparkles, ToolIcon } from "@sfrankey/ui";
import { localePath } from "@/lib/locale";
import { ToolCatalog } from "@/components/tool-catalog";

export function generateStaticParams() {
  return ["vi", "en"].flatMap((locale) =>
    categories.map((category) => ({ locale, category }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; category: string }>;
}) {
  const { locale, category: raw } = await params;
  if (!categories.includes(raw as ToolCategory)) return {};
  const t = getDictionary(locale);
  const title = t.categories[raw as ToolCategory];
  const description = `${
    toolDefinitions.filter((tool) => tool.category === raw).length
  } ${t.ui.statsTools} · ${title}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/categories/${raw}`,
      languages: {
        vi: `/vi/categories/${raw}`,
        en: `/en/categories/${raw}`,
        "x-default": `/vi/categories/${raw}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/categories/${raw}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale; category: string }>;
}) {
  const { locale, category: raw } = await params;
  if (!categories.includes(raw as ToolCategory)) notFound();
  const category = raw as ToolCategory;
  const t = getDictionary(locale);

  const tools = toolDefinitions.filter((tool) => tool.category === category);
  const tone = getCategoryTone(category);
  const icon = tools[0]?.iconKey ?? "binary";
  const categoryPrivacy = tools.every((tool) => tool.privacyMode === "on-device")
    ? t.common.onDevice
    : t.common.networkRequired;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* ── Category Hero Banner ── */}
      <section
        className={`relative isolate overflow-hidden rounded-[32px] border-2 border-emerald-300/70 bg-gradient-to-br ${tone.soft} p-7 shadow-raised sm:p-10 lg:p-12 dark:border-emerald-800/60`}
      >
        <span className={`absolute inset-x-0 top-0 h-1.5 ${tone.rail}`} />
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
              {t.nav.categories}
            </span>
            <p className={`mt-4 text-xs font-black uppercase tracking-[.18em] ${tone.text}`}>
              {category}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-brand-950 sm:text-4xl lg:text-5xl dark:text-brand-50">
              {t.categories[category]}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-brand-900/75 sm:text-lg dark:text-brand-100/75">
              {category === "network" ? t.networkSuite.disclosure : t.home.description}
            </p>
          </div>

          <div
            className={`grid size-20 shrink-0 place-items-center rounded-2xl ${tone.icon} shadow-soft sm:size-28 sm:rounded-[28px]`}
          >
            <ToolIcon iconKey={icon} size={36} />
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap gap-2.5">
          <span className="rounded-full border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-900 shadow-2xs dark:border-brand-700/60 dark:bg-brand-950/60 dark:text-brand-100">
            {tools.length} {t.ui.statsTools}
          </span>
          <span className="rounded-full border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-900 shadow-2xs dark:border-brand-700/60 dark:bg-brand-950/60 dark:text-brand-100">
            {categoryPrivacy}
          </span>
          <span className="rounded-full border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-900 shadow-2xs dark:border-brand-700/60 dark:bg-brand-950/60 dark:text-brand-100">
            {t.ui.noAccount}
          </span>
        </div>
      </section>

      {/* ── Category Tool Catalog ── */}
      <div className="mt-8">
        <ToolCatalog locale={locale} category={category} />
      </div>

      {/* ── Other Categories Explorer ── */}
      <nav
        aria-label={t.ui.categoryExplore}
        className="mt-16 border-t border-brand-200/70 pt-10 dark:border-brand-800/70"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-700/60 dark:text-brand-300/60">
              {t.ui.categoryExplore}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-brand-950 sm:text-3xl dark:text-brand-50">
              {locale === "vi" ? "Khám phá danh mục khác" : "Explore Other Categories"}
            </h2>
          </div>
          <Link
            href={localePath(locale, "tools")}
            className="group inline-flex items-center gap-2 rounded-full border border-brand-300/70 bg-white/80 px-4 py-2 text-xs font-bold text-brand-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:text-brand-950 hover:shadow-soft dark:border-brand-700/60 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-400 dark:hover:text-brand-950"
          >
            <span>{t.ui.viewAll}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories
            .filter((item) => item !== category)
            .slice(0, 4)
            .map((item) => {
              const itemTools = toolDefinitions.filter(
                (tool) => tool.category === item
              );
              const itemTone = getCategoryTone(item);
              return (
                <Link
                  key={item}
                  href={localePath(locale, "categories/" + item)}
                  className="group flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/90 p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-raised dark:border-brand-800/70 dark:bg-brand-950/70"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${itemTone.icon} shadow-2xs group-hover:scale-110 transition-transform`}
                  >
                    <ToolIcon
                      iconKey={itemTools[0]?.iconKey ?? "binary"}
                      size={18}
                    />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-brand-950 group-hover:text-emerald-700 dark:text-brand-50 dark:group-hover:text-emerald-300 transition-colors">
                      {t.categories[item]}
                    </strong>
                    <span className="text-xs font-medium text-brand-700/70 dark:text-brand-200/70">
                      {itemTools.length} {t.ui.statsTools}
                    </span>
                  </span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
