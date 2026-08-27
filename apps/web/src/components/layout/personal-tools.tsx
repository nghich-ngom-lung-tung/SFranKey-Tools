"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import { toolDefinitions } from "@sfrankey/shared";
import { cn, Heart, ToolCard } from "@sfrankey/ui";
import { localePath } from "@/lib/locale";
import { readPreferences, toggleFavoriteTool } from "@/lib/storage";

const fallbackIds = ["totp-generator", "password-generator", "qr-2fa-scanner", "qr-generator", "file-checksum", "ip-lookup"];

export function PersonalTools({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const [filter, setFilter] = React.useState<"all" | "favorites" | "recents">("all");

  const syncPreferences = React.useCallback(() => {
    const preferences = readPreferences();
    setFavoriteIds(preferences.favoriteToolIds);
    setRecentIds(preferences.recentTools.sort((a, b) => b.usedAt - a.usedAt).map((item) => item.toolId));
  }, []);

  React.useEffect(() => {
    syncPreferences();
  }, [syncPreferences]);

  const handleFavoriteToggle = (toolId: string) => {
    toggleFavoriteTool(toolId);
    syncPreferences();
  };

  const rawIds =
    filter === "favorites"
      ? favoriteIds
      : filter === "recents"
      ? recentIds
      : [...new Set([...favoriteIds, ...recentIds])];

  const effectiveIds = rawIds.length > 0 ? rawIds.slice(0, 6) : (filter === "all" ? fallbackIds : []);
  const tools = effectiveIds
    .map((id) => toolDefinitions.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof toolDefinitions)[number] => Boolean(tool));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-label={t.ui.recent}>
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/70 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              <Heart size={12} className="fill-rose-500 text-rose-500" />
              {locale === "vi" ? "Không gian cá nhân" : "Personal Workspace"}
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-950 dark:text-brand-50">
            {t.ui.searchRecent}
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-brand-200/70 bg-white/70 p-1 backdrop-blur-sm dark:border-brand-800/60 dark:bg-brand-950/60">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200",
              filter === "all"
                ? "bg-brand-500 text-brand-950 shadow-xs dark:bg-brand-400 dark:text-brand-950"
                : "text-brand-950/80 hover:text-brand-950 dark:text-brand-200/80 dark:hover:text-brand-50"
            )}
          >
            {locale === "vi" ? "Tất cả" : "All"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("favorites")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200",
              filter === "favorites"
                ? "bg-rose-600 text-white shadow-xs dark:bg-rose-400 dark:text-rose-950"
                : "text-brand-950/80 hover:text-rose-700 dark:text-brand-200/80 dark:hover:text-rose-400"
            )}
          >
            <Heart size={13} className={filter === "favorites" ? "fill-white dark:fill-rose-950" : "fill-rose-500 text-rose-500"} />
            <span>{locale === "vi" ? "Yêu thích" : "Favorites"}</span>
            {favoriteIds.length > 0 ? (
              <span className={cn("rounded-full px-1.5 py-0.2 text-[10px] font-black", filter === "favorites" ? "bg-white/20 text-white dark:bg-rose-950/40 dark:text-rose-950" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300")}>
                {favoriteIds.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setFilter("recents")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200",
              filter === "recents"
                ? "bg-brand-500 text-brand-950 shadow-xs dark:bg-brand-400 dark:text-brand-950"
                : "text-brand-950/80 hover:text-brand-950 dark:text-brand-200/80 dark:hover:text-brand-50"
            )}
          >
            <span>{locale === "vi" ? "Vừa mở" : "Recents"}</span>
            {recentIds.length > 0 ? (
              <span className={cn("rounded-full px-1.5 py-0.2 text-[10px] font-black", filter === "recents" ? "bg-brand-950/20 text-brand-950 dark:bg-brand-950/40 dark:text-brand-950" : "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300")}>
                {recentIds.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Grid of Tools */}
      {tools.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const isFav = favoriteIds.includes(tool.id);
            return (
              <ToolCard
                key={tool.id}
                tool={tool}
                locale={locale}
                variant="compact"
                favorite={isFav}
                onFavoriteChange={handleFavoriteToggle}
                relationLabel={isFav ? (locale === "vi" ? "Yêu thích" : "Favorited") : (locale === "vi" ? "Gần đây" : "Recent")}
                href={localePath(locale, "tools/" + tool.slug)}
                privacyLabel={t.common.onDevice}
                categoryLabel={t.categories[tool.category]}
                openLabel={t.ui.openTool}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-200/80 bg-white/40 p-10 text-center dark:border-brand-800/60 dark:bg-brand-950/20">
          <Heart size={32} className="text-rose-400/60 stroke-[1.5]" />
          <p className="mt-3 text-sm font-bold text-brand-950 dark:text-brand-50">
            {filter === "favorites"
              ? (locale === "vi" ? "Chưa có công cụ yêu thích" : "No favorite tools yet")
              : (locale === "vi" ? "Chưa có công cụ vừa mở" : "No recent tools yet")}
          </p>
          <p className="mt-1 text-xs text-brand-800/60 dark:text-brand-200/60">
            {locale === "vi"
              ? "Bấm vào biểu tượng trái tim ở bất kỳ công cụ nào để ghim lại đây."
              : "Click the heart icon on any tool to pin it here."}
          </p>
        </div>
      )}
    </section>
  );
}

