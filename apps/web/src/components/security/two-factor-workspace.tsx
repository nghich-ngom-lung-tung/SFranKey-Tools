"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import {
  decodeBase32,
  generateOtp,
  normalizeBase32,
  otpRemainingSeconds,
  resolveTotpConfig,
  type ResolvedTotpConfig,
  type TotpAlgorithm,
} from "@sfrankey/tool-core/totp";
import { adjustedNow, type ClockSyncState } from "@sfrankey/tool-core/time";
import { hasClockSkewWarning, syncClock } from "@/lib/time-sync";
import { QrScannerSurface } from "@/components/qr/qr-scanner-surface";
import { useToast } from "@/components/providers/toast-provider";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Hash,
  Info,
  KeyRound,
  Lock,
  Radio,
  RefreshCw,
  Route,
  ScanQrCode,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
  Trash2,
  User,
  Zap,
} from "lucide-react";

type TwoFactorTab = "secret" | "uri" | "scan";
type ManualOptions = {
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: 30 | 60;
};

function localizeError(error: unknown, locale: Locale) {
  const dictionary = getDictionary(locale);
  const message = error instanceof Error ? error.message : "";
  if (/HOTP/i.test(message)) return dictionary.twoFactor.errors.hotpUnsupported;
  if (/Base32|secret/i.test(message))
    return dictionary.twoFactor.errors.invalidSecret;
  if (/otpauth|OTP|period|algorithm|digits|label/i.test(message))
    return dictionary.twoFactor.errors.invalidUri;
  return dictionary.common.invalid;
}

function createManualConfig(
  value: string,
  options: ManualOptions,
): ResolvedTotpConfig {
  const secret = normalizeBase32(value);
  decodeBase32(secret);
  return {
    secret,
    algorithm: options.algorithm,
    digits: options.digits,
    period: options.period,
  };
}

