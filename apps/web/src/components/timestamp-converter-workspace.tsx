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
import { Button, Card, CopyButton, Input, Label, Select, StatusBadge } from "@sfrankey/ui";
import { ResultPanel } from "@/components/result-panel";

type DateResult = TimestampInputResult & { detectedUnit: "seconds" | "milliseconds" };
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
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : "fallback";
}

export function TimestampConverterWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const [tab, setTab] = React.useState<TimestampTab>("toDate");
  const [timestamp, setTimestamp] = React.useState("");
  const [unit, setUnit] = React.useState<TimestampUnit>("auto");
  const [zone, setZone] = React.useState("local");
  const [dateTime, setDateTime] = React.useState("");
  const [outputUnit, setOutputUnit] = React.useState<"seconds" | "milliseconds">("seconds");
  const [disambiguation, setDisambiguation] = React.useState<DstDisambiguation>("reject");
  const [zones, setZones] = React.useState<string[]>([]);
  const [dateResult, setDateResult] = React.useState<DateResult | null>(null);
  const [wallResult, setWallResult] = React.useState<WallTimeConversionResult | null>(null);
  const [error, setError] = React.useState("");

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

  const setTabAndResetDst = (nextTab: TimestampTab) => {
    setDisambiguation("reject");
    setTab(nextTab);
  };

  const convertTimestamp = () => {
    try {
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
      setWallResult(convertWallTime({ value: dateTime, timeZone: zoneValue(zone), outputUnit, disambiguation }));
      setError("");
    } catch (caught) {
      setWallResult(null);
      const errors = t.timestamp.errors as Record<string, string>;
      setError(errors[errorCode(caught)] ?? errors.fallback);
    }
  };

  const chooseDisambiguation = (choice: Exclude<DstDisambiguation, "reject">) => {
    try {
      const result = convertWallTime({ value: dateTime, timeZone: zoneValue(zone), outputUnit, disambiguation: choice });
      setDisambiguation(choice);
      setWallResult(result);
      setError("");
    } catch (caught) {
      const errors = t.timestamp.errors as Record<string, string>;
      setError(errors[errorCode(caught)] ?? errors.fallback);
    }
  };

  const useCurrent = () => {
    const now = Date.now();
    setTimestamp(String(Math.floor(now / 1000)));
    setDateResult(null);
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

  const renderDateResult = () => {
    if (!dateResult) return null;
    const values: Array<[string, string]> = [
      [t.timestamp.detected, dateResult.detectedUnit],
      [t.timestamp.unixSeconds, dateResult.unixSeconds],
      [t.timestamp.unixMilliseconds, dateResult.unixMilliseconds],
      [t.timestamp.isoUtc, dateResult.isoUtc],
      [t.timestamp.localTime, dateResult.localText],
      [t.timestamp.selectedZone, `${selectedZoneLabel}: ${dateResult.selectedZoneText}`],
      [t.timestamp.offset, dateResult.offset],
      [t.timestamp.relative, dateResult.relativeText],
    ];
    return (
      <ResultPanel
        label={t.timestamp.title}
        status="success"
        actions={<CopyButton value={summary} label={t.timestamp.copySummary} copiedLabel={t.shared.copied} />}
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          {values.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] p-3">
              <dt className="text-xs font-semibold text-[var(--ink-muted)]">{label}</dt>
              <dd className="mt-1 break-words text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </ResultPanel>
    );
  };

  const renderWallResult = () => {
    if (!wallResult) return null;
    if (wallResult.status === "success") {
      return (
        <ResultPanel
          label={t.timestamp.title}
          status="success"
          mono
          actions={<CopyButton value={wallResult.timestamp} label={t.shared.copy} copiedLabel={t.shared.copied} />}
        >
          <p className="break-all text-lg font-bold">{wallResult.timestamp}</p>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">{wallResult.zonedDateTime} · {wallResult.offset}</p>
        </ResultPanel>
      );
    }
    return (
      <Card variant="glass" className="border-amber-300/70 dark:border-amber-700/60">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">
            {wallResult.status === "ambiguous" ? t.timestamp.ambiguousTitle : t.timestamp.nonexistentTitle}
          </p>
          <StatusBadge status="warning">{t.timestamp.dst}</StatusBadge>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{t.timestamp.dstHint}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["earlier", "later"] as const).map((choice) => {
            const item = wallResult[choice];
            return (
              <button
                key={choice}
                type="button"
                className="rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                onClick={() => chooseDisambiguation(choice)}
              >
                <span className="font-semibold">{choice === "earlier" ? t.timestamp.earlier : t.timestamp.later}</span>
                <span className="mt-2 block font-mono text-sm">{item.timestamp}</span>
                <span className="mt-1 block text-xs text-[var(--ink-muted)]">{item.offset} · {item.zonedDateTime}</span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.timestamp.title}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "toDate"}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${tab === "toDate" ? "bg-brand-500 text-brand-950" : "bg-[var(--surface-card-tinted)]"}`}
            onClick={() => setTabAndResetDst("toDate")}
          >
            {t.timestamp.tabs.toDate}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "toTimestamp"}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${tab === "toTimestamp" ? "bg-brand-500 text-brand-950" : "bg-[var(--surface-card-tinted)]"}`}
            onClick={() => setTabAndResetDst("toTimestamp")}
          >
            {t.timestamp.tabs.toTimestamp}
          </button>
        </div>

        {tab === "toDate" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_15rem]">
              <div>
                <Label htmlFor="timestamp-value">{t.timestamp.timestamp}</Label>
                <Input id="timestamp-value" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label htmlFor="timestamp-unit">{t.timestamp.unit}</Label>
                <Select id="timestamp-unit" value={unit} onChange={(event) => setUnit(event.target.value as TimestampUnit)}>
                  <option value="auto">{t.timestamp.auto}</option>
                  <option value="seconds">{t.timestamp.seconds}</option>
                  <option value="milliseconds">{t.timestamp.milliseconds}</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={convertTimestamp}>{t.timestamp.convert}</Button>
              <Button type="button" variant="secondary" onClick={useCurrent}>{t.timestamp.useCurrent}</Button>
            </div>
            {renderDateResult()}
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="wall-time">{t.timestamp.wallTime}</Label>
              <Input id="wall-time" type="datetime-local" step="1" value={dateTime} onChange={(event) => { setDateTime(event.target.value); setDisambiguation("reject"); }} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="wall-zone">{t.timestamp.timezone}</Label>
                <Select id="wall-zone" value={zone} onChange={(event) => { setZone(event.target.value); setDisambiguation("reject"); }}>
                  {zoneOptions.map((item) => <option key={item} value={item}>{item === "local" ? t.timestamp.local : item}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="wall-unit">{t.timestamp.outputUnit}</Label>
                <Select id="wall-unit" value={outputUnit} onChange={(event) => { setOutputUnit(event.target.value as "seconds" | "milliseconds"); setDisambiguation("reject"); }}>
                  <option value="seconds">{t.timestamp.seconds}</option>
                  <option value="milliseconds">{t.timestamp.milliseconds}</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={convertDate}>{t.timestamp.convert}</Button>
            </div>
            {renderWallResult()}
          </>
        )}
        {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        <Button type="button" variant="secondary" onClick={reset}>{t.shared.reset}</Button>
        <p className="text-xs leading-6 text-[var(--ink-muted)]">{t.timestamp.privacy}</p>
      </div>
    </Card>
  );
}
