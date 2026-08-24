"use client";

import * as React from "react";

/**
 * Scroll-triggered reveal wrapper for the About page.
 *
 * – SSR-safe: content renders visible by default (state = "idle", no data attrs).
 * – After hydration, elements below the viewport are hidden (data-hidden) and
 *   revealed with a transition when scrolled into view (data-animating).
 * – `stagger` mode applies staggered transition-delays to direct children via CSS.
 * – Reduced-motion users see content immediately without animation.
 */
export function AboutReveal({ children, className, stagger = false }: { children: React.ReactNode; className?: string; stagger?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"idle" | "hidden" | "animating">("idle");

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Elements already in (or near) the viewport stay visible — no animation.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88) return;

    setState("hidden");

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setState("animating"); observer.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tag = stagger ? "about-stagger" : "about-reveal";
  const dataAttr = state === "hidden" ? { "data-hidden": "" } : state === "animating" ? { "data-animating": "" } : {};

  return <div ref={ref} className={`${tag} ${className ?? ""}`.trim()} {...dataAttr}>{children}</div>;
}
