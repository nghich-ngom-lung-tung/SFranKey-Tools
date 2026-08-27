"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "@sfrankey/ui";

export type AboutFlowCopy = {
  steps: readonly { label: string; text: string }[];
  networkTitle: string;
  networkText: string;
  networkItems: readonly string[];
  localLabel: string;
  networkLabel: string;
  inputLabel: string;
  memoryLabel: string;
  resultLabel: string;
  noUpload: string;
  noSecretApi: string;
  ariaLabel: string;
};

export function AboutPrivacyFlow({ copy, compact = false }: { copy: AboutFlowCopy; compact?: boolean }) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setActiveStep((step) => (step + 1) % copy.steps.length), 2400);
    return () => window.clearInterval(timer);
  }, [copy.steps.length, reducedMotion]);

  return (
    <div className={compact ? "about-flow-compact" : "about-flow-shell"} aria-label={copy.ariaLabel}>
      <div className="about-flow-orb about-flow-orb-one" aria-hidden="true" />
      <div className="about-flow-orb about-flow-orb-two" aria-hidden="true" />
      
      {/* ── Top Header ── */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="about-flow-brand-mark">
            <ShieldCheck size={compact ? 17 : 21} />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-800 dark:text-emerald-300">
              SFRANKEY
            </p>
            <p className="mt-0.5 text-xs font-bold text-brand-950 dark:text-emerald-100">
              {copy.localLabel}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 shadow-2xs dark:border-emerald-300/30 dark:bg-emerald-300/15 dark:text-emerald-200">
          <span className="size-2 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.7)] dark:bg-emerald-400" />
          {copy.noUpload}
        </span>
      </div>

      {/* ── 3-Step Local Processing Pipeline ── */}
      <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        {copy.steps.slice(0, 3).map((step, index) => (
          <React.Fragment key={step.label}>
            <div
              className={`about-flow-node rounded-[var(--radius-lg)] border border-[var(--flow-border)] bg-[var(--flow-surface)] p-4 shadow-soft ${
                activeStep === index ? "about-flow-node-active" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200 shadow-2xs">
                  {index === 0 ? <Sparkles size={16} /> : index === 1 ? <LockKeyhole size={16} /> : <CheckCircle2 size={16} />}
                </span>
                <span className="font-mono text-xs font-black text-brand-900/60 dark:text-emerald-200/60">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-4 text-sm font-black text-brand-950 dark:text-white">
                {step.label}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-5 text-brand-900/75 dark:text-emerald-100/70">
                {step.text}
              </p>
            </div>
            {index < 2 ? (
              <div className="flex justify-center text-emerald-700/70 dark:text-emerald-300/70 font-black" aria-hidden="true">
                <ArrowRight className="hidden sm:block" size={18} />
                <ArrowDown className="sm:hidden" size={18} />
              </div>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {!compact ? (
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-brand-900/80 dark:text-emerald-200/80">
          <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-xs" />
          {copy.steps[3]?.label}
          <span className="text-brand-900/40 dark:text-emerald-200/40">·</span>
          {copy.steps[3]?.text}
        </div>
      ) : null}

      {/* ── Network Disclosed Section ── */}
      <div className="relative z-10 mt-6 rounded-[var(--radius-lg)] border border-teal-700/25 bg-teal-50/80 p-5 shadow-soft dark:border-cyan-400/25 dark:bg-cyan-950/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.16em] text-teal-800 dark:text-cyan-300">
              {copy.networkLabel}
            </p>
            <h3 className="mt-2 text-base font-black text-brand-950 dark:text-white">
              {copy.networkTitle}
            </h3>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-teal-700/30 bg-teal-600/15 text-teal-900 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-200 shadow-2xs">
            <LockKeyhole size={17} />
          </span>
        </div>
        <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-brand-900/80 dark:text-cyan-100/75">
          {copy.networkText}
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {copy.networkItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2.5 rounded-xl border border-teal-600/30 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-teal-950 shadow-2xs dark:border-cyan-400/30 dark:bg-black/30 dark:text-cyan-100"
            >
              <CheckCircle2 size={15} className="shrink-0 text-teal-700 dark:text-cyan-300 stroke-[2.5]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      
      <span className="about-flow-signal pointer-events-none absolute left-1/2 top-[13.5rem] hidden size-2 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,.95)] sm:block" aria-hidden="true" />
    </div>
  );
}
