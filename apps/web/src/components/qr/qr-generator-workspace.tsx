"use client";

import * as React from "react";
import {
  buildQrPayload,
  validateQrColors,
  type QrErrorCode,
  type QrPayload,
  type QrValidationError,
} from "@sfrankey/tool-core/qr";
import { createQrDataUrl, createQrSvg } from "@sfrankey/tool-core/qr-render";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { downloadBlob } from "@/lib/download";
import { useToast } from "@/components/providers/toast-provider";
import {
  AlertTriangle,
  Check,
  Contact,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Palette,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wifi,
} from "lucide-react";

type Kind = QrPayload["kind"];
type LogoChoice = "none" | "sfrankey" | "custom";
type GeneratedRender = {
  foreground: string;
  background: string;
  errorCorrection: "L" | "M" | "Q" | "H";
  logoUrl?: string;
};
const MAX_BYTES = 2_953;

const COLOR_PRESETS = [
  { name: "SFranKey Brand", fg: "#063b2b", bg: "#ffffff" },
  { name: "Classic Dark", fg: "#18181b", bg: "#ffffff" },
  { name: "Cyber Neon", fg: "#10b981", bg: "#06241a" },
  { name: "Deep Ocean", fg: "#0c4a6e", bg: "#f0f9ff" },
  { name: "Royal Indigo", fg: "#312e81", bg: "#eef2ff" },
];

