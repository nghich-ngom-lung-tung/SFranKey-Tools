"use client";

import * as React from "react";
import { type Locale } from "@sfrankey/shared";
import { CheckCircle2, Cpu, HardDrive, LockKeyhole, ShieldCheck, Sparkles } from "@sfrankey/ui";

interface AboutHeroTerminalProps {
  locale: Locale;
}

export function AboutHeroTerminal({ locale }: AboutHeroTerminalProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 4);
    }, 2800);
    return () => window.clearInterval(interval);
  }, []);

  const auditItems = [
    {
      icon: HardDrive,
      tag: "RAM_SANDBOX",
      title: locale === "vi" ? "Bộ nhớ RAM Trình duyệt" : "Isolated In-Memory Sandbox",
      status: "ACTIVE",
      statusColor: "text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700",
      desc: locale === "vi" ? "Toàn bộ chu kỳ dữ liệu diễn ra trong RAM, tự động giải phóng khi đóng tab" : "All data cycles execute in volatile RAM, auto-flushed on tab close"
    },
    {
      icon: ShieldCheck,
      tag: "ZERO_TELEMETRY",
      title: locale === "vi" ? "Kiểm toán Telemetry & Cookie" : "Telemetry & Tracker Audit",
      status: "VERIFIED",
      statusColor: "text-teal-700 bg-teal-100/90 dark:text-teal-300 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700",
      desc: locale === "vi" ? "Không Google Analytics, không tracking pixel, không log người dùng" : "Zero analytics SDKs, zero tracking pixels, zero persistent user logs"
    },
    {
      icon: Cpu,
      tag: "CSPRNG_ENGINE",
      title: locale === "vi" ? "WebCrypto Cryptographic Engine" : "WebCrypto Cryptographic Engine",
      status: "READY",
      statusColor: "text-cyan-700 bg-cyan-100/90 dark:text-cyan-300 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700",
      desc: locale === "vi" ? "Sinh số ngẫu nhiên & băm mật mã trực tiếp bằng phần cứng thiết bị" : "Hardware-accelerated entropy & cryptographic primitives natively on-device"
    },
    {
      icon: LockKeyhole,
      tag: "NETWORK_BOUNDARY",
      title: locale === "vi" ? "Ranh giới Mạng Minh bạch" : "Strict Network Boundary",
      status: "SECURED",
      statusColor: "text-sky-700 bg-sky-100/90 dark:text-sky-300 dark:bg-sky-950/70 border-sky-300 dark:border-sky-700",
      desc: locale === "vi" ? "Chẩn đoán mạng chỉ kết nối sau khi bạn chủ động kích hoạt và luôn báo trước" : "Outbound requests only fire on explicit user action with full destination disclosure"
    }
  ];

  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-white/95 p-6 shadow-[0_20px_50px_rgba(16,185,129,0.14)] backdrop-blur-xl sm:p-7 dark:border-emerald-700/60 dark:from-emerald-950/70 dark:via-brand-950/90 dark:to-brand-950">
      {/* Background Decorative Grid and Orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(36,127,89,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.08)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-20" />
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-teal-400/20 blur-2xl" />

      {/* Terminal Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-brand-300/40 pb-4 dark:border-brand-700/40">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-rose-400/90 shadow-xs" />
          <span className="size-3 rounded-full bg-amber-400/90 shadow-xs" />
          <span className="size-3 rounded-full bg-emerald-400/90 shadow-xs" />
          <span className="ml-2 font-mono text-[11px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
            sfrankey://security-audit
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-300 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-900 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{locale === "vi" ? "Bảo mật Cực đại" : "Zero-Telemetry Verified"}</span>
        </div>
      </div>

      {/* Audit Matrix Rows */}
      <div className="relative z-10 mt-5 grid gap-3">
        {auditItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIdx === index;
          return (
            <div
              key={item.tag}
              onClick={() => setActiveIdx(index)}
              className={`group cursor-pointer rounded-2xl border p-3.5 transition-all duration-300 ${
                isActive
                  ? "border-emerald-400/90 bg-white/95 shadow-soft dark:border-emerald-500/80 dark:bg-brand-900/80"
                  : "border-brand-200/60 bg-white/60 hover:border-brand-300 hover:bg-white/80 dark:border-brand-800/50 dark:bg-brand-950/40 dark:hover:bg-brand-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 place-items-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-xs scale-105"
                        : "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <span className="block text-xs font-black text-brand-950 dark:text-brand-50">
                      {item.title}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-brand-700/70 dark:text-brand-300/70">
                      [{item.tag}]
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${item.statusColor}`}
                >
                  {item.status}
                </span>
              </div>

              {isActive ? (
                <p className="mt-2.5 pl-10 text-[11px] leading-relaxed text-brand-900/80 dark:text-brand-100/80 animate-fade-in">
                  {item.desc}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Terminal Footer Indicator */}
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-brand-300/40 pt-4 text-[11px] text-brand-800/80 dark:border-brand-700/40 dark:text-brand-200/80">
        <span className="flex items-center gap-1.5 font-bold">
          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
          {locale === "vi" ? "Không upload dữ liệu nhạy cảm" : "Zero sensitive data uploads"}
        </span>
        <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
          TLS 1.3 / CSP Level 3
        </span>
      </div>
    </div>
  );
}
