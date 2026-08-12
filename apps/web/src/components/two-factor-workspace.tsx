"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import { adjustedNow, decodeBase32, generateOtp, normalizeBase32, otpRemainingSeconds, resolveTotpConfig, scanQrImage, type ClockSyncState, type ResolvedTotpConfig, type TotpAlgorithm } from "@sfrankey/tool-core";
import { Button, Card, CopyButton, Input, Label, Select, Textarea } from "@sfrankey/ui";
import { hasClockSkewWarning, syncClock } from "@/lib/time-sync";

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
  const [config, setConfig] = React.useState<ResolvedTotpConfig | null>(null);
  const [otp, setOtp] = React.useState("");
  const [remaining, setRemaining] = React.useState(30);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [showSecret, setShowSecret] = React.useState(false);
  const [camera, setCamera] = React.useState(false);
  const [clock, setClock] = React.useState<ClockSyncState>({ status: "idle" });
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);

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

  const scanFile = React.useCallback(async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError(t.twoFactor.errors.imageType); return; }
    if (file.size > 10 * 1024 * 1024) { setError(t.twoFactor.errors.imageTooLarge); return; }
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0);
      const value = scanQrImage(context.getImageData(0, 0, canvas.width, canvas.height));
      if (!value) throw new Error("No QR");
      applyScannedValue(value);
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "No QR" ? t.twoFactor.errors.noQr : t.common.invalid);
    } finally {
      bitmap?.close();
    }
  }, [applyScannedValue, t.common.invalid, t.twoFactor.errors.imageTooLarge, t.twoFactor.errors.imageType, t.twoFactor.errors.noQr]);

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

  React.useEffect(() => {
    if (activeTab !== "scan") stopCamera();
  }, [activeTab, stopCamera]);

  React.useEffect(() => {
    if (activeTab !== "scan") return;
    const handlePaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0];
      if (file?.type.startsWith("image/")) void scanFile(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, scanFile]);

  React.useEffect(() => () => stopCamera(), [stopCamera]);

  React.useEffect(() => {
    if (!camera) return;
    let cancelled = false;
    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !video || !canvas) return;
      if (video.readyState < 2 || video.videoWidth === 0) { window.requestAnimationFrame(scanFrame); return; }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const value = scanQrImage(context.getImageData(0, 0, canvas.width, canvas.height));
      if (value) { applyScannedValue(value); stopCamera(); return; }
      window.requestAnimationFrame(scanFrame);
    };
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        window.requestAnimationFrame(scanFrame);
      } catch {
        setError(t.twoFactor.errors.camera);
        setCamera(false);
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
  }, [applyScannedValue, camera, stopCamera, t.twoFactor.errors.camera]);

  React.useEffect(() => {
    const controller = new AbortController();
    setClock({ status: "syncing" });
    void syncClock(controller.signal).then(setClock);
    return () => controller.abort();
  }, []);

  const runClockSync = React.useCallback(() => {
    const controller = new AbortController();
    setClock({ status: "syncing" });
    void syncClock(controller.signal).then(setClock);
  }, []);

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
    stopCamera();
    setActiveTab(initialTab);
    setSecret("");
    setUri("");
    setScanResult("");
    setConfig(null);
    setOtp("");
    setError("");
    setShowSecret(false);
    setRemaining(30);
    setLastUpdated(null);
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

  return <Card className="max-w-4xl">
    <h2 className="mb-5 text-lg font-bold">{t.twoFactor.title}</h2>
    <div role="tablist" aria-label={t.twoFactor.title} className="grid gap-2 sm:grid-cols-3">
      {(["secret", "uri", "scan"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-controls={`two-factor-panel-${tab}`} id={`two-factor-tab-${tab}`} onClick={() => setActiveTab(tab)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? "border-brand-500 bg-brand-100 text-brand-900 dark:bg-brand-900 dark:text-brand-50" : "border-brand-200/80 text-brand-800/70 hover:bg-brand-100/70 dark:border-brand-800 dark:text-brand-200"}`}>{tabLabel(tab)}</button>)}
    </div>

    <div id={`two-factor-panel-${activeTab}`} role="tabpanel" aria-labelledby={`two-factor-tab-${activeTab}`} className="mt-6">
      {activeTab === "secret" ? <div className="grid gap-4"><div><Label htmlFor="two-factor-secret">{t.twoFactor.secretLabel}</Label><div className="flex gap-2"><Input id="two-factor-secret" type={showSecret ? "text" : "password"} value={secret} onChange={(event) => updateSecret(event.target.value)} placeholder={t.twoFactor.secretPlaceholder} autoComplete="off" spellCheck={false} /><Button type="button" variant="secondary" onClick={() => setShowSecret((value) => !value)} aria-pressed={showSecret}>{showSecret ? t.twoFactor.hideSecret : t.twoFactor.showSecret}</Button></div></div><div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="two-factor-algorithm">{t.twoFactor.algorithm}</Label><Select id="two-factor-algorithm" value={options.algorithm} onChange={(event) => setOptions((old) => ({ ...old, algorithm: event.target.value as TotpAlgorithm }))}><option value="SHA-1">SHA-1</option><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option></Select></div><div><Label htmlFor="two-factor-digits">{t.twoFactor.digits}</Label><Select id="two-factor-digits" value={options.digits} onChange={(event) => setOptions((old) => ({ ...old, digits: Number(event.target.value) as 6 | 8 }))}><option value="6">6</option><option value="8">8</option></Select></div><div><Label htmlFor="two-factor-period">{t.twoFactor.period}</Label><Select id="two-factor-period" value={options.period} onChange={(event) => setOptions((old) => ({ ...old, period: Number(event.target.value) as 30 | 60 }))}><option value="30">30 {t.twoFactor.seconds}</option><option value="60">60 {t.twoFactor.seconds}</option></Select></div></div></div> : null}
      {activeTab === "uri" ? <div><Label htmlFor="two-factor-uri">{t.twoFactor.uriLabel}</Label><Textarea id="two-factor-uri" value={uri} onChange={(event) => updateUri(event.target.value)} placeholder={t.twoFactor.uriPlaceholder} autoComplete="off" spellCheck={false} /></div> : null}
      {activeTab === "scan" ? <div className="grid gap-4"><label htmlFor="two-factor-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void scanFile(file); }} className="grid min-h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 p-5 text-center text-sm text-brand-800/75 hover:bg-brand-100/70 dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-100/75"><span>{t.twoFactor.scanDrop}</span><input id="two-factor-file" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void scanFile(file); event.currentTarget.value = ""; }} /></label><div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => setCamera((value) => !value)}>{camera ? t.twoFactor.stopCamera : t.twoFactor.scanCamera}</Button></div>{camera ? <video ref={videoRef} className="aspect-video w-full rounded-xl bg-brand-950 object-cover" muted playsInline aria-label={t.twoFactor.scanCamera} /> : null}<p className="text-xs text-brand-800/65 dark:text-brand-200/65">{t.twoFactor.scanPasteHint}</p>{scanResult ? <div><Label htmlFor="two-factor-scan-result">{t.twoFactor.decoded}</Label><Textarea id="two-factor-scan-result" value={scanResult} readOnly /></div> : null}</div> : null}
    </div>

    {error ? <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p> : null}
    {config && otp ? <div className="mt-6 rounded-2xl bg-brand-950 p-6 text-center text-brand-50 shadow-lg"><p className="text-xs uppercase tracking-[0.25em] text-brand-300">{t.twoFactor.currentCode}</p><p className="mt-2 font-mono text-5xl font-bold tracking-[0.2em]">{otp}</p><div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-brand-900"><div className="h-full bg-brand-300 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-brand-200">{remaining} {t.twoFactor.seconds}</p><div className="mt-4 flex flex-wrap items-center justify-center gap-3"><CopyButton value={otp} label={t.common.copy} />{lastUpdated ? <span className="text-xs text-brand-300">{t.twoFactor.updated} {new Date(lastUpdated).toLocaleTimeString(locale)}</span> : null}</div></div> : null}
    {config ? <div className="mt-5 rounded-xl border border-brand-200/80 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-950/40"><p className="text-sm font-semibold text-brand-950 dark:text-brand-50">{t.twoFactor.metadata}</p><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-brand-800/60 dark:text-brand-200/60">{t.twoFactor.issuer}</dt><dd>{config.issuer ?? "—"}</dd></div><div><dt className="text-brand-800/60 dark:text-brand-200/60">{t.twoFactor.account}</dt><dd>{config.account ?? "—"}</dd></div><div><dt className="text-brand-800/60 dark:text-brand-200/60">{t.twoFactor.algorithm}</dt><dd>{config.algorithm}</dd></div><div><dt className="text-brand-800/60 dark:text-brand-200/60">{t.twoFactor.digits}</dt><dd>{config.digits}</dd></div><div><dt className="text-brand-800/60 dark:text-brand-200/60">{t.twoFactor.period}</dt><dd>{config.period} {t.twoFactor.seconds}</dd></div></dl></div> : null}
    <div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}>{t.twoFactor.reset}</Button><Button type="button" variant="ghost" onClick={runClockSync}>{t.twoFactor.syncNow}</Button><span className="text-xs text-brand-800/65 dark:text-brand-200/65">{statusText}{clock.status === "synced" ? ` · ${clock.roundTripMs} ms` : ""}</span></div>
    {hasClockSkewWarning(clock) ? <p role="status" className="mt-3 text-sm text-amber-600">{t.twoFactor.clockSkew}</p> : null}
    <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">{t.twoFactor.privacy}</p>
    <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
  </Card>;
}
