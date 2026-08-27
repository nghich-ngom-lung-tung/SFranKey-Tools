"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import {
  convertWallTime,
  formatTimestamp,
  getSupportedTimeZones,
  parseTimestamp,
  type DstDisambiguation,
  type TimestampInputResult,
  type TimestampUnit,
  type WallTimeConversionResult,
} from "@sfrankey/tool-core/timestamp";
import { useToast } from "@/components/providers/toast-provider";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Copy,
  FileCode,
  Globe,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

type DateResult = TimestampInputResult & {
  detectedUnit: "seconds" | "milliseconds";
};
type TimestampTab = "toDate" | "toTimestamp";

function localZoneId() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function zoneValue(selected: string) {
  return selected === "local" ? localZoneId() : selected;
}

function currentWallTimeValue(nowMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: localZoneId(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(nowMs));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "fallback";
}

export function TimestampConverterWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [tab, setTab] = React.useState<TimestampTab>("toDate");
  const [timestamp, setTimestamp] = React.useState("");
  const [unit, setUnit] = React.useState<TimestampUnit>("auto");
  const [zone, setZone] = React.useState("local");
  const [dateTime, setDateTime] = React.useState("");
  const [outputUnit, setOutputUnit] = React.useState<
    "seconds" | "milliseconds"
  >("seconds");
  const [disambiguation, setDisambiguation] =
    React.useState<DstDisambiguation>("reject");
  const [zones, setZones] = React.useState<string[]>([]);
  const [dateResult, setDateResult] = React.useState<DateResult | null>(null);
  const [wallResult, setWallResult] =
    React.useState<WallTimeConversionResult | null>(null);
  const [error, setError] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  React.useEffect(() => {
    const now = Date.now();
    setTimestamp(String(Math.floor(now / 1000)));
    setDateTime(currentWallTimeValue(now));
    setZones(getSupportedTimeZones());
  }, []);

  React.useEffect(() => {
    setDateResult(null);
    setWallResult(null);
    setError("");
  }, [timestamp, unit, zone, dateTime, outputUnit, tab]);

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

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (tab === "toDate") {
            setTimestamp(text.trim());
          }
          toast({
            title: locale === "vi" ? "Đã dán từ clipboard" : "Pasted from clipboard",
            variant: "success",
          });
        }
      }
    } catch {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  const setTabAndResetDst = (nextTab: TimestampTab) => {
    setDisambiguation("reject");
    setTab(nextTab);
  };

  const convertTimestamp = () => {
    try {
      if (!timestamp) return;
      const parsed = parseTimestamp(timestamp, unit);
      setDateResult({
        ...formatTimestamp(parsed.unixMs, {
          locale: locale === "vi" ? "vi-VN" : "en-US",
          timeZone: zoneValue(zone),
        }),
        detectedUnit: parsed.detectedUnit,
      });
      setError("");
    } catch (caught) {
      setDateResult(null);
      const errors = t.timestamp.errors as Record<string, string>;
      setError(errors[errorCode(caught)] ?? errors.fallback);
    }
  };

  const convertDate = () => {
    try {
      if (!dateTime) return;
      setWallResult(
        convertWallTime({
          value: dateTime,
          timeZone: zoneValue(zone),
          outputUnit,
          disambiguation,
        }),
      );
      setError("");
    } catch (caught) {
      setWallResult(null);
      const errors = t.timestamp.errors as Record<string, string>;
      setError(errors[errorCode(caught)] ?? errors.fallback);
    }
  };

  const chooseDisambiguation = (
    choice: Exclude<DstDisambiguation, "reject">,
  ) => {
    try {
      const res = convertWallTime({
        value: dateTime,
        timeZone: zoneValue(zone),
        outputUnit,
        disambiguation: choice,
      });
      setDisambiguation(choice);
      setWallResult(res);
      setError("");
    } catch (caught) {
      const errors = t.timestamp.errors as Record<string, string>;
      setError(errors[errorCode(caught)] ?? errors.fallback);
    }
  };

  const useCurrent = () => {
    const now = Date.now();
    setTimestamp(String(Math.floor(now / 1000)));
    setDateTime(currentWallTimeValue(now));
    setDateResult(null);
    setWallResult(null);
  };

  const reset = () => {
    setTimestamp("");
    setDateTime("");
    setUnit("auto");
    setZone("local");
    setOutputUnit("seconds");
    setDisambiguation("reject");
    setDateResult(null);
    setWallResult(null);
    setError("");
  };

  const summary = dateResult
    ? [
        `${t.timestamp.detected}: ${dateResult.detectedUnit}`,
        `${t.timestamp.unixSeconds}: ${dateResult.unixSeconds}`,
        `${t.timestamp.unixMilliseconds}: ${dateResult.unixMilliseconds}`,
        `${t.timestamp.isoUtc}: ${dateResult.isoUtc}`,
        `${t.timestamp.localTime}: ${dateResult.localText}`,
        `${t.timestamp.selectedZone}: ${dateResult.selectedZoneText}`,
        `${t.timestamp.offset}: ${dateResult.offset}`,
        `${t.timestamp.relative}: ${dateResult.relativeText}`,
      ].join("\n")
    : "";

  const localId = localZoneId();
  const zoneOptions = [
    "UTC",
    "local",
    ...zones.filter((item) => item !== "UTC" && item !== localId),
  ];
  const selectedZoneLabel = zone === "local" ? t.timestamp.local : zone;

  return (
    <div className="w-full space-y-6">
      {/* Centered Segmented Mode Switcher */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t.timestamp.title}
          className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-1.5 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/50"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "toDate"}
            onClick={() => setTabAndResetDst("toDate")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              tab === "toDate"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <Clock size={16} className="text-brand-600 dark:text-brand-300" />
            <span>{t.timestamp.tabs.toDate}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "toTimestamp"}
            onClick={() => setTabAndResetDst("toTimestamp")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              tab === "toTimestamp"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <Calendar size={16} className="text-brand-600 dark:text-brand-300" />
            <span>{t.timestamp.tabs.toTimestamp}</span>
          </button>
        </div>
      </div>

      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Input & Configuration Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <FileCode size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Cấu hình & Nhập liệu" : "Configuration & Input"}</span>
              </div>
            </div>

            {tab === "toDate" ? (
              /* UNIX TO DATE INPUT FORM */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="timestamp-value"
                      className="text-xs font-bold text-brand-950 dark:text-brand-50"
                    >
                      {t.timestamp.timestamp}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={useCurrent}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                      >
                        <Sparkles size={12} />
                        <span>{t.timestamp.useCurrent}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                      >
                        <Clipboard size={12} />
                        <span>{locale === "vi" ? "Dán" : "Paste"}</span>
                      </button>
                      {timestamp ? (
                        <button
                          type="button"
                          onClick={() => setTimestamp("")}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 size={12} />
                          <span>{common.clear}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <input
                    id="timestamp-value"
                    value={timestamp}
                    onChange={(event) => setTimestamp(event.target.value)}
                    inputMode="decimal"
                    placeholder="1724502000"
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-sm font-bold text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                  />
                </div>

                {/* Unit Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                    {t.timestamp.unit}
                  </label>
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                    {(["auto", "seconds", "milliseconds"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          unit === u
                            ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                            : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                        }`}
                      >
                        {u === "auto"
                          ? t.timestamp.auto
                          : u === "seconds"
                            ? t.timestamp.seconds
                            : t.timestamp.milliseconds}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timezone Selector */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="timestamp-zone"
                    className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1.5"
                  >
                    <Globe size={13} className="text-brand-600 dark:text-brand-400" />
                    <span>{t.timestamp.timezone}</span>
                  </label>
                  <select
                    id="timestamp-zone"
                    value={zone}
                    onChange={(event) => setZone(event.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                  >
                    {zoneOptions.map((item) => (
                      <option key={item} value={item}>
                        {item === "local" ? `${t.timestamp.local} (${localId})` : item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* DATE TO TIMESTAMP INPUT FORM */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wall-time"
                      className="text-xs font-bold text-brand-950 dark:text-brand-50"
                    >
                      {t.timestamp.wallTime}
                    </label>
                    <button
                      type="button"
                      onClick={useCurrent}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                    >
                      <Sparkles size={12} />
                      <span>{t.timestamp.useCurrent}</span>
                    </button>
                  </div>

                  <input
                    id="wall-time"
                    type="datetime-local"
                    step="1"
                    value={dateTime}
                    onChange={(event) => {
                      setDateTime(event.target.value);
                      setDisambiguation("reject");
                    }}
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-sm font-bold text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Timezone Selector */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wall-zone"
                      className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1.5"
                    >
                      <Globe size={13} className="text-brand-600 dark:text-brand-400" />
                      <span>{t.timestamp.timezone}</span>
                    </label>
                    <select
                      id="wall-zone"
                      value={zone}
                      onChange={(event) => {
                        setZone(event.target.value);
                        setDisambiguation("reject");
                      }}
                      className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                    >
                      {zoneOptions.map((item) => (
                        <option key={item} value={item}>
                          {item === "local" ? `${t.timestamp.local} (${localId})` : item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Output Unit Pills */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                      {t.timestamp.outputUnit}
                    </label>
                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                      <button
                        type="button"
                        onClick={() => {
                          setOutputUnit("seconds");
                          setDisambiguation("reject");
                        }}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          outputUnit === "seconds"
                            ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                            : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                        }`}
                      >
                        {t.timestamp.seconds}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutputUnit("milliseconds");
                          setDisambiguation("reject");
                        }}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          outputUnit === "milliseconds"
                            ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                            : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                        }`}
                      >
                        {t.timestamp.milliseconds}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Box */}
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
                onClick={tab === "toDate" ? convertTimestamp : convertDate}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>{t.timestamp.convert}</span>
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
            {t.timestamp.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Output & Formatted Time Inspector Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.timestamp.title}</span>
            </div>

            {dateResult || wallResult ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <CheckCircle2 size={13} className="text-brand-600 dark:text-brand-300" />
                <span>{tab === "toDate" ? "ISO-8601 & Local" : "Unix Epoch"}</span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 w-full">
            {dateResult ? (
              /* DATE RESULT VIEW */
              <div className="w-full space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* ISO-8601 UTC */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65">
                        {t.timestamp.isoUtc}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dateResult.isoUtc, "iso")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "iso" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <strong className="break-all font-mono text-xs text-brand-950 dark:text-brand-50 block">
                      {dateResult.isoUtc}
                    </strong>
                  </div>

                  {/* Local Time */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65">
                        {t.timestamp.localTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dateResult.localText, "local")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "local" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <strong className="break-all font-mono text-xs text-brand-950 dark:text-brand-50 block">
                      {dateResult.localText}
                    </strong>
                  </div>

                  {/* Selected Timezone */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65">
                        {t.timestamp.selectedZone} ({selectedZoneLabel})
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dateResult.selectedZoneText, "zone")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "zone" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <strong className="break-all font-mono text-xs text-brand-950 dark:text-brand-50 block">
                      {dateResult.selectedZoneText}
                    </strong>
                  </div>

                  {/* Relative Time */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      {t.timestamp.relative}
                    </span>
                    <strong className="break-all text-xs font-bold text-brand-950 dark:text-brand-50 block">
                      {dateResult.relativeText}
                    </strong>
                  </div>

                  {/* Unix Seconds */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65">
                        {t.timestamp.unixSeconds}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(dateResult.unixSeconds), "sec")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "sec" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <strong className="font-mono text-xs text-brand-950 dark:text-brand-50 block">
                      {dateResult.unixSeconds}
                    </strong>
                  </div>

                  {/* Offset & Milliseconds */}
                  <div className="rounded-xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65">
                        {t.timestamp.offset}
                      </span>
                      <span className="font-mono text-[11px] text-brand-700/60 dark:text-brand-300/60">
                        {dateResult.detectedUnit}
                      </span>
                    </div>
                    <strong className="font-mono text-xs text-brand-950 dark:text-brand-50 block">
                      {dateResult.offset}
                    </strong>
                  </div>
                </div>
              </div>
            ) : wallResult ? (
              /* WALL TIME RESULT VIEW */
              wallResult.status === "success" ? (
                <div className="w-full space-y-3">
                  <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-2 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                    <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                        Unix Epoch Timestamp ({outputUnit})
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(wallResult.timestamp, "wall-ts")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "wall-ts" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <p className="break-all font-mono text-2xl font-black text-brand-950 dark:text-brand-50">
                      {wallResult.timestamp}
                    </p>
                    <p className="font-mono text-xs text-brand-700/70 dark:text-brand-300/70">
                      {wallResult.zonedDateTime} · {wallResult.offset}
                    </p>
                  </div>
                </div>
              ) : (
                /* DST AMBIGUOUS / NONEXISTENT VIEW */
                <div className="w-full space-y-3 rounded-2xl border border-amber-400/40 bg-amber-50/80 p-4 dark:border-amber-700/40 dark:bg-amber-950/40">
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
                    {wallResult.status === "ambiguous"
                      ? t.timestamp.ambiguousTitle
                      : t.timestamp.nonexistentTitle}
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
                    {t.timestamp.dstHint}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(["earlier", "later"] as const).map((choice) => {
                      const item = wallResult[choice];
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => chooseDisambiguation(choice)}
                          className="rounded-xl border border-amber-400/50 bg-white/90 p-3 text-left shadow-2xs hover:bg-amber-50 dark:bg-amber-900/40 transition"
                        >
                          <span className="text-xs font-bold text-brand-950 dark:text-brand-50 block">
                            {choice === "earlier" ? t.timestamp.earlier : t.timestamp.later}
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 block mt-1">
                            {item.timestamp}
                          </span>
                          <span className="text-[10px] text-brand-700/60 dark:text-brand-300/60 block mt-0.5">
                            {item.offset} · {item.zonedDateTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Clock size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "Đang chờ chuyển đổi" : "Waiting for conversion"}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Kết quả ngày giờ chi tiết sẽ hiển thị tại đây."
                      : "Detailed time conversion result will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {dateResult ? (
              <button
                type="button"
                onClick={() => copyToClipboard(summary, "summary-copy")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                {copiedField === "summary-copy" ? (
                  <Check size={16} className="stroke-[2.5]" />
                ) : (
                  <Copy size={16} className="stroke-[2.5]" />
                )}
                <span>{t.timestamp.copySummary}</span>
              </button>
            ) : wallResult && wallResult.status === "success" ? (
              <button
                type="button"
                onClick={() => copyToClipboard(wallResult.timestamp, "bottom-wall-ts")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                {copiedField === "bottom-wall-ts" ? (
                  <Check size={16} className="stroke-[2.5]" />
                ) : (
                  <Copy size={16} className="stroke-[2.5]" />
                )}
                <span>{t.shared.copy}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
