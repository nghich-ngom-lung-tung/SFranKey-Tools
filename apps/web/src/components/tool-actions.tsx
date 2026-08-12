"use client";
import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { Button } from "@sfrankey/ui";
import { readPreferences, writePreferences } from "@/lib/storage";

export function ToolActions({ locale, toolId }: { locale: Locale; toolId: string }) {
  const [favorite, setFavorite] = React.useState(false);
  React.useEffect(() => { setFavorite(readPreferences().favoriteToolIds.includes(toolId)); }, [toolId]);
  return <Button type="button" variant="secondary" onClick={() => { const prefs = readPreferences(); const next = favorite ? prefs.favoriteToolIds.filter((id) => id !== toolId) : [...new Set([...prefs.favoriteToolIds, toolId])]; writePreferences({ ...prefs, favoriteToolIds: next }); setFavorite(!favorite); }}>{favorite ? "★" : "☆"} {locale === "vi" ? (favorite ? "Đã yêu thích" : "Yêu thích") : (favorite ? "Favorited" : "Favorite")}</Button>;
}
