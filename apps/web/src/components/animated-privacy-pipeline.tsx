"use client";

import * as React from "react";
import { type Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { cn, Cpu, ShieldCheck, Sparkles } from "@sfrankey/ui";

interface AnimatedPrivacyPipelineProps {
  locale: Locale;
}

export function AnimatedPrivacyPipeline({ locale }: AnimatedPrivacyPipelineProps) {
  const t = getDictionary(locale);
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<number>(0);

  // Cycle through step 0 -> 1 -> 2 with calm, comfortable speed (~2.5s per step)
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % 3);
          return 0;
        }
        return prev + 2; // ~2.5s per step for relaxed reading
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, []);

  const consoleLogs = [
    {
      vi: "[INPUT] Thu nhận dữ liệu trên trình duyệt · Không gửi ra ngoài",
      en: "[INPUT] Capturing raw input in isolated client memory"
    },
    {
      vi: "[RAM] WebCrypto.subtle xử lý an toàn trong bộ nhớ cô lập",
      en: "[RAM] WebCrypto.subtle executing in sandboxed memory space"
    },
    {
      vi: "[OUTPUT] Kết quả sẵn sàng trên màn hình · 0 byte truyền đi",
      en: "[OUTPUT] Result rendered locally · Zero bytes transmitted"
    }
  ];

  return (
    <div className="hero-terminal group relative overflow-hidden rounded-[var(--radius-2xl)] p-6 sm:p-7" aria-label="Privacy Pipeline">
      {/* Decorative Grid & Ambient Orbs */}
      <div className="hero-terminal-grid pointer-events-none absolute inset-0" />
      <div className="hero-terminal-orb hero-terminal-orb-one pointer-events-none absolute -right-16 -top-20 size-56 rounded-full" />
      <div className="hero-terminal-orb hero-terminal-orb-two pointer-events-none absolute -bottom-24 -left-12 size-48 rounded-full" />

      <div className="relative z-10">
        {/* Top Window Control Header */}
        <div className="flex items-center justify-between border-b border-[var(--terminal-border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-300 shadow-[0_0_14px_rgba(251,113,133,.45)]" />
            <span className="size-2.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.4)]" />
            <span className="size-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.45)]" />
            <span className="ml-2 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--terminal-muted)]">
              {locale === "vi" ? "LUỒNG XỬ LÝ CỤC BỘ" : "ON-DEVICE PIPELINE"}
            </span>
          </div>
          <span className="hero-terminal-local flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em]">
            <span className="size-1.5 rounded-full bg-brand-300 shadow-[0_0_10px_rgba(120,217,165,.8)]" />
            {locale === "vi" ? "0 Request mạng" : "0 Network Calls"}
          </span>
        </div>

        {/* 3 Pipeline Stages with Generous Spacing */}
        <div className="mt-6 flex flex-col items-center">
          {/* Stage 1: User Input */}
          <div
            onClick={() => { setActiveStep(0); setProgress(0); }}
            className={cn(
              "group/stage relative flex h-[74px] w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border px-4 backdrop-blur-md transition-all duration-300",
              activeStep === 0
                ? "border-teal-400 bg-white/95 shadow-[0_4px_24px_rgba(20,184,166,0.2)] dark:border-teal-400 dark:bg-white/[0.08]"
                : activeStep > 0
                ? "border-[var(--terminal-border)] bg-white/75 opacity-90 dark:bg-white/[0.03]"
                : "border-[var(--terminal-border)] bg-white/55 opacity-60 dark:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl shadow-xs ring-1 transition-all duration-300",
                  activeStep === 0
                    ? "bg-teal-500 text-white ring-teal-400 scale-105"
                    : "bg-teal-500/15 text-teal-700 ring-teal-500/20 dark:bg-teal-400/15 dark:text-teal-300"
                )}
              >
                <Sparkles size={18} className={activeStep === 0 ? "animate-pulse" : ""} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-[var(--terminal-ink)]">
                    1. {t.ui.flowInput}
                  </p>
                  {activeStep === 0 ? (
                    <span className="size-1.5 rounded-full bg-teal-500 animate-ping" />
                  ) : activeStep > 0 ? (
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">✓</span>
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-[var(--terminal-muted)]">
                  {locale === "vi" ? "Secret key, mật khẩu, file tải lên" : "Secret keys, passwords, local files"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors",
                activeStep === 0
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-400 dark:text-teal-950"
                  : "bg-teal-500/10 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300"
              )}
            >
              Client
            </span>

            {/* Bottom-Pinned Seamless Progress Track */}
            {activeStep === 0 ? (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-teal-200/50 dark:bg-teal-900/50">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-teal-500 shadow-[0_0_8px_#14b8a6] transition-all duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          {/* Spacious Animated Connector 1 */}
          <div className="relative flex h-10 items-center justify-center">
            <div
              className={cn(
                "h-full w-0.5 transition-colors duration-300",
                activeStep >= 1
                  ? "bg-gradient-to-b from-teal-400 via-emerald-400 to-emerald-500"
                  : "bg-[var(--terminal-border)]"
              )}
            />
            <div
              className={cn(
                "absolute size-3 rounded-full shadow-[0_0_10px_#10b981] transition-all duration-300",
                activeStep >= 0
                  ? "bg-emerald-400 animate-bounce"
                  : "bg-brand-300 opacity-30 dark:bg-brand-700"
              )}
            />
          </div>

          {/* Stage 2: Browser Memory (RAM) */}
          <div
            onClick={() => { setActiveStep(1); setProgress(0); }}
            className={cn(
              "group/stage relative flex h-[74px] w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border px-4 backdrop-blur-md transition-all duration-300",
              activeStep === 1
                ? "border-emerald-500 bg-white/95 shadow-[0_4px_24px_rgba(16,185,129,0.22)] dark:border-emerald-400 dark:bg-white/[0.08]"
                : activeStep > 1
                ? "border-[var(--terminal-border)] bg-white/75 opacity-90 dark:bg-white/[0.03]"
                : "border-[var(--terminal-border)] bg-white/55 opacity-60 dark:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl shadow-xs ring-1 transition-all duration-300",
                  activeStep === 1
                    ? "bg-emerald-500 text-white ring-emerald-400 scale-105"
                    : "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300"
                )}
              >
                <Cpu
                  size={18}
                  className={activeStep === 1 ? "animate-spin" : ""}
                  style={{ animationDuration: "3s" }}
                />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-[var(--terminal-ink)]">
                    2. {t.ui.flowMemory}
                  </p>
                  {activeStep === 1 ? (
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  ) : activeStep > 1 ? (
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">✓</span>
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-[var(--terminal-muted)]">
                  {locale === "vi" ? "Web Crypto API · Thực thi trong RAM Sandbox" : "Web Crypto API · Isolated in-RAM execution"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors",
                activeStep === 1
                  ? "bg-emerald-700 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                  : "bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200"
              )}
            >
              🔒 Sandbox
            </span>

            {/* Bottom-Pinned Seamless Progress Track */}
            {activeStep === 1 ? (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-200/50 dark:bg-emerald-900/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          {/* Spacious Animated Connector 2 */}
          <div className="relative flex h-10 items-center justify-center">
            <div
              className={cn(
                "h-full w-0.5 transition-colors duration-300",
                activeStep === 2
                  ? "bg-gradient-to-b from-emerald-500 via-cyan-400 to-cyan-500"
                  : "bg-[var(--terminal-border)]"
              )}
            />
            <div
              className={cn(
                "absolute size-3 rounded-full shadow-[0_0_10px_#06b6d4] transition-all duration-300",
                activeStep >= 1
                  ? "bg-cyan-400 animate-bounce"
                  : "bg-brand-300 opacity-30 dark:bg-brand-700"
              )}
            />
          </div>

          {/* Stage 3: Local Result */}
          <div
            onClick={() => { setActiveStep(2); setProgress(0); }}
            className={cn(
              "group/stage relative flex h-[74px] w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border px-4 backdrop-blur-md transition-all duration-300",
              activeStep === 2
                ? "border-cyan-400 bg-white/95 shadow-[0_4px_24px_rgba(6,182,212,0.2)] dark:border-cyan-400 dark:bg-white/[0.08]"
                : "border-[var(--terminal-border)] bg-white/55 opacity-60 dark:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl shadow-xs ring-1 transition-all duration-300",
                  activeStep === 2
                    ? "bg-cyan-700 text-white ring-cyan-400 scale-105"
                    : "bg-cyan-500/15 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/15 dark:text-cyan-300"
                )}
              >
                <ShieldCheck size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-[var(--terminal-ink)]">
                    3. {t.ui.flowResult}
                  </p>
                  {activeStep === 2 ? (
                    <span className="size-1.5 rounded-full bg-cyan-500 animate-ping" />
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-[var(--terminal-muted)]">
                  {locale === "vi" ? "Hiển thị tức thì · Giải phóng sạch khi đóng tab" : "Instant output · Cleared cleanly on tab close"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors",
                activeStep === 2
                  ? "bg-cyan-700 text-white shadow-xs dark:bg-cyan-400 dark:text-cyan-950"
                  : "bg-cyan-500/10 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-300"
              )}
            >
              ✓ Done
            </span>

            {/* Bottom-Pinned Seamless Progress Track */}
            {activeStep === 2 ? (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-200/50 dark:bg-cyan-900/50">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_8px_#06b6d4] transition-all duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Security Inspector Dynamic Console */}
        <div className="mt-6 rounded-2xl border border-[var(--terminal-border)] bg-[var(--terminal-soft)] p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--terminal-ink)]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              RAM Context: ISOLATED
            </span>
            <span className="text-[var(--terminal-muted)]">
              WebCrypto: CSPRNG
            </span>
          </div>
          <div className="mt-2 border-t border-[var(--terminal-border)] pt-2 text-[10px] font-mono text-[var(--terminal-ink)] opacity-90">
            <span className="text-emerald-600 dark:text-emerald-400">&gt; </span>
            {consoleLogs[activeStep]?.[locale]}
          </div>
        </div>
      </div>
    </div>
  );
}
