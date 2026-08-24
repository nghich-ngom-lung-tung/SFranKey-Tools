"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import { decodeBase32, generateOtp, normalizeBase32, otpRemainingSeconds, resolveTotpConfig, type ResolvedTotpConfig, type TotpAlgorithm } from "@sfrankey/tool-core/totp";
import { adjustedNow, type ClockSyncState } from "@sfrankey/tool-core/time";
import { Button, Card, ChevronDown, CopyButton, Input, KeyRound, Label, Route, ScanQrCode, Select, Textarea } from "@sfrankey/ui";
import { hasClockSkewWarning, syncClock } from "@/lib/time-sync";
import { QrScannerSurface } from "@/components/qr-scanner-surface";

type TwoFactorTab = "secret" | "uri" | "scan";
type ManualOptions = { algorithm: TotpAlgorithm; digits: 6 | 8; period: 30 | 60 };

function localizeError(error: unknown, locale: Locale) {
  const dictionary = getDictionary(locale);
  const message = error instanceof Error ? error.message : "";
  if (/HOTP/i.test(message)) return dictionary.twoFactor.errors.hotpUnsupported;
  if (/Base32|secret/i.test(message)) return dictionary.twoFactor.errors.invalidSecret;
  if (/otpauth|OTP|period|algorithm|digits|label/i.test(message)) return dictionary.twoFactor.errors.invalidUri;
  return dictionary.common.invalid;
}

function createManualConfig(value: string, options: ManualOptions): ResolvedTotpConfig {
  const secret = normalizeBase32(value);
  decodeBase32(secret);
  return { secret, algorithm: options.algorithm, digits: options.digits, period: options.period };
}

