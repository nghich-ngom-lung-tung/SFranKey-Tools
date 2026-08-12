import type { Locale } from "@sfrankey/shared";
export type LocalPreferences = { version: 1; locale: Locale; theme: "light" | "dark" | "system"; favoriteToolIds: string[]; recentTools: Array<{ toolId: string; usedAt: number }> };
const key = "sfrankey-preferences";
const defaults: LocalPreferences = { version: 1, locale: "vi", theme: "system", favoriteToolIds: [], recentTools: [] };
export function readPreferences(): LocalPreferences { if (typeof window === "undefined") return defaults; try { const value = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<LocalPreferences> | null; return { ...defaults, ...value, favoriteToolIds: value?.favoriteToolIds ?? [], recentTools: value?.recentTools ?? [] }; } catch { return defaults; } }
export function writePreferences(value: LocalPreferences) { localStorage.setItem(key, JSON.stringify(value)); }
export function clearPreferences() { localStorage.removeItem(key); }
export function recordRecentTool(toolId: string) { const prefs = readPreferences(); const recentTools = [{ toolId, usedAt: Date.now() }, ...prefs.recentTools.filter((item) => item.toolId !== toolId)].slice(0, 20); writePreferences({ ...prefs, recentTools }); }
