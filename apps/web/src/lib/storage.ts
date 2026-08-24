import type { Locale } from "@sfrankey/shared";
export type LocalPreferences = { version: 1; locale: Locale; theme: "light" | "dark" | "system"; favoriteToolIds: string[]; recentTools: Array<{ toolId: string; usedAt: number }> };
const key = "sfrankey-preferences";
const defaults: LocalPreferences = { version: 1, locale: "vi", theme: "system", favoriteToolIds: [], recentTools: [] };
export function readPreferences(): LocalPreferences { if (typeof window === "undefined") return defaults; try { const value = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<LocalPreferences> | null; return { ...defaults, ...value, favoriteToolIds: value?.favoriteToolIds ?? [], recentTools: value?.recentTools ?? [] }; } catch { return defaults; } }
export function writePreferences(value: LocalPreferences) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* preferences remain in memory when storage is blocked */ } }
export function clearPreferences() { try { localStorage.removeItem(key); } catch { /* storage may be blocked */ } try { sessionStorage.removeItem("sfrankey-ui-splash-v1"); } catch { /* storage may be blocked */ } }
export function recordRecentTool(toolId: string) { const prefs = readPreferences(); const recentTools = [{ toolId, usedAt: Date.now() }, ...prefs.recentTools.filter((item) => item.toolId !== toolId)].slice(0, 20); writePreferences({ ...prefs, recentTools }); }
export function toggleFavoriteTool(toolId: string): boolean {
  const prefs = readPreferences();
  const exists = prefs.favoriteToolIds.includes(toolId);
  const favoriteToolIds = exists
    ? prefs.favoriteToolIds.filter((id) => id !== toolId)
    : [...prefs.favoriteToolIds, toolId];
  writePreferences({ ...prefs, favoriteToolIds });
  return !exists;
}

