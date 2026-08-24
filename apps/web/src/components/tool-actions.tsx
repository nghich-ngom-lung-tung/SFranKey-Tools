"use client";
import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import { Button, Heart } from "@sfrankey/ui";
import { readPreferences, writePreferences } from "@/lib/storage";

export function ToolActions({ locale, toolId }: { locale: Locale; toolId: string }) {
  const t = getDictionary(locale);
  const [favorite, setFavorite] = React.useState(false);
  React.useEffect(() => { setFavorite(readPreferences().favoriteToolIds.includes(toolId)); }, [toolId]);
  return <Button type="button" variant="secondary" aria-pressed={favorite} onClick={() => { const prefs = readPreferences(); const next = favorite ? prefs.favoriteToolIds.filter((id) => id !== toolId) : [...new Set([...prefs.favoriteToolIds, toolId])]; writePreferences({ ...prefs, favoriteToolIds: next }); setFavorite(!favorite); }}><Heart size={16} fill={favorite ? "currentColor" : "none"} className={favorite ? "text-rose-500" : ""} />{favorite ? t.ui.removeFavorite : t.ui.addFavorite}</Button>;
}
