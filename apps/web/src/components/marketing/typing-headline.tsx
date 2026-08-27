"use client";

import * as React from "react";

/**
 * Keeps the largest headline in the server HTML, then adds a small client-side
 * typing moment after hydration. The hidden copy reserves the final layout so
 * changing messages does not move the hero or the preview window.
 */
export function TypingHeadline({ texts }: { texts: readonly string[] }) {
  const messages = React.useMemo(() => texts.filter(Boolean), [texts]);
  const longest = React.useMemo(() => messages.reduce((current, value) => value.length > current.length ? value : current, ""), [messages]);
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(longest.length);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || messages.length <= 1) {
      setMessageIndex(0);
      setVisibleCount(messages[0]?.length ?? 0);
      return;
    }

    let timer: number | undefined;
    let index = 0;
    let count = 0;
    setVisibleCount(0);

    const schedule = (callback: () => void, delay: number) => {
      timer = window.setTimeout(callback, delay);
    };

    const tick = () => {
      const current = Array.from(messages[index] ?? "");
      if (count < current.length) {
        count += 1;
        setVisibleCount(count);
        schedule(tick, 38);
        return;
      }

      schedule(() => {
        const erase = () => {
          if (count > 0) {
            count -= 1;
            setVisibleCount(count);
            schedule(erase, 22);
            return;
          }
          index = (index + 1) % messages.length;
          setMessageIndex(index);
          schedule(tick, 280);
        };
        erase();
      }, 1800);
    };

    schedule(tick, 140);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [longest, messages]);

  const activeCharacters = Array.from(messages[messageIndex] ?? "");
  const visibleText = activeCharacters.slice(0, visibleCount).join("");

  return <span className="relative block">
    <span className="invisible block" aria-hidden="true">{longest}</span>
    <span className="absolute inset-0 block" aria-hidden="true">
      <span className="hero-word-letters">{visibleText}</span>{visibleCount < activeCharacters.length ? <span className="ml-1 inline-block h-[.85em] w-[.08em] translate-y-[.08em] rounded-full bg-brand-600 motion-safe:animate-typing-caret dark:bg-brand-300" /> : null}
    </span>
    <span className="sr-only">{messages.join(" ")}</span>
  </span>;
}
