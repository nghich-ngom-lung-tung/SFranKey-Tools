"use client";

import * as React from "react";
import { ArrowUp, cn } from "@sfrankey/ui";

interface ScrollToTopProps {
  locale?: string;
}

export function ScrollToTop({ locale = "vi" }: ScrollToTopProps) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(progress);
        setVisible(scrollTop > 200);
      } else {
        setVisible(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // SVG circular dimensions
  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-all duration-300",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-75 opacity-0"
      )}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={locale === "vi" ? "Cuộn lên đầu trang" : "Scroll to top"}
        className="group relative flex size-12 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md transition-all duration-200 hover:scale-110 hover:shadow-[0_12px_35px_rgba(16,185,129,0.25)] active:scale-95 dark:bg-brand-950/90"
      >
        {/* SVG Circular Progress Track */}
        <svg
          className="absolute inset-0 -rotate-90 size-12"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          {/* Background Track Circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-emerald-500/20 dark:stroke-emerald-400/15"
            strokeWidth="3"
            fill="none"
          />
          {/* Active Animated Progress Stroke */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-emerald-500 transition-[stroke-dashoffset] duration-150 ease-linear dark:stroke-emerald-400"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Center Icon */}
        <ArrowUp
          size={18}
          className="text-emerald-700 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-emerald-600 dark:text-emerald-300 dark:group-hover:text-emerald-200"
        />

        {/* Tooltip on Hover */}
        <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-xl border border-emerald-200/80 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-950 opacity-0 shadow-soft transition-all duration-200 group-hover:opacity-100 dark:border-emerald-800 dark:bg-brand-950 dark:text-emerald-200">
          {locale === "vi" ? "Lên đầu trang" : "Back to top"}
        </span>
      </button>
    </div>
  );
}
