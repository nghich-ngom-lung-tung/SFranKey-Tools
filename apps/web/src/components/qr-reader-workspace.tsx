"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { classifyQrValue, type QrScanKind, type QrScanResult } from "@sfrankey/tool-core/qr";
import { getDictionary } from "@sfrankey/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@sfrankey/ui";
import { QrScannerSurface, type ScannerErrorCode } from "@/components/qr-scanner-surface";
import { useToast } from "./toast-provider";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Contact,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  Globe,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  QrCode,
  RotateCcw,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";

type ParsedWifi = {
  ssid: string;
  password?: string;
  security: string;
  hidden: boolean;
};

type ParsedVcard = {
  fullName: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
};

type ParsedEmail = {
  address: string;
  subject?: string;
  body?: string;
};

type ParsedSms = {
  phone: string;
  message?: string;
};

type ParsedOtpauth = {
  type: string;
  label: string;
  secret: string;
  issuer?: string;
};

function parseWifi(raw: string): ParsedWifi | null {
  if (!raw.toUpperCase().startsWith("WIFI:")) return null;
  const body = raw.slice(5);
  const getField = (prefix: string) => {
    const match = body.match(new RegExp(`(?:^|;)${prefix}:([^;]*)`));
    return match ? match[1].replace(/\\([\\;,:\"])/g, "$1") : undefined;
  };
  const ssid = getField("S") ?? "";
  const password = getField("P");
  const security = getField("T") ?? "WPA";
  const hidden = getField("H") === "true";
  return { ssid, password, security, hidden };
}

function parseVcard(raw: string): ParsedVcard | null {
  if (!raw.toUpperCase().includes("BEGIN:VCARD")) return null;
  const lines = raw.split(/\r?\n/);
  let fullName = "";
  let organization: string | undefined;
  let title: string | undefined;
  let phone: string | undefined;
  let email: string | undefined;
  let url: string | undefined;

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).toUpperCase();
    const value = line.slice(colonIdx + 1).replace(/\\n/g, "\n").replace(/\\([,;\\])/g, "$1").trim();

    if (key === "FN" || key.startsWith("FN;")) fullName = value;
    else if (key === "ORG" || key.startsWith("ORG;")) organization = value;
    else if (key === "TITLE" || key.startsWith("TITLE;")) title = value;
    else if (key === "TEL" || key.startsWith("TEL;")) phone = value;
    else if (key === "EMAIL" || key.startsWith("EMAIL;")) email = value;
    else if (key === "URL" || key.startsWith("URL;")) url = value;
  }

  return { fullName: fullName || "Liên hệ", organization, title, phone, email, url };
}

function parseEmail(raw: string): ParsedEmail | null {
  if (!raw.toLowerCase().startsWith("mailto:")) return null;
  try {
    const url = new URL(raw);
    const address = url.pathname;
    const subject = url.searchParams.get("subject") ?? undefined;
    const body = url.searchParams.get("body") ?? undefined;
    return { address, subject, body };
  } catch {
    const withoutMailto = raw.slice(7);
    const [address, query] = withoutMailto.split("?");
    const params = new URLSearchParams(query || "");
    return {
      address: address || "",
      subject: params.get("subject") ?? undefined,
      body: params.get("body") ?? undefined,
    };
  }
}

function parseSms(raw: string): ParsedSms | null {
  const lower = raw.toLowerCase();
  if (lower.startsWith("smsto:") || lower.startsWith("sms:")) {
    const withoutPrefix = raw.replace(/^(smsto|sms):/i, "");
    const [phone, message] = withoutPrefix.split(":");
    return { phone: phone || "", message };
  }
  return null;
}

function parseOtpauth(raw: string): ParsedOtpauth | null {
  if (!raw.toLowerCase().startsWith("otpauth://")) return null;
  try {
    const url = new URL(raw);
    const type = url.host; // totp or hotp
    const label = decodeURIComponent(url.pathname.replace(/^\//, ""));
    const secret = url.searchParams.get("secret") ?? "";
    const issuer = url.searchParams.get("issuer") ?? undefined;
    return { type, label, secret, issuer };
  } catch {
    return null;
  }
}

export function QrReaderWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).qrSuite.reader;
  const shared = getDictionary(locale).qrSuite.shared;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [result, setResult] = React.useState<QrScanResult | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  const [revealPass, setRevealPass] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleDecoded = React.useCallback((value: string) => {
    setResult(classifyQrValue(value));
    toast({
      title: locale === "vi" ? "Đã quét và giải mã thành công!" : "QR Code scanned and decoded successfully!",
      variant: "success",
    });
  }, [locale, toast]);

  const labels = React.useMemo(
    () => ({
      drop: t.drop,
      browse: t.browse,
      active: t.processing,
      remove: t.reset,
      camera: t.camera,
      stopCamera: t.stopCamera,
      pasteHint: t.pasteHint,
      processing: t.processing,
      scanning: t.scanning,
      errors: {
        type: t.errors.imageType,
        size: t.errors.imageTooLarge,
        noQr: t.errors.noQr,
        camera: t.errors.camera,
        invalid: t.errors.invalid,
      },
    }),
    [t],
  );

  const reset = () => {
    setResult(null);
    setDialogOpen(false);
    setRevealPass(false);
    setResetKey((key) => key + 1);
  };

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

  const kindLabel = result
    ? {
        url: shared.url,
        email: shared.email,
        phone: shared.phone,
        sms: shared.sms,
        wifi: shared.wifi,
        vcard: shared.vcard,
        otpauth: shared.otpauth,
        text: shared.text,
      }[result.kind]
    : "";

  const kindIcon = result
    ? {
        url: Globe,
        wifi: Wifi,
        vcard: Contact,
        email: Mail,
        phone: Phone,
        sms: MessageSquare,
        otpauth: KeyRound,
        text: FileText,
      }[result.kind]
    : QrCode;

  const KindIconComponent = kindIcon;

  // Parsed sub-objects
  const parsedWifi = result?.kind === "wifi" ? parseWifi(result.value) : null;
  const parsedVcard = result?.kind === "vcard" ? parseVcard(result.value) : null;
  const parsedEmail = result?.kind === "email" ? parseEmail(result.value) : null;
  const parsedSms = result?.kind === "sms" ? parseSms(result.value) : null;
  const parsedOtp = result?.kind === "otpauth" ? parseOtpauth(result.value) : null;

  return (
    <div className="w-full space-y-6">
      {/* Symmetrical 2-Column Master Layout */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* Left Column: Scanner Input Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <Scan size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Nguồn quét mã QR" : "Scanner Input"}</span>
              </div>
              {result ? (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700/75 hover:text-brand-950 dark:text-brand-300/75 dark:hover:text-brand-50 transition"
                >
                  <RotateCcw size={13} />
                  <span>{common.reset}</span>
                </button>
              ) : null}
            </div>

            {/* Scanner Component Surface */}
            <QrScannerSurface
              labels={labels}
              onDecoded={handleDecoded}
              resetKey={resetKey}
            />
          </div>

          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.privacy}
          </p>
        </div>

        {/* Right Column: Smart Decoded Studio Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Top Header inside Stage */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.result}</span>
            </div>
            {result ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <KindIconComponent size={13} className="text-brand-600 dark:text-brand-300" />
                <span>{kindLabel}</span>
              </span>
            ) : null}
          </div>

          {/* Center Main Stage */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
            {result ? (
              <div className="w-full space-y-4">
                {/* 1. Specialized View for URL */}
                {result.kind === "url" ? (
                  <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                          <Globe size={16} />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                            {locale === "vi" ? "Địa chỉ Web" : "Web URL"}
                          </p>
                          <strong className="text-sm text-brand-950 dark:text-brand-50">
                            {result.safeHttpUrl ? new URL(result.safeHttpUrl).host : "URL"}
                          </strong>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                        <Lock size={11} />
                        <span>HTTPS</span>
                      </span>
                    </div>

                    <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-2.5 font-mono text-xs text-brand-950 break-all select-all dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-50">
                      {result.value}
                    </div>

                    {result.safeHttpUrl ? (
                      <button
                        type="button"
                        onClick={() => setDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                      >
                        <ExternalLink size={14} className="stroke-[2.5]" />
                        <span>{t.open}</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* 2. Specialized View for Wi-Fi */}
                {result.kind === "wifi" && parsedWifi ? (
                  <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                          <Wifi size={16} />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                            {locale === "vi" ? "Tên Wi-Fi (SSID)" : "Wi-Fi SSID"}
                          </p>
                          <strong className="text-sm text-brand-950 dark:text-brand-50">
                            {parsedWifi.ssid || "Wi-Fi"}
                          </strong>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {parsedWifi.security || "WPA2"}
                      </span>
                    </div>

                    {parsedWifi.password ? (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-brand-800/70 dark:text-brand-200/70">
                          {locale === "vi" ? "Mật khẩu Wi-Fi:" : "Password:"}
                        </span>
                        <div className="flex items-center justify-between rounded-xl border border-brand-200/80 bg-brand-50/50 p-2.5 dark:border-brand-800 dark:bg-brand-900/40">
                          <span className="font-mono text-xs font-bold text-brand-950 dark:text-brand-50">
                            {revealPass ? parsedWifi.password : "••••••••••••"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRevealPass((v) => !v)}
                              className="rounded-lg p-1 text-brand-700 hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-50"
                            >
                              {revealPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(parsedWifi.password || "", "wifi-pass")}
                              className="rounded-lg p-1 text-brand-700 hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-50"
                            >
                              {copiedField === "wifi-pass" ? (
                                <Check size={15} className="text-emerald-600" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* 3. Specialized View for vCard */}
                {result.kind === "vcard" && parsedVcard ? (
                  <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/15">
                      <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                        <Contact size={16} />
                      </span>
                      <div>
                        <strong className="text-sm text-brand-950 dark:text-brand-50">
                          {parsedVcard.fullName}
                        </strong>
                        {parsedVcard.title || parsedVcard.organization ? (
                          <p className="text-xs text-brand-800/70 dark:text-brand-200/70">
                            {[parsedVcard.title, parsedVcard.organization].filter(Boolean).join(" - ")}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {parsedVcard.phone ? (
                        <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2 dark:border-brand-800 dark:bg-brand-900/40 flex items-center justify-between">
                          <span className="font-mono text-brand-950 dark:text-brand-50">{parsedVcard.phone}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(parsedVcard.phone || "", "vcard-phone")}
                            className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                          >
                            {copiedField === "vcard-phone" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : null}

                      {parsedVcard.email ? (
                        <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2 dark:border-brand-800 dark:bg-brand-900/40 flex items-center justify-between">
                          <span className="truncate font-mono text-brand-950 dark:text-brand-50">{parsedVcard.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(parsedVcard.email || "", "vcard-email")}
                            className="text-brand-700 hover:text-brand-950 dark:text-brand-300"
                          >
                            {copiedField === "vcard-email" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* 4. Specialized View for OTPAUTH (2FA) */}
                {result.kind === "otpauth" && parsedOtp ? (
                  <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                        <KeyRound size={16} />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                          {locale === "vi" ? "Mã xác thực 2FA (TOTP)" : "2FA Authenticator Key"}
                        </p>
                        <strong className="text-sm text-brand-950 dark:text-brand-50">
                          {[parsedOtp.issuer, parsedOtp.label].filter(Boolean).join(" - ") || "2FA Key"}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-brand-800/70 dark:text-brand-200/70">
                        {locale === "vi" ? "Khóa bí mật (Secret Key):" : "Secret Key:"}
                      </span>
                      <div className="flex items-center justify-between rounded-xl border border-brand-200/80 bg-brand-50/50 p-2.5 dark:border-brand-800 dark:bg-brand-900/40">
                        <span className="font-mono text-xs font-bold text-brand-950 dark:text-brand-50 break-all select-all">
                          {parsedOtp.secret}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(parsedOtp.secret, "otp-secret")}
                          className="rounded-lg p-1 text-brand-700 hover:text-brand-950 dark:text-brand-300"
                        >
                          {copiedField === "otp-secret" ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Raw Code View Box */}
                <div className="rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1.5">
                      <FileCode size={13} className="text-brand-600 dark:text-brand-400" />
                      <span>{locale === "vi" ? "Dữ liệu mã QR đã đọc" : "Decoded Payload"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.value, "raw-text")}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-950 dark:text-brand-300 flex items-center gap-1"
                    >
                      {copiedField === "raw-text" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{common.copy}</span>
                    </button>
                  </div>
                  <textarea
                    value={result.value}
                    readOnly
                    rows={4}
                    className="w-full rounded-xl border border-brand-200/80 bg-brand-50/40 p-2.5 font-mono text-xs text-brand-950 outline-none select-all dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-50"
                  />
                </div>
              </div>
            ) : (
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <QrCode size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "Đang chờ quét mã QR" : "Waiting for QR Code"}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {t.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Toolbar & Metadata */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {result ? (
              <>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.value, "bottom-copy")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                >
                  {copiedField === "bottom-copy" ? (
                    <Check size={16} className="stroke-[2.5]" />
                  ) : (
                    <Copy size={16} className="stroke-[2.5]" />
                  )}
                  <span>{shared.copy}</span>
                </button>

                <div className="flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60 pt-1">
                  <span>
                    {locale === "vi" ? "Độ dài:" : "Length:"}{" "}
                    <strong className="text-brand-950 dark:text-brand-50">
                      {result.value.length} {locale === "vi" ? "ký tự" : "chars"}
                    </strong>
                  </span>
                  <span>
                    {locale === "vi" ? "Dung lượng:" : "Bytes:"}{" "}
                    <strong className="text-brand-950 dark:text-brand-50">
                      {new TextEncoder().encode(result.value).byteLength} bytes
                    </strong>
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* URL Safety Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent closeLabel={t.cancel}>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-brand-600 dark:text-brand-400" />
            <span>{t.openDialogTitle}</span>
          </DialogTitle>
          <DialogDescription>{t.openDialogDescription}</DialogDescription>
          {result?.safeHttpUrl ? (
            <div className="mt-4 grid gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-50/60 p-4 text-xs dark:border-emerald-500/20 dark:bg-emerald-950/40">
              <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {new URL(result.safeHttpUrl).protocol}
              </span>
              <strong className="break-all text-sm font-bold text-brand-950 dark:text-brand-50">
                {new URL(result.safeHttpUrl).host}
              </strong>
              <span className="break-all font-mono text-brand-800/70 dark:text-brand-200/70">
                {result.safeHttpUrl}
              </span>
            </div>
          ) : null}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border border-brand-200/80 bg-white px-4 py-2 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (result?.safeHttpUrl) {
                  window.open(result.safeHttpUrl, "_blank", "noopener,noreferrer");
                }
                setDialogOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-black text-brand-950 shadow-md shadow-brand-500/25 hover:bg-brand-400 transition"
            >
              <ExternalLink size={14} className="stroke-[2.5]" />
              <span>{t.openNewTab}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
