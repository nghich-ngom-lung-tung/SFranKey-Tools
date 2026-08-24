"use client";

import * as React from "react";
import { readPreferences, writePreferences } from "@/lib/storage";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");

  useIsomorphicLayoutEffect(() => {
    const preference = readPreferences();
    setTheme(preference.theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const dark =
      preference.theme === "dark" ||
      (preference.theme === "system" && media.matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = preference.theme;
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = theme;
    };
    apply();
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (next: "light" | "dark" | "system") => {
        setTheme(next);
        const prefs = readPreferences();
        writePreferences({ ...prefs, theme: next });
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const ThemeContext = React.createContext<{
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}>({ theme: "system", setTheme: () => undefined });

export const useTheme = () => React.useContext(ThemeContext);
