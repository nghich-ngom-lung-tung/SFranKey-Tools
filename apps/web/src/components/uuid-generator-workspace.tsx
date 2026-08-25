"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import {
  generateUuidBatch,
  type GeneratedUuidBatch,
  type UuidCase,
  type UuidErrorCode,
} from "@sfrankey/tool-core/uuid";
import { downloadText } from "@/lib/download";
import { useToast } from "./toast-provider";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Fingerprint,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";

function configKey(count: number, casing: UuidCase, hyphens: boolean) {
  return `${count}:${casing}:${hyphens}`;
}

export function UuidGeneratorWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [count, setCount] = React.useState(5);
  const [casing, setCasing] = React.useState<UuidCase>("lowercase");
  const [hyphens, setHyphens] = React.useState(true);
  const [batch, setBatch] = React.useState<GeneratedUuidBatch | null>(null);
  const [generatedConfig, setGeneratedConfig] = React.useState("");
  const [error, setError] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const currentConfig = configKey(count, casing, hyphens);

  const copyToClipboard = async (textToCopy: string, fieldId = "main") => {
    if (!textToCopy) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedField(fieldId);
      toast({
        title: common.copied,
        variant: "success",
      });
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  const generate = () => {
    try {
      const next = generateUuidBatch({ count, casing, hyphens });
      setBatch(next);
      setGeneratedConfig(currentConfig);
      setError("");
    } catch (caught) {
      const code =
        caught && typeof caught === "object" && "code" in caught
          ? (String(caught.code) as UuidErrorCode)
          : "CRYPTO_UNAVAILABLE";
      setError(t.uuid.errors[code] ?? t.uuid.errors.fallback);
      setBatch(null);
    }
  };

  const reset = () => {
    setCount(5);
    setCasing("lowercase");
    setHyphens(true);
    setBatch(null);
    setGeneratedConfig("");
    setError("");
  };

  const values = batch?.values ?? [];
  const changed = Boolean(batch && generatedConfig !== currentConfig);

  return (
    <div className="w-full space-y-6">
      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Configuration Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <Sliders size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Cấu hình sinh UUID" : "UUID Configuration"}</span>
              </div>
            </div>

            {/* Quick Count Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="uuid-count"
                  className="text-xs font-bold text-brand-950 dark:text-brand-50"
                >
                  {t.uuid.count}
                </label>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {count} UUIDs
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                {[1, 5, 10, 25].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCount(preset)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      count === preset
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                id="uuid-count"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={Number.isNaN(count) ? "" : count}
                onChange={(event) =>
                  setCount(
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                  )
                }
                className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3.5 py-2 font-mono text-xs font-bold text-brand-950 shadow-inner outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
              />
            </div>

            {/* Casing & Hyphens Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Casing Pills */}
              <div className="space-y-1.5">
                <label
                  htmlFor="uuid-casing"
                  className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70"
                >
                  {t.uuid.casing}
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                  <button
                    type="button"
                    onClick={() => setCasing("lowercase")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      casing === "lowercase"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.uuid.lowercase}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCasing("uppercase")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      casing === "uppercase"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.uuid.uppercase}
                  </button>
                </div>
                {/* Hidden select for standard form accessibility */}
                <select
                  id="uuid-casing"
                  className="sr-only"
                  value={casing}
                  onChange={(event) => setCasing(event.target.value as UuidCase)}
                >
                  <option value="lowercase">{t.uuid.lowercase}</option>
                  <option value="uppercase">{t.uuid.uppercase}</option>
                </select>
              </div>

              {/* Hyphens Switcher */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/40 text-xs font-bold text-brand-900 dark:text-brand-100">
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={(event) => setHyphens(event.target.checked)}
                    className="size-4 rounded-md border-emerald-500/30 text-brand-600 focus:ring-brand-500/30 dark:bg-emerald-950/60"
                  />
                  <span>{t.uuid.hyphens} (xxxx-xxxx-...)</span>
                </label>
              </div>
            </div>

            {/* Config Changed Warning Badge */}
            {changed ? (
              <div className="rounded-xl border border-amber-400/50 bg-amber-50/80 p-2.5 text-xs font-semibold text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t.uuid.changed}</span>
              </div>
            ) : null}

            {/* Error Alert Box */}
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={generate}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>{t.uuid.generate}</span>
              </button>

              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-brand-200/80 bg-white/90 px-4 py-3 text-xs font-bold text-brand-800 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200 transition"
              >
                {t.shared.reset}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.uuid.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: UUID Batch Inspector Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.uuid.title}</span>
            </div>

            {values.length ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <CheckCircle2 size={13} className="text-brand-600 dark:text-brand-300" />
                <span>RFC 4122 v4 ({values.length})</span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 w-full">
            {values.length ? (
              <div className="w-full space-y-3">
                <ol className="grid max-h-72 sm:max-h-80 gap-2 overflow-y-auto pr-1">
                  {values.map((val, index) => (
                    <li
                      key={`${val}-${index}`}
                      role="listitem"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-white/95 p-2.5 shadow-2xs hover:border-brand-500/40 dark:border-emerald-500/20 dark:bg-[#07241a]/90 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="grid size-5 shrink-0 place-items-center rounded bg-emerald-500/15 font-mono text-[10px] font-bold text-brand-800 dark:text-brand-200">
                          {index + 1}
                        </span>
                        <span className="truncate font-mono text-xs font-bold text-brand-950 dark:text-brand-50">
                          {val}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(val, `uuid-${index}`)}
                        className="rounded-lg p-1.5 text-brand-700 hover:bg-emerald-100/60 hover:text-brand-950 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition shrink-0"
                        title={common.copy}
                      >
                        {copiedField === `uuid-${index}` ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Standard
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50 text-[11px]">
                      RFC 4122 Version 4
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Entropy
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50 text-[11px]">
                      122 CSPRNG Bits
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Fingerprint size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {t.uuid.empty}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Chọn số lượng và bấm 'Tạo UUID' để sinh danh sách."
                      : "Choose batch count and click 'Generate UUIDs' to create list."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {values.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(values.join("\n"), "copy-all-uuid")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                >
                  {copiedField === "copy-all-uuid" ? (
                    <Check size={16} className="stroke-[2.5]" />
                  ) : (
                    <Copy size={16} className="stroke-[2.5]" />
                  )}
                  <span>{t.uuid.copyAll}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadText({
                      value: values.join("\n"),
                      fileName: "sfrankey-uuid-v4.txt",
                    })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/90 py-3 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 transition"
                >
                  <Download size={14} />
                  <span>{t.uuid.download}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
