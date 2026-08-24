"use client";

import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { BrandMark, Button, Sparkles } from "@sfrankey/ui";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";

const splashKey = "sfrankey-ui-splash-v1";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function clearSplashMarker() {
  try {
    window.sessionStorage.removeItem(splashKey);
  } catch {}
}

export function SplashScreen({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).ui;
  const [visible, setVisible] = React.useState<boolean>(false);
  const [ready, setReady] = React.useState<boolean>(false);
  const [reduced, setReduced] = React.useState(false);

  const close = React.useCallback(() => {
    try {
      window.sessionStorage.setItem(splashKey, "seen");
    } catch {}
    setVisible(false);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shouldReduce = media.matches;
    setReduced(shouldReduce);

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(splashKey) === "seen";
    } catch {}

    if (!seen && !shouldReduce) {
      setVisible(true);
      setReady(true);
      const timer = window.setTimeout(close, 1400);
      return () => window.clearTimeout(timer);
    } else {
      setReady(true);
    }
  }, [close]);

  React.useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, visible]);

  if (!ready || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-[var(--surface-hero)] text-[var(--ink)]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.28, ease: "easeInOut" } }}
          role="dialog"
          aria-modal="true"
          aria-label="SFranKey"
        >
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(36,127,89,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.12)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-20" />
          <m.div
            className="absolute -left-24 top-1/4 size-80 rounded-full bg-brand-300/35 blur-3xl dark:bg-brand-500/15"
            animate={reduced ? undefined : { y: [0, -18, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute -right-24 bottom-1/4 size-96 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-300/10"
            animate={reduced ? undefined : { y: [0, 18, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {!reduced && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <m.span
                  key={item}
                  className="absolute grid size-9 place-items-center rounded-xl border border-brand-400/25 bg-white/45 text-brand-700/60 shadow-soft dark:bg-white/5 dark:text-brand-200/70"
                  style={{
                    left: 50 + Math.cos(item * 1.047) * 27 + "%",
                    top: 50 + Math.sin(item * 1.047) * 27 + "%",
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0.1, 0.75, 0.1], scale: [0.5, 1, 0.7] }}
                  transition={{
                    delay: 0.2 + item * 0.05,
                    duration: 1.3,
                    repeat: Infinity,
                    repeatDelay: 1.4,
                  }}
                >
                  <Sparkles size={15} />
                </m.span>
              ))}
            </div>
          )}
          <div className="relative grid justify-items-center px-6 text-center">
            <m.div
              initial={reduced ? false : { opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.4, ease: "easeOut" }}
            >
              <BrandMark className="size-24 text-brand-700 drop-shadow-[0_0_30px_rgba(94,198,142,.3)] sm:size-28 dark:text-brand-300" />
            </m.div>
            <m.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.2, duration: reduced ? 0 : 0.3 }}
            >
              <p className="mt-5 text-2xl font-black tracking-[-.04em] sm:text-3xl">SFranKey</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[.24em] text-brand-700/75 dark:text-brand-300/80">
                {t.splashDescriptor}
              </p>
            </m.div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-[calc(50vh+10rem)] sm:top-[calc(50vh+11rem)]"
              onClick={close}
            >
              {t.splashSkip}
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