export function TwoFactorWorkspace({
  locale,
  initialTab,
}: {
  locale: Locale;
  initialTab: TwoFactorTab;
}) {
  const t = getDictionary(locale);
  const common = t.common;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<TwoFactorTab>(initialTab);
  const [secret, setSecret] = React.useState("");
  const [uri, setUri] = React.useState("");
  const [scanResult, setScanResult] = React.useState("");
  const [options, setOptions] = React.useState<ManualOptions>({
    algorithm: "SHA-1",
    digits: 6,
    period: 30,
  });
  const [config, setConfig] = React.useState<ResolvedTotpConfig | null>(null);
  const [otp, setOtp] = React.useState("");
  const [remaining, setRemaining] = React.useState(30);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [showSecret, setShowSecret] = React.useState(false);
  const [scanResetKey, setScanResetKey] = React.useState(0);
  const [clock, setClock] = React.useState<ClockSyncState>({ status: "idle" });
  const [hydrated, setHydrated] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const syncControllerRef = React.useRef<AbortController | null>(null);

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
          if (activeTab === "secret") {
            updateSecret(text.trim());
          } else if (activeTab === "uri") {
            updateUri(text.trim());
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

  const handleLoadSample = (sampleSecret = "JBSWY3DPEHPK3PXP") => {
    if (activeTab === "secret") {
      updateSecret(sampleSecret);
    } else if (activeTab === "uri") {
      updateUri(
        "otpauth://totp/SFranKey:demo@sfrankey.com?secret=" +
          sampleSecret +
          "&issuer=SFranKey&algorithm=SHA1&digits=6&period=30",
      );
    }
  };

  const applyScannedValue = React.useCallback(
    (value: string) => {
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
    },
    [locale, t.twoFactor.errors.qrMustBeTotp],
  );

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

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!config) {
        setOtp("");
        setLastUpdated(null);
        return;
      }
      try {
        const now = adjustedNow(clock);
        const nextOtp = await generateOtp(config, now);
        if (cancelled) return;
        setOtp(nextOtp);
        setRemaining(otpRemainingSeconds(now, config.period));
        setLastUpdated(now);
        setError("");
      } catch (caught) {
        if (!cancelled) {
          setOtp("");
          setError(localizeError(caught, locale));
        }
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
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
    setOptions({ algorithm: "SHA-1", digits: 6, period: 30 });
    setRemaining(30);
    setLastUpdated(null);
    setScanResetKey((key) => key + 1);
  };

  const updateSecret = (value: string) => {
    setSecret(value);
    setUri("");
    setScanResult("");
    if (!value.trim()) {
      setConfig(null);
      setError("");
    }
  };

  const updateUri = (value: string) => {
    setUri(value);
    setSecret("");
    setScanResult("");
    if (!value.trim()) {
      setConfig(null);
      setError("");
      return;
    }
    try {
      setConfig(resolveTotpConfig(value));
      setError("");
    } catch (caught) {
      setConfig(null);
      setError(localizeError(caught, locale));
    }
  };

  const tabLabel = (tab: TwoFactorTab) => t.twoFactor.tabs[tab];
  const statusText =
    clock.status === "syncing"
      ? t.twoFactor.clockSyncing
      : clock.status === "synced"
        ? t.twoFactor.clockSynced
        : t.twoFactor.clockFallback;
  const progress = config
    ? Math.min(100, Math.max(0, (remaining / config.period) * 100))
    : 0;

  const tabIcons: Record<TwoFactorTab, React.ReactNode> = {
    secret: <KeyRound size={15} />,
    uri: <Route size={15} />,
    scan: <ScanQrCode size={15} />,
  };

  return (
    <div
      data-two-factor-ready={hydrated ? "true" : undefined}
      className="w-full space-y-6"
    >
      {/* Centered Segmented Mode Switcher */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t.twoFactor.title}
          className="inline-flex w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-1.5 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/50"
        >
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
                    ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                    : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                }`}
              >
                {tabIcons[tab]}
                <span>{tabLabel(tab)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Configuration & Input Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            {/* Header with Clock Sync Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <KeyRound size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Khóa bí mật & Cài đặt 2FA" : "Secret Key & 2FA Setup"}</span>
              </div>

              {/* Clock Sync Status Badge */}
              <button
                type="button"
                onClick={runClockSync}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-brand-800 shadow-2xs hover:bg-white dark:border-emerald-500/20 dark:bg-[#07241a]/80 dark:text-brand-200 transition"
                title={t.twoFactor.syncNow}
              >
                <RefreshCw
                  size={12}
                  className={`text-brand-600 dark:text-brand-400 ${
                    clock.status === "syncing" ? "animate-spin" : ""
                  }`}
                />
                <span className="truncate max-w-40">
                  {statusText}
                  {clock.status === "synced" && clock.roundTripMs
                    ? ` (${clock.roundTripMs}ms)`
                    : ""}
                </span>
              </button>
            </div>

            {/* Active Tab Panel */}
            <div
              id={`two-factor-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`two-factor-tab-${activeTab}`}
              className="space-y-5"
            >
              {activeTab === "secret" ? (
                /* SECRET INPUT TAB */
                <div className="space-y-5">
                  {/* Secret Input Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="two-factor-secret"
                        className="text-xs font-bold text-brand-950 dark:text-brand-50"
                      >
                        {t.twoFactor.secretLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSecret((v) => !v)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                          <span>
                            {showSecret
                              ? t.twoFactor.hideSecret
                              : t.twoFactor.showSecret}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePaste}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          <Clipboard size={12} />
                          <span>{locale === "vi" ? "Dán" : "Paste"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          <Sparkles size={12} />
                          <span>{locale === "vi" ? "Mẫu" : "Sample"}</span>
                        </button>
                        {secret ? (
                          <button
                            type="button"
                            onClick={() => updateSecret("")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 size={12} />
                            <span>{common.clear}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <input
                      id="two-factor-secret"
                      type={showSecret ? "text" : "password"}
                      value={secret}
                      onChange={(event) => updateSecret(event.target.value)}
                      placeholder={t.twoFactor.secretPlaceholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-sm font-bold text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                    />
                  </div>

                  {/* Settings Grid: Algorithm, Digits, Period */}
                  <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-950 dark:text-brand-50">
                      <Sliders size={13} className="text-brand-600 dark:text-brand-400" />
                      <span>{t.twoFactor.advancedOptions}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* Algorithm */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="two-factor-algorithm"
                          className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70"
                        >
                          {t.twoFactor.algorithm}
                        </label>
                        <select
                          id="two-factor-algorithm"
                          value={options.algorithm}
                          onChange={(event) =>
                            setOptions((old) => ({
                              ...old,
                              algorithm: event.target.value as TotpAlgorithm,
                            }))
                          }
                          className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                        >
                          <option value="SHA-1">SHA-1 (Default)</option>
                          <option value="SHA-256">SHA-256</option>
                          <option value="SHA-512">SHA-512</option>
                        </select>
                      </div>

                      {/* Digits */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="two-factor-digits"
                          className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70"
                        >
                          {t.twoFactor.digits}
                        </label>
                        <select
                          id="two-factor-digits"
                          value={options.digits}
                          onChange={(event) =>
                            setOptions((old) => ({
                              ...old,
                              digits: Number(event.target.value) as 6 | 8,
                            }))
                          }
                          className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                        >
                          <option value="6">
                            6 {locale === "vi" ? "chữ số" : "digits"}
                          </option>
                          <option value="8">
                            8 {locale === "vi" ? "chữ số" : "digits"}
                          </option>
                        </select>
                      </div>

                      {/* Period */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="two-factor-period"
                          className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70"
                        >
                          {t.twoFactor.period}
                        </label>
                        <select
                          id="two-factor-period"
                          value={options.period}
                          onChange={(event) =>
                            setOptions((old) => ({
                              ...old,
                              period: Number(event.target.value) as 30 | 60,
                            }))
                          }
                          className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                        >
                          <option value="30">30 {t.twoFactor.seconds}</option>
                          <option value="60">60 {t.twoFactor.seconds}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security & Standard Information Box (Fills empty vertical space cleanly) */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-[#07241a]/40 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-brand-950 dark:text-brand-50">
                      <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
                      <span>{locale === "vi" ? "Bảo mật & Tương thích chuẩn" : "Security & Standard Support"}</span>
                    </div>
                    <ul className="space-y-1.5 text-brand-800/75 dark:text-brand-200/75 text-[11px]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{locale === "vi" ? "100% xử lý cục bộ trên trình duyệt, không lưu trữ hay truyền qua internet." : "100% processed locally in-browser, never stored or sent over the internet."}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{locale === "vi" ? "Tương thích chuẩn RFC 6238 (Google Authenticator, Authy, 1Password, Bitwarden)." : "Fully compliant with RFC 6238 (Google Authenticator, Authy, 1Password, Bitwarden)."}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : null}

              {activeTab === "uri" ? (
                /* URI INPUT TAB */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="two-factor-uri"
                        className="text-xs font-bold text-brand-950 dark:text-brand-50"
                      >
                        {t.twoFactor.uriLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePaste}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          <Clipboard size={12} />
                          <span>{locale === "vi" ? "Dán" : "Paste"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          <Sparkles size={12} />
                          <span>{locale === "vi" ? "Mẫu" : "Sample"}</span>
                        </button>
                        {uri ? (
                          <button
                            type="button"
                            onClick={() => updateUri("")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 size={12} />
                            <span>{common.clear}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <textarea
                      id="two-factor-uri"
                      value={uri}
                      onChange={(event) => updateUri(event.target.value)}
                      placeholder={t.twoFactor.uriPlaceholder}
                      autoComplete="off"
                      spellCheck={false}
                      rows={5}
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-xs text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                    />
                  </div>

                  {/* URI Format Guide */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-3.5 text-xs text-brand-800/75 dark:border-emerald-500/20 dark:bg-[#07241a]/40 dark:text-brand-200/75">
                    <p className="font-bold text-brand-950 dark:text-brand-50 mb-1">
                      {locale === "vi" ? "Định dạng URI mẫu:" : "Sample URI format:"}
                    </p>
                    <code className="block break-all font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                      otpauth://totp/Service:user@email.com?secret=JBSWY3DPEHPK3PXP&issuer=Service
                    </code>
                  </div>
                </div>
              ) : null}

              {activeTab === "scan" ? (
                /* QR SCANNER TAB */
                <div className="space-y-4">
                  <QrScannerSurface
                    resetKey={scanResetKey}
                    labels={{
                      drop: t.twoFactor.scanDrop,
                      browse: t.twoFactor.scanUpload,
                      active: t.twoFactor.scanDrop,
                      remove: t.twoFactor.reset,
                      camera: t.twoFactor.scanCamera,
                      stopCamera: t.twoFactor.stopCamera,
                      pasteHint: t.twoFactor.scanPasteHint,
                      processing: t.common.loading,
                      scanning: locale === "vi" ? "Đang quét trực tiếp…" : "Scanning live…",
                      errors: {
                        type: t.twoFactor.errors.imageType,
                        size: t.twoFactor.errors.imageTooLarge,
                        noQr: t.twoFactor.errors.noQr,
                        camera: t.twoFactor.errors.camera,
                        invalid: t.common.invalid,
                      },
                    }}
                    onDecoded={applyScannedValue}
                  />

                  {scanResult ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="two-factor-scan-result"
                        className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70"
                      >
                        {t.twoFactor.decoded}
                      </label>
                      <textarea
                        id="two-factor-scan-result"
                        value={scanResult}
                        readOnly
                        rows={3}
                        className="w-full rounded-xl border border-emerald-500/20 bg-white/80 p-2.5 font-mono text-xs text-brand-950 shadow-inner dark:border-emerald-500/20 dark:bg-[#07241a]/80 dark:text-brand-50"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Error Message Box */}
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </div>
            ) : null}

            {/* Clock Skew Warning if any */}
            {hasClockSkewWarning(clock) ? (
              <div
                role="status"
                className="rounded-2xl border border-amber-400/50 bg-amber-50/80 p-3.5 text-xs font-semibold text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100 flex items-start gap-2"
              >
                <AlertTriangle
                  size={15}
                  className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0"
                />
                <span>{t.twoFactor.clockSkew}</span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-brand-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-brand-800 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200 transition"
              >
                {t.twoFactor.reset}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.twoFactor.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Live Token & OTP Inspector Stage */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <Radio size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.twoFactor.currentCode}</span>
            </div>

            {config && otp ? (
              <span
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold ring-1 ${
                  remaining <= 5
                    ? "bg-rose-500/15 text-rose-800 ring-rose-500/30 dark:bg-rose-900/60 dark:text-rose-200 animate-pulse font-black"
                    : remaining <= 10
                      ? "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:bg-amber-900/60 dark:text-amber-200"
                      : "bg-emerald-500/20 text-emerald-900 ring-emerald-500/30 dark:bg-emerald-900/60 dark:text-emerald-200"
                }`}
              >
                <Timer size={13} />
                <span>
                  {remaining} {t.twoFactor.seconds}
                </span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 w-full">
            {config && otp ? (
              /* ACTIVE LIVE TOKEN DISPLAY */
              <div className="w-full space-y-5">
                {/* Unified JADE-CYAN FUSION HERO CARD */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => copyToClipboard(otp, "otp-hero")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void copyToClipboard(otp, "otp-hero");
                    }
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-teal-400/50 bg-gradient-to-br from-emerald-100/90 via-teal-50/95 to-cyan-100/80 p-6 sm:p-7 text-center shadow-[0_16px_45px_rgba(20,184,166,0.22)] transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_20px_60px_rgba(6,182,212,0.32)] active:scale-[0.99] select-none dark:border-teal-400/40 dark:bg-gradient-to-br dark:from-[#0a3a2d] dark:via-[#072d24] dark:to-[#04201c] dark:shadow-[0_16px_50px_rgba(20,184,166,0.28)]"
                  title={locale === "vi" ? "Nhấp để sao chép nhanh mã OTP" : "Click to copy OTP code"}
                >
                  {/* Cyan-Emerald Ambient Radial Glow */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.25)_0%,transparent_70%)]" />

                  {/* Click to Copy Indicator Badge */}
                  <div className="relative z-10 mb-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800 transition-colors group-hover:text-teal-950 dark:text-cyan-300/90 dark:group-hover:text-cyan-200">
                    {copiedField === "otp-hero" ? (
                      <>
                        <Check size={13} className="text-teal-600 dark:text-cyan-400 stroke-[3]" />
                        <span className="text-teal-800 dark:text-cyan-300">{locale === "vi" ? "Đã sao chép mã!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="opacity-70 group-hover:opacity-100" />
                        <span>{locale === "vi" ? "Nhấp để sao chép nhanh" : "Click to copy code"}</span>
                      </>
                    )}
                  </div>

                  {/* Segmented Jade-Cyan Digit Pods */}
                  <div className="relative z-10 my-2 flex items-center justify-center gap-3 sm:gap-4 font-mono select-all">
                    {/* First Half Group */}
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border-2 border-teal-400/40 bg-white/95 px-3.5 py-2.5 sm:px-5 sm:py-3.5 shadow-[0_8px_24px_rgba(20,184,166,0.15)] backdrop-blur-md transition-all group-hover:border-teal-400/70 group-hover:bg-white dark:border-teal-400/35 dark:bg-white/[0.08] dark:group-hover:border-cyan-400/60 dark:group-hover:bg-white/[0.12]">
                      {otp.slice(0, Math.ceil(otp.length / 2)).split("").map((digit, idx) => (
                        <span
                          key={idx}
                          className="text-4xl sm:text-5xl lg:text-6xl font-black text-teal-950 dark:text-cyan-300 drop-shadow-[0_2px_12px_rgba(20,184,166,0.25)] dark:drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>

                    {/* Cyan Glowing Pulse Separator Dot */}
                    <span className="text-2xl sm:text-3xl font-black text-teal-500 dark:text-cyan-400 select-none animate-pulse">
                      ·
                    </span>

                    {/* Second Half Group */}
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border-2 border-teal-400/40 bg-white/95 px-3.5 py-2.5 sm:px-5 sm:py-3.5 shadow-[0_8px_24px_rgba(20,184,166,0.15)] backdrop-blur-md transition-all group-hover:border-teal-400/70 group-hover:bg-white dark:border-teal-400/35 dark:bg-white/[0.08] dark:group-hover:border-cyan-400/60 dark:group-hover:bg-white/[0.12]">
                      {otp.slice(Math.ceil(otp.length / 2)).split("").map((digit, idx) => (
                        <span
                          key={idx}
                          className="text-4xl sm:text-5xl lg:text-6xl font-black text-teal-950 dark:text-cyan-300 drop-shadow-[0_2px_12px_rgba(20,184,166,0.25)] dark:drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dual-Gradient Emerald-to-Cyan Progress Bar */}
                  <div className="relative z-10 mx-auto mt-4 h-2.5 max-w-xs overflow-hidden rounded-full bg-teal-200/80 ring-1 ring-teal-500/30 dark:bg-teal-950/90">
                    <div
                      className={`h-full origin-left transition-all duration-500 rounded-full ${
                        remaining <= 5
                          ? "bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.9)]"
                          : remaining <= 10
                            ? "bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.8)]"
                            : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_16px_rgba(20,184,166,0.8)]"
                      }`}
                      style={{ transform: `scaleX(${progress / 100})` }}
                    />
                  </div>

                  {lastUpdated ? (
                    <p className="relative z-10 mt-3 text-[11px] text-teal-800/70 dark:text-cyan-200/70 font-medium">
                      {t.twoFactor.updated}{" "}
                      {new Date(lastUpdated).toLocaleTimeString(locale)}
                    </p>
                  ) : null}
                </div>

                {/* Metadata & Account Credentials Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 block">
                    {t.twoFactor.metadata}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Issuer */}
                    <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/60 dark:text-brand-200/60 flex items-center gap-1">
                        <Building2 size={11} className="text-brand-600 dark:text-brand-400" />
                        <span>{t.twoFactor.issuer}</span>
                      </span>
                      <strong className="truncate font-bold text-brand-950 dark:text-brand-50 block">
                        {config.issuer ?? "—"}
                      </strong>
                    </div>

                    {/* Account */}
                    <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/60 dark:text-brand-200/60 flex items-center gap-1">
                        <User size={11} className="text-brand-600 dark:text-brand-400" />
                        <span>{t.twoFactor.account}</span>
                      </span>
                      <strong className="truncate font-bold text-brand-950 dark:text-brand-50 block">
                        {config.account ?? "—"}
                      </strong>
                    </div>

                    {/* Algorithm */}
                    <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/60 dark:text-brand-200/60 flex items-center gap-1">
                        <ShieldCheck size={11} className="text-brand-600 dark:text-brand-400" />
                        <span>{t.twoFactor.algorithm}</span>
                      </span>
                      <strong className="font-bold text-brand-950 dark:text-brand-50 block font-mono">
                        {config.algorithm}
                      </strong>
                    </div>

                    {/* Digits */}
                    <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/60 dark:text-brand-200/60 flex items-center gap-1">
                        <Hash size={11} className="text-brand-600 dark:text-brand-400" />
                        <span>{t.twoFactor.digits}</span>
                      </span>
                      <strong className="font-bold text-brand-950 dark:text-brand-50 block">
                        <span className="font-mono font-black">{config.digits}</span> {locale === "vi" ? "chữ số" : "digits"}
                      </strong>
                    </div>

                    {/* Period */}
                    <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-0.5 col-span-2 sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/60 dark:text-brand-200/60 flex items-center gap-1">
                        <Clock size={11} className="text-brand-600 dark:text-brand-400" />
                        <span>{t.twoFactor.period}</span>
                      </span>
                      <strong className="font-bold text-brand-950 dark:text-brand-50 block">
                        <span className="font-mono font-black">{config.period}</span> {t.twoFactor.seconds}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <KeyRound size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {locale === "vi"
                      ? "Đang chờ Secret hoặc Quét mã QR"
                      : "Waiting for Secret or QR scan"}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Nhập mã Base32 secret hoặc quét QR để sinh mã OTP thời gian thực."
                      : "Enter Base32 secret or scan QR code to generate live OTP."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {config && otp ? (
              <button
                type="button"
                onClick={() => copyToClipboard(otp, "otp-copy")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                {copiedField === "otp-copy" ? (
                  <Check size={16} className="stroke-[2.5]" />
                ) : (
                  <Copy size={16} className="stroke-[2.5]" />
                )}
                <span>{common.copy} {t.twoFactor.currentCode}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
