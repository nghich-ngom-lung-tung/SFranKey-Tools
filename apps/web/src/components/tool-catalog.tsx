"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import {
  categories,
  toolDefinitions,
  type Locale,
  type ToolCategory,
} from "@sfrankey/shared";
import {
  Binary,
  Braces,
  Button,
  cn,
  EmptyState,
  Globe2,
  KeyRound,
  QrCode,
  Search,
  Select,
  Sparkles,
  Timer,
  ToolCard,
  X,
} from "@sfrankey/ui";
import { localePath } from "@/lib/locale";
import { readPreferences, writePreferences } from "@/lib/storage";

type ToolCatalogProps = {
  locale: Locale;
  category?: ToolCategory;
};

type SortMode = "popular" | "az";

const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  "2fa": Timer,
  password: KeyRound,
  qr: QrCode,
  encoding: Binary,
  developer: Braces,
  network: Globe2,
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function sortTools(sort: SortMode) {
  return [...toolDefinitions].sort((left, right) => {
    if (sort === "az") return left.title.en.localeCompare(right.title.en);
    return (
      Number(right.featured ?? false) - Number(left.featured ?? false) ||
      toolDefinitions.indexOf(left) - toolDefinitions.indexOf(right)
    );
  });
}

export function ToolCatalog({ locale, category }: ToolCatalogProps) {
  const t = getDictionary(locale);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<
    ToolCategory | "all"
  >(category ?? "all");
  const [sort, setSort] = React.useState<SortMode>("popular");
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const preferences = readPreferences();
    setFavoriteIds(preferences.favoriteToolIds);
    setRecentIds(
      preferences.recentTools
        .sort((a, b) => b.usedAt - a.usedAt)
        .map((item) => item.toolId),
    );
    setHydrated(true);
  }, []);

  const toggleFavorite = React.useCallback((toolId: string) => {
    const preferences = readPreferences();
    const nextFavoriteIds = preferences.favoriteToolIds.includes(toolId)
      ? preferences.favoriteToolIds.filter((id) => id !== toolId)
      : [...new Set([...preferences.favoriteToolIds, toolId])];
    writePreferences({ ...preferences, favoriteToolIds: nextFavoriteIds });
    setFavoriteIds(nextFavoriteIds);
  }, []);

  const visibleTools = React.useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return sortTools(sort).filter((tool) => {
      if (
        !tool.available ||
        (categoryFilter !== "all" && tool.category !== categoryFilter)
      )
        return false;
      if (!normalizedQuery) return true;
      const searchable = normalize(
        [
          tool.title[locale],
          tool.description[locale],
          tool.title.en,
          tool.description.en,
          tool.keywords.join(" "),
          t.categories[tool.category],
        ].join(" "),
      );
      return searchable.includes(normalizedQuery);
    });
  }, [categoryFilter, locale, query, sort, t.categories]);

  const favoriteTools = React.useMemo(
    () => visibleTools.filter((tool) => favoriteIds.includes(tool.id)),
    [favoriteIds, visibleTools],
  );
  const recentTools = React.useMemo(
    () =>
      visibleTools
        .filter((tool) => recentIds.includes(tool.id))
        .sort(
          (left, right) =>
            recentIds.indexOf(left.id) - recentIds.indexOf(right.id),
        )
        .slice(0, 4),
    [recentIds, visibleTools],
  );
  const showPersonalSections = !query.trim() && !category && sort === "popular";

  const card = (
    tool: (typeof toolDefinitions)[number],
    variant: "standard" | "compact" = "standard",
  ) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      locale={locale}
      variant={variant}
      href={localePath(locale, `tools/${tool.slug}`)}
      privacyLabel={t.common.onDevice}
      categoryLabel={t.categories[tool.category]}
      favorite={favoriteIds.includes(tool.id)}
      onFavoriteChange={toggleFavorite}
      favoriteLabel={t.ui.addFavorite}
      unfavoriteLabel={t.ui.removeFavorite}
      openLabel={t.ui.openTool}
    />
  );

  return (
    <div data-tool-catalog-ready={hydrated ? "true" : "false"}>
      {/* ─── Developer Search & Filter Control Dock ─── */}
      <div className="rounded-[28px] border-2 border-brand-200/80 bg-white/95 p-4 shadow-[0_16px_40px_-10px_rgba(16,185,129,0.12)] backdrop-blur-2xl transition-all duration-300 dark:border-brand-800/80 dark:bg-brand-950/95 sm:p-5 lg:sticky lg:top-20 lg:z-20">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          {/* Smart Search Input with Icon & Clear Action */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400"
            />
            <input
              disabled={!hydrated}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                locale === "vi"
                  ? `Tìm kiếm trong ${toolDefinitions.length} công cụ (tên, tác vụ, từ khóa)...`
                  : `Search across ${toolDefinitions.length} tools (name, keywords)...`
              }
              aria-label={t.ui.searchCatalog}
              className="min-h-12 w-full rounded-2xl border border-brand-200/80 bg-brand-50/40 pl-11 pr-10 text-sm font-medium text-brand-950 outline-none transition-all placeholder:text-brand-800/40 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-400/15 dark:border-brand-800/70 dark:bg-brand-900/40 dark:text-brand-50 dark:placeholder:text-brand-200/40 dark:focus:border-brand-400 dark:focus:bg-brand-950"
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-brand-500 hover:bg-brand-100 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-900 dark:hover:text-brand-100"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          {!category ? (
            <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
              <span className="sr-only">{t.ui.filterCategory}</span>
              <Select
                disabled={!hydrated}
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as ToolCategory | "all")
                }
                aria-label={t.ui.filterCategory}
                className="min-h-12 w-full rounded-2xl border-brand-200/80 bg-brand-50/40 font-bold lg:w-52 dark:border-brand-800/70 dark:bg-brand-900/40"
              >
                <option value="all">{t.ui.allCategories}</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {t.categories[item]}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
            <span className="sr-only">{t.ui.sort}</span>
            <Select
              disabled={!hydrated}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              aria-label={t.ui.sort}
              className="min-h-12 w-full rounded-2xl border-brand-200/80 bg-brand-50/40 font-bold lg:w-44 dark:border-brand-800/70 dark:bg-brand-900/40"
            >
              <option value="popular">{t.ui.sortPopular}</option>
              <option value="az">{t.ui.sortAZ}</option>
            </Select>
          </label>
        </div>

        {/* ─── Interactive Quick Category Filter Chips ─── */}
        {!category ? (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-brand-100/80 pt-3.5 dark:border-brand-800/50">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  categoryFilter === "all"
                    ? "bg-brand-500 text-brand-950 shadow-xs dark:bg-brand-400 dark:text-brand-950 font-black"
                    : "border border-brand-200/80 bg-white/80 text-brand-800 hover:border-brand-400 hover:bg-brand-50 dark:border-brand-800/70 dark:bg-brand-900/50 dark:text-brand-200 dark:hover:bg-brand-900"
                )}
              >
                <Sparkles size={12} />
                <span>{t.ui.allCategories}</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] dark:bg-white/20">
                  {toolDefinitions.length}
                </span>
              </button>

              {categories.map((catKey) => {
                const CatIcon = CATEGORY_ICONS[catKey];
                const count = toolDefinitions.filter((item) => item.category === catKey).length;
                const isSelected = categoryFilter === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategoryFilter(catKey)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200",
                      isSelected
                        ? "bg-brand-500 text-brand-950 shadow-xs dark:bg-brand-400 dark:text-brand-950 font-black"
                        : "border border-brand-200/80 bg-white/80 text-brand-800 hover:border-brand-400 hover:bg-brand-50 dark:border-brand-800/70 dark:bg-brand-900/50 dark:text-brand-200 dark:hover:bg-brand-900"
                    )}
                  >
                    <CatIcon size={13} />
                    <span>{t.categories[catKey]}</span>
                    <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] dark:bg-white/20">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Count Status Indicator */}
            <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand-800/70 dark:text-brand-200/70">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {visibleTools.length} / {toolDefinitions.length} {t.ui.statsTools}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {showPersonalSections && favoriteTools.length ? (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
              {t.ui.favorites}
            </h2>
            <span className="text-xs font-semibold text-brand-700/60 dark:text-brand-200/60">
              {favoriteTools.length}
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteTools.map((tool) => card(tool, "compact"))}
          </div>
        </section>
      ) : null}
      {showPersonalSections && recentTools.length ? (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
              {t.ui.recent}
            </h2>
            <span className="text-xs font-semibold text-brand-700/60 dark:text-brand-200/60">
              {recentTools.length}
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentTools.map((tool) => card(tool, "compact"))}
          </div>
        </section>
      ) : null}

      <section
        data-testid="tool-catalog-results"
        className="mt-10"
        aria-live="polite"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700/60 dark:text-brand-300/60">
              {category ? t.categories[category] : t.nav.tools}
            </p>
            <h2 className="mt-2 text-2xl font-black text-brand-950 dark:text-brand-50">
              {query.trim()
                ? `${visibleTools.length} ${t.ui.searchCatalog.toLocaleLowerCase()}`
                : t.ui.viewAll}
            </h2>
          </div>
        </div>
        {visibleTools.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((tool) => card(tool))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            title={t.common.noResults}
            description={t.ui.searchHint}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSort("popular");
                  if (!category) setCategoryFilter("all");
                }}
              >
                {t.ui.resetFilters}
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