async function getLogoBase64(url: string): Promise<string> {
  if (!url || url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export function QrGeneratorWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).qrSuite.generator;
  const shared = getDictionary(locale).qrSuite.shared;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [kind, setKind] = React.useState<Kind>("url");
  const [text, setText] = React.useState("SFranKey Tools");
  const [url, setUrl] = React.useState("https://sfrankey.bond");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [ssid, setSsid] = React.useState("");
  const [security, setSecurity] = React.useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiPassword, setWifiPassword] = React.useState("");
  const [revealWifi, setRevealWifi] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [vcardEmail, setVcardEmail] = React.useState("");
  const [vcardPhone, setVcardPhone] = React.useState("");
  const [vcardUrl, setVcardUrl] = React.useState("");
  const [size, setSize] = React.useState<256 | 512 | 1024>(512);
  const [errorCorrection, setErrorCorrection] = React.useState<"L" | "M" | "Q" | "H">("H");
  const [foreground, setForeground] = React.useState("#063b2b");
  const [background, setBackground] = React.useState("#ffffff");
  const [logoChoice, setLogoChoice] = React.useState<LogoChoice>("sfrankey");
  const [customLogoUrl, setCustomLogoUrl] = React.useState("");
  const [dataUrl, setDataUrl] = React.useState("");
  const [payload, setPayload] = React.useState("");
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [generatedSignature, setGeneratedSignature] = React.useState("");
  const [generatedRender, setGeneratedRender] = React.useState<GeneratedRender | null>(null);

  const generationRef = React.useRef(0);

  const contentTypes: Array<{
    id: Kind;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: "url", label: shared.url, icon: Globe },
    { id: "wifi", label: shared.wifi, icon: Wifi },
    { id: "text", label: shared.text, icon: FileText },
    { id: "vcard", label: shared.vcard, icon: Contact },
    { id: "email", label: shared.email, icon: Mail },
    { id: "phone", label: shared.phone, icon: Phone },
    { id: "sms", label: shared.sms, icon: MessageSquare },
  ];

  const makePayload = React.useCallback((): QrPayload => {
    if (kind === "text") return { kind, text };
    if (kind === "url") return { kind, url };
    if (kind === "email") return { kind, email, subject, body };
    if (kind === "phone") return { kind, phone };
    if (kind === "sms") return { kind, phone, message };
    if (kind === "wifi") return { kind, ssid, security, password: wifiPassword, hidden };
    return {
      kind: "vcard",
      fullName,
      organization,
      title: jobTitle,
      phone: vcardPhone,
      email: vcardEmail,
      url: vcardUrl,
    };
  }, [
    body,
    email,
    fullName,
    hidden,
    jobTitle,
    kind,
    message,
    organization,
    phone,
    security,
    ssid,
    subject,
    text,
    url,
    vcardEmail,
    vcardPhone,
    vcardUrl,
    wifiPassword,
  ]);

  const activeLogoUrl =
    logoChoice === "sfrankey"
      ? "/logo.jpg"
      : logoChoice === "custom"
        ? customLogoUrl
        : undefined;

  const formSignature = React.useMemo(
    () =>
      JSON.stringify({
        payload: makePayload(),
        size,
        errorCorrection,
        foreground,
        background,
        logoChoice,
        customLogoUrl,
      }),
    [
      background,
      customLogoUrl,
      errorCorrection,
      foreground,
      logoChoice,
      makePayload,
      size,
    ],
  );

  const generate = React.useCallback(async () => {
    const generationId = ++generationRef.current;
    try {
      const colors = validateQrColors(foreground, background);
      if (!colors.usable) throw new Error("LOW_CONTRAST");
      const nextPayload = makePayload();
      const nextValue = buildQrPayload(nextPayload);
      if (new TextEncoder().encode(nextValue).byteLength > MAX_BYTES) {
        throw new Error("PAYLOAD_TOO_LARGE");
      }
      const effectiveCorrection = activeLogoUrl ? "H" : errorCorrection;
      const nextDataUrl = await createQrDataUrl(nextValue, {
        width: size,
        errorCorrectionLevel: effectiveCorrection,
        margin: 2,
        color: { dark: foreground, light: background },
        logoUrl: activeLogoUrl,
      });
      if (generationId !== generationRef.current) return;
      setPayload(nextValue);
      setDataUrl(nextDataUrl);
      setGeneratedSignature(formSignature);
      setGeneratedRender({
        foreground,
        background,
        errorCorrection: effectiveCorrection,
        logoUrl: activeLogoUrl,
      });
      setError(colors.warning ? "WARNING_CONTRAST" : "");
    } catch (caught) {
      if (generationId !== generationRef.current) return;
      const code = caught instanceof Error ? caught.message : "INVALID";
      const qrError = caught as Partial<QrValidationError>;
      const validationCode = (qrError.code ?? code) as QrErrorCode;
      const validationMessages: Partial<Record<QrErrorCode, string>> = {
        EMPTY_FIELD: t.errors.required,
        INVALID_URL: t.errors.url,
        INVALID_EMAIL: t.errors.email,
        INVALID_PHONE: t.errors.phone,
        MISSING_PASSWORD: t.errors.password,
        INVALID_COLOR: t.errors.invalid,
      };
      setError(
        validationCode === "PAYLOAD_TOO_LARGE"
          ? t.payloadTooLarge
          : validationCode === "LOW_CONTRAST"
            ? t.contrastError
            : (validationMessages[validationCode] ?? t.errors.invalid),
      );
    }
  }, [
    activeLogoUrl,
    background,
    errorCorrection,
    foreground,
    formSignature,
    makePayload,
    size,
    t,
  ]);

  // Live Auto-Generation on change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void generate();
    }, 80);
    return () => clearTimeout(timer);
  }, [generate]);

  const copyPayloadToClipboard = async () => {
    if (!payload) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(payload);
      }
      setCopied(true);
      toast({
        title: common.copied,
        variant: "success",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    generationRef.current += 1;
    setKind("url");
    setText("SFranKey Tools");
    setUrl("https://sfrankey.bond");
    setEmail("");
    setSubject("");
    setBody("");
    setPhone("");
    setMessage("");
    setSsid("");
    setSecurity("WPA");
    setWifiPassword("");
    setHidden(false);
    setFullName("");
    setOrganization("");
    setJobTitle("");
    setVcardEmail("");
    setVcardPhone("");
    setVcardUrl("");
    setSize(512);
    setErrorCorrection("H");
    setForeground("#063b2b");
    setBackground("#ffffff");
    setLogoChoice("sfrankey");
    setCustomLogoUrl("");
    setError("");
  };

  const errorMessage = error === "WARNING_CONTRAST" ? t.contrastWarning : error;

  return (
    <div className="w-full space-y-6">
      {/* 1. Category Icon Tabs Switcher (Centered) */}
      <div className="flex items-center justify-center w-full">
        <div
          role="tablist"
          aria-label={t.title}
          className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/25 bg-emerald-100/60 p-1.5 shadow-2xs backdrop-blur-md dark:border-emerald-500/25 dark:bg-emerald-950/60"
        >
          {contentTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = kind === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setKind(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isSelected
                    ? "bg-white text-brand-950 shadow-md shadow-emerald-900/10 ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50"
                    : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                }`}
              >
                <Icon size={16} className={isSelected ? "text-brand-600 dark:text-brand-300" : ""} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Symmetrical Studio Grid: Left Config Panel vs Right Preview Stage */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* Left Column: Unified Studio Config Card */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Section A: Content Inputs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75 flex items-center gap-2">
                  <FileText size={15} className="text-brand-600 dark:text-brand-400" />
                  <span>{locale === "vi" ? "Thông tin nội dung mã QR" : "Content Payload"}</span>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700/75 hover:text-brand-950 dark:text-brand-300/75 dark:hover:text-brand-50 transition"
                >
                  <RotateCcw size={13} />
                  <span>{common.reset}</span>
                </button>
              </div>

              {/* URL Input */}
              {kind === "url" ? (
                <div>
                  <label htmlFor="qr-url-input" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                    {t.urlLabel}
                  </label>
                  <input
                    id="qr-url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 text-sm font-medium text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                  />
                </div>
              ) : null}

              {/* Text Input */}
              {kind === "text" ? (
                <div>
                  <label htmlFor="qr-text-input" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                    {t.textLabel}
                  </label>
                  <textarea
                    id="qr-text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder={locale === "vi" ? "Nhập văn bản cần tạo mã QR..." : "Enter text to encode..."}
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 text-sm font-medium text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                  />
                </div>
              ) : null}

              {/* Wi-Fi Inputs */}
              {kind === "wifi" ? (
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="qr-wifi-ssid" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                      {t.ssidLabel}
                    </label>
                    <input
                      id="qr-wifi-ssid"
                      type="text"
                      value={ssid}
                      onChange={(e) => setSsid(e.target.value)}
                      placeholder="e.g. SFranKey_Coffee_5G"
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 text-sm font-medium text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-wifi-security" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                        {t.securityLabel}
                      </label>
                      <select
                        id="qr-wifi-security"
                        value={security}
                        onChange={(e) => setSecurity(e.target.value as typeof security)}
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 text-sm font-bold text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">{t.noPassword}</option>
                      </select>
                    </div>

                    {security !== "nopass" ? (
                      <div>
                        <label htmlFor="qr-wifi-pass" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                          {t.passwordLabel}
                        </label>
                        <div className="relative">
                          <input
                            id="qr-wifi-pass"
                            type={revealWifi ? "text" : "password"}
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 pr-10 text-sm font-medium text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                          />
                          <button
                            type="button"
                            onClick={() => setRevealWifi((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600/70 hover:text-brand-950 dark:text-brand-300/70 dark:hover:text-brand-50"
                          >
                            {revealWifi ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-800 dark:text-brand-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hidden}
                      onChange={(e) => setHidden(e.target.checked)}
                      className="size-4 rounded-md accent-brand-500"
                    />
                    <span>{t.hiddenLabel}</span>
                  </label>
                </div>
              ) : null}

              {/* vCard Inputs */}
              {kind === "vcard" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-vcard-name" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.fullNameLabel}
                      </label>
                      <input
                        id="qr-vcard-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Nguyen"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="qr-vcard-phone" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.vcardPhoneLabel}
                      </label>
                      <input
                        id="qr-vcard-phone"
                        type="tel"
                        value={vcardPhone}
                        onChange={(e) => setVcardPhone(e.target.value)}
                        placeholder="+84 901 234 567"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-vcard-email" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.vcardEmailLabel}
                      </label>
                      <input
                        id="qr-vcard-email"
                        type="email"
                        value={vcardEmail}
                        onChange={(e) => setVcardEmail(e.target.value)}
                        placeholder="contact@sfrankey.bond"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="qr-vcard-url" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.vcardUrlLabel}
                      </label>
                      <input
                        id="qr-vcard-url"
                        type="url"
                        value={vcardUrl}
                        onChange={(e) => setVcardUrl(e.target.value)}
                        placeholder="https://sfrankey.bond"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-vcard-org" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.organizationLabel}
                      </label>
                      <input
                        id="qr-vcard-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="SFranKey Tech"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="qr-vcard-title" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                        {t.jobTitleLabel}
                      </label>
                      <input
                        id="qr-vcard-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Security Engineer"
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Email Inputs */}
              {kind === "email" ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="qr-email-addr" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                      {t.emailLabel}
                    </label>
                    <input
                      id="qr-email-addr"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@sfrankey.bond"
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="qr-email-sub" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                      {t.subjectLabel}
                    </label>
                    <input
                      id="qr-email-sub"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Inquiry about SFranKey"
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="qr-email-body" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                      {t.bodyLabel}
                    </label>
                    <textarea
                      id="qr-email-body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={2}
                      placeholder="Hello SFranKey team..."
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>
                </div>
              ) : null}

              {/* Phone Input */}
              {kind === "phone" ? (
                <div>
                  <label htmlFor="qr-phone-input" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1.5">
                    {t.phoneLabel}
                  </label>
                  <input
                    id="qr-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84 901 234 567"
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                  />
                </div>
              ) : null}

              {/* SMS Inputs */}
              {kind === "sms" ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="qr-sms-phone-input" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                      {t.phoneLabel}
                    </label>
                    <input
                      id="qr-sms-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+84 901 234 567"
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="qr-sms-msg" className="block text-xs font-bold text-brand-900 dark:text-brand-100 mb-1">
                      {t.smsMessageLabel}
                    </label>
                    <textarea
                      id="qr-sms-msg"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      placeholder="Hello..."
                      className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3 text-sm font-medium text-brand-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-emerald-500/25 dark:bg-brand-900/60 dark:text-brand-50"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Section B: Center Logo */}
            <div className="border-t border-emerald-500/15 pt-4">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                  <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
                  <span>{locale === "vi" ? "Logo ở giữa mã QR" : "Center Logo in QR"}</span>
                </div>
                {logoChoice !== "none" ? (
                  <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-800 ring-1 ring-brand-500/25 dark:bg-brand-400/15 dark:text-brand-200">
                    {locale === "vi" ? "Sửa lỗi H (30%)" : "Correction H (30%)"}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setLogoChoice("none")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    logoChoice === "none"
                      ? "border-emerald-500 bg-brand-500/15 text-brand-950 shadow-2xs ring-1 ring-emerald-500/30 dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50 font-black"
                      : "border-brand-200/80 bg-white/70 text-brand-900/70 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/70"
                  }`}
                >
                  <span>{locale === "vi" ? "Không có logo" : "No logo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogoChoice("sfrankey");
                    setErrorCorrection("H");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    logoChoice === "sfrankey"
                      ? "border-emerald-500 bg-brand-500/15 text-brand-950 shadow-2xs ring-1 ring-emerald-500/30 dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50 font-black"
                      : "border-brand-200/80 bg-white/70 text-brand-900/70 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/70"
                  }`}
                >
                  <img
                    src="/logo.jpg"
                    alt="SFranKey Logo"
                    className="size-5 shrink-0 rounded-md object-cover ring-1 ring-emerald-500/30"
                  />
                  <span>SFranKey Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogoChoice("custom");
                    setErrorCorrection("H");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    logoChoice === "custom"
                      ? "border-emerald-500 bg-brand-500/15 text-brand-950 shadow-2xs ring-1 ring-emerald-500/30 dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50 font-black"
                      : "border-brand-200/80 bg-white/70 text-brand-900/70 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/70"
                  }`}
                >
                  <Upload size={14} className="text-brand-600 dark:text-brand-400" />
                  <span>{locale === "vi" ? "Logo tùy chỉnh" : "Custom logo"}</span>
                </button>
              </div>

              {logoChoice === "custom" ? (
                <div className="mt-2.5 flex items-center gap-3 pt-2.5 border-t border-emerald-500/15">
                  <input
                    id="qr-custom-logo-file"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const picked = e.target.files?.[0];
                      if (picked) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCustomLogoUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(picked);
                      }
                    }}
                    className="block w-full text-xs text-brand-900 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-950 hover:file:bg-brand-400 dark:text-brand-100"
                  />
                  {customLogoUrl ? (
                    <img
                      src={customLogoUrl}
                      alt="Custom logo thumbnail"
                      className="size-8 shrink-0 rounded-lg object-cover ring-1 ring-emerald-500/30 shadow-2xs"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Section C: Colors & Sizing */}
            <div className="border-t border-emerald-500/15 pt-4 space-y-3.5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75 mb-2 flex items-center gap-2">
                  <Palette size={14} className="text-brand-600 dark:text-brand-400" />
                  <span>{locale === "vi" ? "Bảng màu phối sẵn" : "Color Presets"}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isCurrent = foreground === preset.fg && background === preset.bg;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setForeground(preset.fg);
                          setBackground(preset.bg);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
                          isCurrent
                            ? "border-emerald-500 bg-brand-500/15 text-brand-950 ring-1 ring-emerald-500/30 shadow-2xs dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50"
                            : "border-brand-200/80 bg-white/70 text-brand-900/70 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/70"
                        }`}
                      >
                        <span
                          className="size-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: preset.fg }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qr-fg-picker" className="block text-[11px] font-bold text-brand-900 dark:text-brand-100 mb-1">
                    {t.foregroundLabel}
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-white/95 p-1 dark:border-emerald-500/25 dark:bg-brand-900/60">
                    <input
                      id="qr-fg-picker"
                      type="color"
                      value={foreground}
                      onChange={(e) => setForeground(e.target.value)}
                      className="size-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={foreground}
                      onChange={(e) => setForeground(e.target.value)}
                      className="w-full font-mono text-xs font-bold uppercase bg-transparent outline-none text-brand-950 dark:text-brand-50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="qr-bg-picker" className="block text-[11px] font-bold text-brand-900 dark:text-brand-100 mb-1">
                    {t.backgroundLabel}
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-white/95 p-1 dark:border-emerald-500/25 dark:bg-brand-900/60">
                    <input
                      id="qr-bg-picker"
                      type="color"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="size-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="w-full font-mono text-xs font-bold uppercase bg-transparent outline-none text-brand-950 dark:text-brand-50"
                    />
                  </div>
                </div>
              </div>

              {/* Size & Error Correction Segmented Rows */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <div>
                  <span className="block text-[11px] font-bold text-brand-900 dark:text-brand-100 mb-1">
                    {t.sizeLabel}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[256, 512, 1024].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s as typeof size)}
                        className={`rounded-lg py-1.5 font-mono text-xs font-bold transition-all ${
                          size === s
                            ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                            : "bg-emerald-100/50 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200 dark:hover:bg-emerald-900/60"
                        }`}
                      >
                        {s}px
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-brand-900 dark:text-brand-100 mb-1">
                    {t.correctionLabel}
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {(["L", "M", "Q", "H"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setErrorCorrection(c)}
                        className={`rounded-lg py-1.5 font-mono text-xs font-bold transition-all ${
                          errorCorrection === c
                            ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                            : "bg-emerald-100/50 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200 dark:hover:bg-emerald-900/60"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div
              role={error === "WARNING_CONTRAST" ? "status" : "alert"}
              className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-medium ${
                error === "WARNING_CONTRAST"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}
        </div>

        {/* Right Column: Symmetrical Hero QR Stage Card */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Top Header inside Stage */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.preview}</span>
            </div>
            <span className="rounded-lg bg-brand-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
              {size} x {size} px
            </span>
          </div>

          {/* Centered QR Display */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
            {dataUrl ? (
              <div className="relative rounded-3xl border border-emerald-500/25 bg-white p-5 shadow-raised ring-4 ring-emerald-500/10 transition-all duration-300 hover:scale-[1.02] dark:border-brand-800/60 dark:ring-emerald-400/10">
                <img
                  src={dataUrl}
                  alt={t.preview}
                  className="size-60 sm:size-72 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="grid size-60 sm:size-72 place-items-center rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-50/20 text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60">
                <span>{t.noResult}</span>
              </div>
            )}
          </div>

          {/* Bottom Action Toolbar & Metadata */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {dataUrl ? (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      downloadBlob({
                        blob: dataUrlToBlob(dataUrl),
                        fileName: `sfrankey-qr-${kind}.png`,
                      })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/25 transition hover:scale-102 hover:bg-brand-400 active:scale-98"
                  >
                    <Download size={16} className="stroke-[2.5]" />
                    <span>{t.downloadPng}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!generatedRender) return;
                      const svgLogo = generatedRender.logoUrl
                        ? await getLogoBase64(generatedRender.logoUrl)
                        : undefined;
                      const svg = await createQrSvg(payload, {
                        errorCorrectionLevel: generatedRender.errorCorrection,
                        margin: 2,
                        color: {
                          dark: generatedRender.foreground,
                          light: generatedRender.background,
                        },
                        logoUrl: svgLogo,
                      });
                      downloadBlob({
                        blob: new Blob([svg], { type: "image/svg+xml" }),
                        fileName: `sfrankey-qr-${kind}.svg`,
                      });
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-white/90 py-3 text-xs sm:text-sm font-bold text-brand-950 shadow-2xs transition hover:border-brand-400 hover:bg-brand-50 active:scale-98 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 dark:hover:bg-brand-900"
                  >
                    <FileCode size={16} />
                    <span>{t.downloadSvg}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={copyPayloadToClipboard}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-50/70 py-2.5 text-xs font-bold text-brand-900/85 transition hover:bg-emerald-100/80 active:scale-98 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-brand-200"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{locale === "vi" ? "Sao chép nội dung mã QR" : "Copy Payload Data"}</span>
                </button>
              </>
            ) : null}

            {/* Metadata footer */}
            {payload ? (
              <div className="w-full flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60 pt-2">
                <span>
                  {locale === "vi" ? "Dung lượng:" : "Payload size:"}{" "}
                  <strong className="text-brand-950 dark:text-brand-50">
                    {new TextEncoder().encode(payload).byteLength} / {MAX_BYTES} bytes
                  </strong>
                </span>
                <span>
                  {locale === "vi" ? "Sửa lỗi:" : "Correction:"}{" "}
                  <strong className="text-brand-950 dark:text-brand-50">
                    {generatedRender?.errorCorrection ?? errorCorrection} (
                    {errorCorrection === "H"
                      ? "30%"
                      : errorCorrection === "Q"
                        ? "25%"
                        : errorCorrection === "M"
                          ? "15%"
                          : "7%"}
                    )
                  </strong>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60">
        {t.privacy}
      </p>
    </div>
  );
}

function dataUrlToBlob(value: string) {
  const [header, encoded] = value.split(",");
  const binary = atob(encoded);
  return new Blob(
    [Uint8Array.from(binary, (character) => character.charCodeAt(0))],
    { type: header.match(/^data:([^;]+)/)?.[1] ?? "image/png" },
  );
}