export function TwoFactorWorkspace({ locale, initialTab }: { locale: Locale; initialTab: TwoFactorTab }) {
  const t = getDictionary(locale);
  const [activeTab, setActiveTab] = React.useState<TwoFactorTab>(initialTab);
  const [secret, setSecret] = React.useState("");
  const [uri, setUri] = React.useState("");
  const [scanResult, setScanResult] = React.useState("");
  const [options, setOptions] = React.useState<ManualOptions>({ algorithm: "SHA-1", digits: 6, period: 30 });
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [config, setConfig] = React.useState<ResolvedTotpConfig | null>(null);
  const [otp, setOtp] = React.useState("");
  const [remaining, setRemaining] = React.useState(30);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [showSecret, setShowSecret] = React.useState(false);
  const [scanResetKey, setScanResetKey] = React.useState(0);
  const [clock, setClock] = React.useState<ClockSyncState>({ status: "idle" });
  const [hydrated, setHydrated] = React.useState(false);
  const syncControllerRef = React.useRef<AbortController | null>(null);

  const applyScannedValue = React.useCallback((value: string) => {
    const normalized = value.trim();
    setScanResult(normalized);
    if (!/^otpauth:\/\/(totp|hotp)\//i.test(normalized)) {
      setConfig(null);
      setError(t.twoFactor.errors.qrMustBeTotp);
      return;
    }
    try {
      const nextConfig = resolveTotpConfig(normalized);
      setUri(normalized);
      setSecret("");
      setConfig(nextConfig);
      setError("");
    } catch (caught) {
      setConfig(null);
      setError(localizeError(caught, locale));
    }
  }, [locale, t.twoFactor.errors.qrMustBeTotp]);

  React.useEffect(() => {
    if (!secret.trim()) return;
    try {
      setConfig(createManualConfig(secret, options));
      setError("");
    } catch (caught) {
      setConfig(null);
      setError(localizeError(caught, locale));
    }
  }, [locale, options, secret]);

  const runClockSync = React.useCallback(() => {
    syncControllerRef.current?.abort();
    const controller = new AbortController();
    syncControllerRef.current = controller;
    setClock({ status: "syncing" });
    void syncClock(controller.signal).then((nextState) => {
      if (!controller.signal.aborted) {
        setClock(nextState);
      }
    });
  }, []);

  React.useEffect(() => {
    runClockSync();
    return () => syncControllerRef.current?.abort();
  }, [runClockSync]);

  React.useEffect(() => { setHydrated(true); }, []);

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!config) { setOtp(""); setLastUpdated(null); return; }
      try {
        const now = adjustedNow(clock);
        const nextOtp = await generateOtp(config, now);
        if (cancelled) return;
        setOtp(nextOtp);
        setRemaining(otpRemainingSeconds(now, config.period));
        setLastUpdated(now);
        setError("");
      } catch (caught) {
        if (!cancelled) { setOtp(""); setError(localizeError(caught, locale)); }
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [clock, config, locale]);

  const reset = () => {
    setActiveTab(initialTab);
    setSecret("");
    setUri("");
    setScanResult("");
    setConfig(null);
    setOtp("");
    setError("");
    setShowSecret(false);
    setShowAdvanced(false);
    setOptions({ algorithm: "SHA-1", digits: 6, period: 30 });
    setRemaining(30);
    setLastUpdated(null);
    setScanResetKey((key) => key + 1);
  };

  const updateSecret = (value: string) => {
    setSecret(value);
    setUri("");
    setScanResult("");
    if (!value.trim()) { setConfig(null); setError(""); }
  };

  const updateUri = (value: string) => {
    setUri(value);
    setSecret("");
    setScanResult("");
    if (!value.trim()) { setConfig(null); setError(""); return; }
    try { setConfig(resolveTotpConfig(value)); setError(""); } catch (caught) { setConfig(null); setError(localizeError(caught, locale)); }
  };

  const tabLabel = (tab: TwoFactorTab) => t.twoFactor.tabs[tab];
  const statusText = clock.status === "syncing" ? t.twoFactor.clockSyncing : clock.status === "synced" ? t.twoFactor.clockSynced : t.twoFactor.clockFallback;
  const progress = config ? Math.min(100, Math.max(0, (remaining / config.period) * 100)) : 0;
  const isCustomOptions = options.algorithm !== "SHA-1" || options.digits !== 6 || options.period !== 30;

  const tabIcons: Record<TwoFactorTab, React.ReactNode> = {
    secret: <KeyRound size={15} />,
    uri: <Route size={15} />,
    scan: <ScanQrCode size={15} />
  };

  return <Card variant="workspace" data-two-factor-ready={hydrated ? "true" : undefined} className="w-full rounded-[var(--radius-2xl)] border border-[var(--border-card)] bg-[var(--surface-workspace)] p-6 shadow-card sm:p-8">
    <div className="flex justify-center">
      <div role="tablist" aria-label={t.twoFactor.title} className="inline-flex w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] p-1.5 shadow-inner">
        {(["secret", "uri", "scan"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`two-factor-panel-${tab}`}
              id={`two-factor-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
                active
                  ? "bg-brand-500 text-brand-950 shadow-soft"
                  : "text-brand-700/70 hover:bg-white/60 hover:text-brand-950 dark:text-brand-300/70 dark:hover:bg-brand-900/50 dark:hover:text-brand-50"
              }`}
            >
              {tabIcons[tab]}
              <span>{tabLabel(tab)}</span>
            </button>
          );
        })}
      </div>
    </div>

    <div id={`two-factor-panel-${activeTab}`} role="tabpanel" aria-labelledby={`two-factor-tab-${activeTab}`} className="mt-6">
      {activeTab === "secret" ? <div className="grid gap-4">
        <div>
          <Label htmlFor="two-factor-secret">{t.twoFactor.secretLabel}</Label>
          <div className="flex gap-2">
            <Input id="two-factor-secret" type={showSecret ? "text" : "password"} value={secret} onChange={(event) => updateSecret(event.target.value)} placeholder={t.twoFactor.secretPlaceholder} autoComplete="off" spellCheck={false} />
            <Button type="button" variant="secondary" onClick={() => setShowSecret((value) => !value)} aria-pressed={showSecret}>{showSecret ? t.twoFactor.hideSecret : t.twoFactor.showSecret}</Button>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-50"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
            <span>{showAdvanced ? t.twoFactor.hideAdvanced : t.twoFactor.advancedOptions}</span>
            {isCustomOptions ? <span className="size-1.5 rounded-full bg-brand-500" /> : null}
          </button>
        </div>

        {showAdvanced ? (
          <div className="grid gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] p-4 animate-fade-in sm:grid-cols-3">
            <div>
              <Label htmlFor="two-factor-algorithm">{t.twoFactor.algorithm}</Label>
              <Select id="two-factor-algorithm" value={options.algorithm} onChange={(event) => setOptions((old) => ({ ...old, algorithm: event.target.value as TotpAlgorithm }))}>
                <option value="SHA-1">SHA-1 (Default)</option>
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="two-factor-digits">{t.twoFactor.digits}</Label>
              <Select id="two-factor-digits" value={options.digits} onChange={(event) => setOptions((old) => ({ ...old, digits: Number(event.target.value) as 6 | 8 }))}>
                <option value="6">6 {t.twoFactor.digits.toLowerCase()}</option>
                <option value="8">8 {t.twoFactor.digits.toLowerCase()}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="two-factor-period">{t.twoFactor.period}</Label>
              <Select id="two-factor-period" value={options.period} onChange={(event) => setOptions((old) => ({ ...old, period: Number(event.target.value) as 30 | 60 }))}>
                <option value="30">30 {t.twoFactor.seconds}</option>
                <option value="60">60 {t.twoFactor.seconds}</option>
              </Select>
            </div>
          </div>
        ) : null}
      </div> : null}
      {activeTab === "uri" ? <div><Label htmlFor="two-factor-uri">{t.twoFactor.uriLabel}</Label><Textarea id="two-factor-uri" value={uri} onChange={(event) => updateUri(event.target.value)} placeholder={t.twoFactor.uriPlaceholder} autoComplete="off" spellCheck={false} /></div> : null}
      {activeTab === "scan" ? <div className="grid gap-4"><QrScannerSurface resetKey={scanResetKey} labels={{ drop: t.twoFactor.scanDrop, browse: t.twoFactor.scanUpload, active: t.twoFactor.scanDrop, remove: t.twoFactor.reset, camera: t.twoFactor.scanCamera, stopCamera: t.twoFactor.stopCamera, pasteHint: t.twoFactor.scanPasteHint, processing: t.common.loading, errors: { type: t.twoFactor.errors.imageType, size: t.twoFactor.errors.imageTooLarge, noQr: t.twoFactor.errors.noQr, camera: t.twoFactor.errors.camera, invalid: t.common.invalid } }} onDecoded={applyScannedValue} />{scanResult ? <div><Label htmlFor="two-factor-scan-result">{t.twoFactor.decoded}</Label><Textarea id="two-factor-scan-result" value={scanResult} readOnly /></div> : null}</div> : null}
    </div>

    {error ? <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p> : null}
    
    {config && otp ? (
      <div className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border border-brand-500/25 bg-gradient-to-b from-brand-950/95 to-brand-950 p-6 text-center text-white shadow-raised dark:border-brand-400/20 dark:from-brand-950 dark:to-black">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">
          <span>{t.twoFactor.currentCode}</span>
          <span className={remaining <= 5 ? "animate-pulse font-mono text-rose-400 font-black" : remaining <= 10 ? "font-mono text-amber-300" : "font-mono text-emerald-300"}>
            {remaining} {t.twoFactor.seconds}
          </span>
        </div>

        <div className="my-6 flex items-center justify-center gap-3 font-mono text-5xl font-black tracking-[0.22em] text-emerald-300 drop-shadow-[0_0_24px_rgba(110,231,183,0.35)] sm:text-6xl">
          <span>{otp.slice(0, Math.ceil(otp.length / 2))}</span>
          <span className="text-white/30">·</span>
          <span>{otp.slice(Math.ceil(otp.length / 2))}</span>
        </div>

        <div className="mx-auto h-2 max-w-sm overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full origin-left transition-all duration-500 ${
              remaining <= 5
                ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                : remaining <= 10
                  ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  : "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
            }`}
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <CopyButton value={otp} label={t.common.copy} />
          {lastUpdated ? (
            <span className="text-xs text-white/50">
              {t.twoFactor.updated} {new Date(lastUpdated).toLocaleTimeString(locale)}
            </span>
          ) : null}
        </div>
      </div>
    ) : null}

    {config ? (
      <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-800 dark:text-brand-200">
          {t.twoFactor.metadata}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 font-medium">
            <span className="text-[var(--ink-muted)]">{t.twoFactor.issuer}:</span>
            <strong>{config.issuer ?? "—"}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 font-medium">
            <span className="text-[var(--ink-muted)]">{t.twoFactor.account}:</span>
            <strong>{config.account ?? "—"}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 font-medium">
            <span className="text-[var(--ink-muted)]">{t.twoFactor.algorithm}:</span>
            <strong>{config.algorithm}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 font-medium">
            <span className="text-[var(--ink-muted)]">{t.twoFactor.digits}:</span>
            <strong>{config.digits}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 font-medium">
            <span className="text-[var(--ink-muted)]">{t.twoFactor.period}:</span>
            <strong>{config.period} {t.twoFactor.seconds}</strong>
          </span>
        </div>
      </div>
    ) : null}

    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={reset}>{t.twoFactor.reset}</Button>
      <Button type="button" variant="ghost" onClick={runClockSync}>{t.twoFactor.syncNow}</Button>
      <span className="text-xs text-brand-800/65 dark:text-brand-200/65">{statusText}{clock.status === "synced" ? ` · ${clock.roundTripMs} ms` : ""}</span>
    </div>
    {hasClockSkewWarning(clock) ? <p role="status" className="mt-3 text-sm text-amber-600">{t.twoFactor.clockSkew}</p> : null}
    <p className="mt-6 text-xs text-brand-800/65 dark:text-brand-200/65">{t.twoFactor.privacy}</p>
  </Card>;
}
