"use client";

import * as React from "react";

/**
 * Scroll-triggered reveal wrapper with smooth staggered animation.
 *
 * – Triggers cleanly via IntersectionObserver when scrolled into viewport.
 * – Supports `stagger` mode for child card cascades.
 * – Reduced-motion users see content immediately without animation.
 */
export function AboutReveal({
  children,
  className,
  stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tag = stagger ? "scroll-stagger about-stagger" : "scroll-reveal about-reveal";

  return (
    <div
      ref={ref}
      className={`${tag} ${className ?? ""}`.trim()}
      data-visible={isVisible ? "true" : "false"}
      data-animating={isVisible ? "" : undefined}
      data-hidden={!isVisible ? "" : undefined}
    >
      {children}
    </div>
  );
}

export { AboutReveal as ScrollReveal };
