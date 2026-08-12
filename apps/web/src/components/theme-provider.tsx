"use client";
import * as React from "react";
import { readPreferences, writePreferences } from "@/lib/storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");
  React.useEffect(() => { const preference = readPreferences(); setTheme(preference.theme); }, []);
  React.useEffect(() => { const root = document.documentElement; const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches); root.classList.toggle("dark", dark); }, [theme]);
  const value = React.useMemo(() => ({ theme, setTheme: (next: "light" | "dark" | "system") => { setTheme(next); const prefs = readPreferences(); writePreferences({ ...prefs, theme: next }); } }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
const ThemeContext = React.createContext<{ theme: "light" | "dark" | "system"; setTheme: (theme: "light" | "dark" | "system") => void }>({ theme: "system", setTheme: () => undefined });
export const useTheme = () => React.useContext(ThemeContext);
