"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import {
  decodeJwt,
  type DecodedJwtResult,
  type JwtDecodeErrorCode,
  type JwtWarningCode,
} from "@sfrankey/tool-core/jwt";
import { useToast } from "./toast-provider";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileCode,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Zap,
} from "lucide-react";

function errorText(locale: Locale, code: JwtDecodeErrorCode) {
  const errors = getDictionary(locale).developerSuite.jwt.errors;
  return errors[code] ?? errors.fallback;
}

function claimDate(value: DecodedJwtResult["expiresAt"], locale: Locale) {
  if (!value) return null;
  const formatted = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "UTC",
    },
  ).format(new Date(value.unixMs));
  const relative = new Intl.RelativeTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { numeric: "auto" },
  ).format(Math.round((value.unixMs - Date.now()) / 86_400_000), "day");
  return `${formatted} · ${value.iso} · ${relative}`;
}

export function JwtDecoderWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [token, setToken] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [decoded, setDecoded] = React.useState<DecodedJwtResult | null>(null);
  const [error, setError] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

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
          setToken(text.trim());
          setDecoded(null);
          setError("");
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

  const handleLoadSample = () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa(
      JSON.stringify({
        sub: "1234567890",
        name: "SFranKey User",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24,
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const sampleToken = `${header}.${payload}.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ`;
    setToken(sampleToken);
    setDecoded(null);
    setError("");
  };

  const decode = () => {
    try {
      if (!token.trim()) return;
      setDecoded(decodeJwt(token));
      setError("");
    } catch (caught) {
      setDecoded(null);
      setError(
        errorText(
          locale,
          caught && typeof caught === "object" && "code" in caught
            ? (String(caught.code) as JwtDecodeErrorCode)
            : "INVALID_UTF8",
        ),
      );
    }
  };

  const reset = () => {
    setToken("");
    setVisible(false);
    setDecoded(null);
    setError("");
  };

  const headerText = decoded ? JSON.stringify(decoded.header, null, 2) : "";
  const payloadText = decoded ? JSON.stringify(decoded.payload, null, 2) : "";
  const decodedText = decoded
    ? JSON.stringify(
        {
          header: decoded.header,
          payload: decoded.payload,
          signature: decoded.signature,
        },
        null,
        2,
      )
    : "";

  const warningText =
    decoded?.warnings
      .map((warning) => t.jwt.warningLabels[warning as JwtWarningCode])
      .filter(Boolean) ?? [];

  return (
    <div className="w-full space-y-6">
      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Input Token Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <KeyRound size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Nhập mã JWT Token" : "JWT Token Input"}</span>
              </div>
            </div>

            {/* Input Token Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jwt-token"
                  className="text-xs font-bold text-brand-950 dark:text-brand-50"
                >
                  {t.jwt.token}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                  >
                    {visible ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{visible ? t.jwt.hide : t.jwt.show}</span>
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
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                  >
                    <Sparkles size={12} />
                    <span>{locale === "vi" ? "Mẫu" : "Sample"}</span>
                  </button>
                  {token ? (
                    <button
                      type="button"
                      onClick={() => setToken("")}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 size={12} />
                      <span>{common.clear}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <textarea
                id="jwt-token"
                value={token}
                onChange={(event) => {
                  setToken(event.target.value);
                  setDecoded(null);
                  setError("");
                }}
                rows={8}
                placeholder={t.jwt.placeholder}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                aria-label={t.jwt.token}
                className={`w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-xs text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50 ${
                  !visible ? "filter blur-[3px] focus:filter-none transition-all duration-200" : ""
                }`}
              />

              <div className="flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60">
                <span>
                  {token.length.toLocaleString(locale)} {locale === "vi" ? "ký tự" : "characters"}
                </span>
                <span>
                  {token.split(".").length === 3
                    ? locale === "vi"
                      ? "Cấu trúc: 3 phần (H.P.S)"
                      : "Structure: 3 parts (H.P.S)"
                    : locale === "vi"
                      ? "Cấu trúc chưa hợp lệ"
                      : "Invalid JWT format"}
                </span>
              </div>
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={decode}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>{t.jwt.decode}</span>
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
            {t.shared.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Token Inspector & Claims Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{locale === "vi" ? "Phân tích JWT Inspector" : "JWT Token Inspector"}</span>
            </div>

            {decoded ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <CheckCircle2 size={13} className="text-brand-600 dark:text-brand-300" />
                <span>{String(decoded.header?.alg ?? "JWT")}</span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 w-full">
            {decoded ? (
              <div className="w-full space-y-3.5">
                {/* Security Warnings if any */}
                {warningText.length ? (
                  <div className="rounded-2xl border border-amber-400/50 bg-amber-50/80 p-3.5 text-xs text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
                      <span>{t.jwt.warning}</span>
                    </p>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[11px] opacity-90">
                      {warningText.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* 3-Section Inspector: Header, Payload, Signature */}
                <div className="space-y-2.5">
                  {/* Header Card */}
                  <div className="rounded-2xl border border-rose-500/25 bg-white/95 p-3.5 shadow-2xs dark:border-rose-500/20 dark:bg-[#07241a]/90 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-rose-500/15 pb-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        {t.jwt.header}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(headerText, "header")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "header" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <pre className="max-h-28 overflow-auto font-mono text-xs text-rose-950 select-all dark:text-rose-100 p-0.5">
                      {headerText}
                    </pre>
                  </div>

                  {/* Payload Card */}
                  <div className="rounded-2xl border border-purple-500/25 bg-white/95 p-3.5 shadow-2xs dark:border-purple-500/20 dark:bg-[#07241a]/90 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-purple-500/15 pb-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        {t.jwt.payload}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(payloadText, "payload")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "payload" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <pre className="max-h-40 overflow-auto font-mono text-xs text-purple-950 select-all dark:text-purple-100 p-0.5">
                      {payloadText}
                    </pre>
                  </div>

                  {/* Signature Card */}
                  <div className="rounded-2xl border border-blue-500/25 bg-white/95 p-3 shadow-2xs dark:border-blue-500/20 dark:bg-[#07241a]/90 space-y-1">
                    <div className="flex items-center justify-between border-b border-blue-500/15 pb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        {t.jwt.signature}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(decoded.signature, "signature")}
                        className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                      >
                        {copiedField === "signature" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <p className="break-all font-mono text-xs text-blue-950 dark:text-blue-100">
                      {decoded.signature || "—"}
                    </p>
                  </div>
                </div>

                {/* Claims Verification Grid */}
                <div className="rounded-2xl border border-emerald-500/20 bg-white/80 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 block">
                    {t.jwt.claims}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        ["exp", decoded.expiresAt],
                        ["nbf", decoded.notBefore],
                        ["iat", decoded.issuedAt],
                      ] as const
                    ).map(([name, value]) => (
                      <div
                        key={name}
                        className="rounded-xl border border-brand-200/70 bg-white p-2.5 dark:border-brand-800 dark:bg-[#07241a]/90 text-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-bold text-brand-950 dark:text-brand-50">
                            {name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              decoded.warnings.includes(
                                name === "exp"
                                  ? "EXPIRED"
                                  : name === "nbf"
                                    ? "NOT_ACTIVE"
                                    : "INVALID_IAT_CLAIM",
                              )
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {value
                              ? name === "exp" &&
                                decoded.warnings.includes("EXPIRED")
                                ? t.jwt.expired
                                : name === "nbf" &&
                                    decoded.warnings.includes("NOT_ACTIVE")
                                  ? t.jwt.notActive
                                  : t.jwt.valid
                              : "—"}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-tight text-brand-700/70 dark:text-brand-300/70">
                          {claimDate(value, locale) ?? "—"}
                        </p>
                      </div>
                    ))}
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
                    {t.jwt.empty}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Dán chuỗi JWT token để phân tích Header, Payload và Claims."
                      : "Paste a JWT token string to inspect Header, Payload and Claims."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {decoded ? (
              <button
                type="button"
                onClick={() => copyToClipboard(decodedText, "all-decoded")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
              >
                {copiedField === "all-decoded" ? (
                  <Check size={16} className="stroke-[2.5]" />
                ) : (
                  <Copy size={16} className="stroke-[2.5]" />
                )}
                <span>{t.jwt.copyDecoded}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
