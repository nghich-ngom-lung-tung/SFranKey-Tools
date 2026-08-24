import { getDictionary } from "@sfrankey/i18n";
import { toolDefinitions, type Locale } from "@sfrankey/shared";
import { BrandMark, Globe2, ShieldCheck, Sparkles } from "@sfrankey/ui";
import type { ReactNode } from "react";
import { ToolCatalog } from "@/components/tool-catalog";
import { localizedMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return localizedMetadata(locale, "tools", t.nav.tools, t.home.description);
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const localTools = toolDefinitions.filter((tool) => tool.privacyMode === "on-device").length;
  const networkTools = toolDefinitions.length - localTools;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* ─── Master Hero Catalog Banner ─── */}
      <section className="relative isolate overflow-hidden rounded-[32px] border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-7 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.16)] backdrop-blur-xl sm:p-10 lg:p-12 dark:border-emerald-700/50 dark:from-emerald-950/60 dark:via-brand-950/80 dark:to-brand-950">
        {/* Ambient background grid & glow */}
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(36,127,89,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.08)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-20" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              {locale === "vi" ? "Kho Tiện Ích Đa Năng" : "Developer & Security Suite"}
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-[-.05em] text-brand-950 sm:text-4xl lg:text-5xl dark:text-brand-50">
              {t.nav.tools}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-900/75 sm:text-base dark:text-brand-100/75">
              {t.home.description}
            </p>
          </div>

          {/* 3 High-Trust Bento Stat Pills */}
          <div className="grid shrink-0 grid-cols-3 gap-3 sm:gap-4">
            <CatalogStat
              icon={<BrandMark className="size-6 text-brand-700 dark:text-brand-300" />}
              value={String(toolDefinitions.length)}
              label={t.ui.statsTools}
              desc={locale === "vi" ? "Sẵn sàng" : "Available"}
            />
            <CatalogStat
              icon={<ShieldCheck className="size-6 text-emerald-600 dark:text-emerald-400" />}
              value={String(localTools)}
              label={t.ui.onDeviceTools}
              desc={locale === "vi" ? "Cục bộ 100%" : "On-device"}
            />
            <CatalogStat
              icon={<Globe2 className="size-6 text-sky-600 dark:text-sky-400" />}
              value={String(networkTools)}
              label={locale === "vi" ? "Công cụ mạng" : "Network tools"}
              desc={locale === "vi" ? "Chẩn đoán IP" : "Explicit"}
            />
          </div>
        </div>
      </section>

      {/* ─── Search & Catalog Section ─── */}
      <div className="mt-8">
        <ToolCatalog locale={locale} />
      </div>
    </div>
  );
}

function CatalogStat({
  icon,
  value,
  label,
  desc
}: {
  icon: ReactNode;
  value: string;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex min-w-28 flex-col items-center justify-between rounded-2xl border border-brand-200/80 bg-white/85 p-3.5 text-center shadow-xs backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:min-w-32 sm:p-4 dark:border-brand-800/60 dark:bg-brand-900/60">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-500/10 shadow-2xs dark:bg-brand-400/10">
        {icon}
      </span>
      <p className="mt-2 text-2xl font-black tracking-tight text-brand-950 sm:text-3xl dark:text-brand-50">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-brand-900/70 dark:text-brand-200/70">
        {label}
      </p>
      {desc ? (
        <span className="mt-1 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-800 dark:bg-brand-400/10 dark:text-brand-300">
          {desc}
        </span>
      ) : null}
    </div>
  );
}
