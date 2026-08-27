"use client";

import * as React from "react";
import { Cpu, Globe, LockKeyhole, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@sfrankey/ui";

export type MetricIconKey = "cpu" | "shield-check" | "globe" | "lock-keyhole";

const ICON_MAP: Record<MetricIconKey, LucideIcon> = {
  cpu: Cpu,
  "shield-check": ShieldCheck,
  globe: Globe,
  "lock-keyhole": LockKeyhole,
};

interface AnimatedCounterProps {
  value: number;
  label: string;
  iconKey?: MetricIconKey;
  highlight?: "brand" | "emerald" | "sky" | "amber";
  duration?: number;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  label,
  iconKey = "cpu",
  highlight = "brand",
  duration = 1400,
  suffix = "",
}: AnimatedCounterProps) {
  const Icon = ICON_MAP[iconKey] ?? Cpu;
  const ref = React.useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = React.useState(0);
  const [hasTriggered, setHasTriggered] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayCount(value);
      setHasTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTriggered, value]);

  React.useEffect(() => {
    if (!hasTriggered) return;

    if (value === 0) {
      setDisplayCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    // Smooth easeOutExpo curve: fast burst at first, silky smooth landing
    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentVal = Math.round(easedProgress * value);

      setDisplayCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayCount(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasTriggered, value, duration]);

  const highlightStyles = {
    brand: {
      text: "text-emerald-700 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
      glow: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30",
    },
    emerald: {
      text: "text-teal-700 dark:text-teal-400",
      iconBg: "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20",
      glow: "hover:bg-teal-50/40 dark:hover:bg-teal-950/30",
    },
    sky: {
      text: "text-sky-700 dark:text-sky-400",
      iconBg: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
      glow: "hover:bg-sky-50/40 dark:hover:bg-sky-950/30",
    },
    amber: {
      text: "text-amber-700 dark:text-amber-400",
      iconBg: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
      glow: "hover:bg-amber-50/40 dark:hover:bg-amber-950/30",
    },
  }[highlight];

  return (
    <div
      ref={ref}
      className={cn(
        "group flex flex-col items-center justify-center p-4 text-center transition-all duration-300 hover:-translate-y-0.5 sm:p-5",
        highlightStyles.glow
      )}
    >
      {/* 100% Centered Hero Number */}
      <span
        className={cn(
          "font-mono text-3xl font-black tabular-nums tracking-tight transition-transform duration-300 group-hover:scale-105 sm:text-4xl lg:text-[40px] leading-none",
          highlightStyles.text
        )}
      >
        {displayCount}
        {suffix}
      </span>

      {/* 100% Centered Icon + Label */}
      <div className="mt-2.5 inline-flex items-center justify-center gap-1.5">
        <span
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-sm ring-1 transition-transform duration-300 group-hover:scale-110",
            highlightStyles.iconBg
          )}
        >
          <Icon size={10} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[.14em] text-brand-950/80 dark:text-brand-200/80">
          {label}
        </span>
      </div>
    </div>
  );
}
