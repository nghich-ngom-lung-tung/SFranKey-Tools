"use client";

import * as React from "react";
import type { IpProfile, Locale, NetworkErrorCode } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { maskIp, parseIceCandidate } from "@sfrankey/tool-core/network";
import { cn } from "@sfrankey/ui";
import { executeTurnstile } from "@/lib/turnstile-action";
import { useToast } from "@/components/providers/toast-provider";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Info,
  Layers,
  MapPin,
  Monitor,
  Network,
  Radio,
  RotateCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

type NetworkSlug =
  | "check-my-ip"
  | "ip-lookup"
  | "vpn-proxy-checker"
  | "ip-leak-test"
  | "dns-leak-test"
  | "webrtc-leak-test"
  | "dns-lookup"
  | "ssl-checker"
  | "redirect-checker"
  | "http-header-checker";

type ApiFailure = {
  success: false;
  error: { code: NetworkErrorCode; message: string; requestId: string };
};
type ApiSuccess<T> = { success: true; data: T; requestId: string };
type LeakSession = {
  sessionId: string;
  readToken: string;
  probeUrls: string[];
  expiresAt: string;
  ipProfile?: unknown;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const endpointBySlug: Partial<Record<NetworkSlug, string>> = {
  "check-my-ip": "my-ip",
  "ip-lookup": "ip-lookup",
  "vpn-proxy-checker": "privacy-check",
  "dns-lookup": "dns-lookup",
  "ssl-checker": "ssl-check",
  "redirect-checker": "redirect-check",
  "http-header-checker": "header-check",
};
const dnsTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA"] as const;

async function postNetwork<T>(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const turnstileToken = await executeTurnstile();
  const response = await fetch(`${apiBase}/v1/network/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, turnstileToken }),
    cache: "no-store",
    signal,
  });
  const value = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !value.success) {
    throw new Error(value.success ? "PROCESSING_FAILED" : value.error.code);
  }
  return value.data;
}

async function collectIceCandidates(signal: AbortSignal) {
  if (typeof RTCPeerConnection === "undefined") {
    throw new Error("PROBE_UNAVAILABLE");
  }
  const peer = new RTCPeerConnection({
    iceServers: process.env.NEXT_PUBLIC_STUN_URL
      ? [{ urls: process.env.NEXT_PUBLIC_STUN_URL }]
      : [],
    iceTransportPolicy: "all",
  });
  const observations = new Map<string, ReturnType<typeof parseIceCandidate>>();
  const close = () => {
    peer.onicecandidate = null;
    peer.close();
  };
  signal.addEventListener("abort", close, { once: true });
  try {
    peer.createDataChannel("diagnostic");
    peer.onicecandidate = (event) => {
      if (event.candidate?.candidate) {
        const parsed = parseIceCandidate(event.candidate.candidate);
        if (parsed) {
          observations.set(
            `${parsed.address}-${parsed.type}-${parsed.protocol}`,
            parsed,
          );
        }
      }
    };
    await peer.setLocalDescription(await peer.createOffer());
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, 5000);
      peer.addEventListener("icegatheringstatechange", () => {
        if (peer.iceGatheringState === "complete") {
          window.clearTimeout(timer);
          resolve();
        }
      });
    });
    return [...observations.values()].filter(Boolean);
  } finally {
    close();
  }
}

function prettyKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function ResultValue({ value, masked }: { value: unknown; masked: boolean }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-brand-700/50 dark:text-brand-300/50">—</span>;
  }
  if (typeof value === "string") {
    let output = value;
    if (masked) {
      try {
        output = maskIp(value);
      } catch {
        /* not an IP */
      }
    }
    return (
      <span className="break-all font-mono font-bold text-brand-950 dark:text-brand-50">
        {output}
      </span>
    );
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return (
      <span className="font-mono font-black text-brand-950 dark:text-brand-50">
        {String(value)}
      </span>
    );
  }
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs font-mono text-brand-950 dark:text-brand-50">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type BrowserEnvironment = {
  language?: string;
  timezone?: string;
  viewport?: string;
  screen?: string;
  checkedAt?: string;
};

function IpResultView({
  profile,
  browser,
  masked,
  locale,
}: {
  profile: IpProfile;
  browser?: BrowserEnvironment;
  masked: boolean;
  locale: Locale;
}) {
  const isVi = locale === "vi";
  const displayIp = masked ? maskIp(profile.ip) : profile.ip;
  const isLoopback =
    profile.scope === "loopback" || profile.scope === "private";

  return (
    <div className="w-full space-y-4">
      {/* ─── Hero IP Banner ─── */}
      <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 sm:p-5 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
              {isVi ? "Địa chỉ IP nhận diện" : "Detected IP Address"}
            </span>
            <p className="mt-1 font-mono text-2xl font-black tracking-wide text-brand-950 sm:text-3xl dark:text-brand-50 break-all">
              {displayIp}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-emerald-500/15 px-3 py-1 font-mono text-xs font-black text-brand-900 ring-1 ring-emerald-500/30 dark:bg-emerald-900/60 dark:text-brand-100">
              IPv{profile.version}
            </span>
            <span
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider",
                isLoopback
                  ? "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/30 dark:bg-amber-900/60 dark:text-amber-200"
                  : "bg-emerald-500/20 text-emerald-900 ring-1 ring-emerald-500/30 dark:bg-emerald-900/60 dark:text-emerald-200",
              )}
            >
              {profile.scope}
            </span>
          </div>
        </div>

        {isLoopback ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/50 bg-amber-50/80 p-3 text-xs leading-5 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div>
              <strong>
                {isVi
                  ? "Môi trường Localhost / Loopback"
                  : "Localhost / Loopback Environment"}
              </strong>
              :{" "}
              {isVi
                ? "Bạn đang chạy kiểm thử trên máy chủ nội bộ. Khi triển khai trên Internet công khai, hệ thống sẽ tự động phân giải chính xác IP, nhà mạng và vị trí thực của người dùng."
                : "You are testing from a local/private network. In production, public IP and ISP details are resolved automatically."}
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── Location & Network Grid ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Vị trí địa lý */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/85">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
            <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>
              {isVi ? "Vị trí địa lý (Ước tính)" : "Geolocation (Approx.)"}
            </span>
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="font-bold text-brand-950 dark:text-brand-50">
              {profile.countryCode ? `${profile.countryCode} · ` : ""}
              {profile.city ? `${profile.city}, ` : ""}
              {profile.region || (isVi ? "Mạng cục bộ" : "Local")}
            </p>
            <p className="text-brand-800/70 dark:text-brand-200/70">
              {isVi ? "Múi giờ" : "Timezone"}:{" "}
              {profile.timezone || (isVi ? "Tự động" : "Auto")}
            </p>
          </div>
        </div>

        {/* Nhà mạng & ASN */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/85">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
            <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
            <span>
              {isVi ? "Nhà mạng & Tuyến đường (ISP / ASN)" : "ISP & ASN Routing"}
            </span>
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="font-bold text-brand-950 dark:text-brand-50">
              {profile.asn?.number ? `${profile.asn.number} · ` : ""}
              {profile.asn?.name ||
                (isVi ? "Mạng nội bộ / Riêng tư" : "Private / Local ISP")}
            </p>
            <p className="text-brand-800/70 dark:text-brand-200/70">
              {isVi ? "Loại mạng" : "Network Type"}:{" "}
              {profile.network?.type || "ISP / Consumer"}
            </p>
          </div>
        </div>

        {/* Tín hiệu bảo mật */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/85">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
            <ShieldCheck size={13} className="text-sky-600 dark:text-sky-400" />
            <span>
              {isVi
                ? "Tín hiệu bảo mật & Proxy"
                : "Security & Privacy Signals"}
            </span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-brand-800/60 dark:text-brand-200/60">
                Mobile:{" "}
              </span>
              <span className="font-bold text-brand-950 dark:text-brand-100">
                {profile.network?.mobile || "unknown"}
              </span>
            </div>
            <div>
              <span className="text-brand-800/60 dark:text-brand-200/60">
                Hosting:{" "}
              </span>
              <span className="font-bold text-brand-950 dark:text-brand-100">
                {profile.network?.hosting || "unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin trình duyệt */}
        {browser ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/85">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
              <Monitor size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{isVi ? "Môi trường Client" : "Client Environment"}</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-brand-800/60 dark:text-brand-200/60">
                  {isVi ? "Ngôn ngữ" : "Lang"}:{" "}
                </span>
                <span className="font-bold text-brand-950 dark:text-brand-100">
                  {browser.language}
                </span>
              </div>
              <div>
                <span className="text-brand-800/60 dark:text-brand-200/60">
                  {isVi ? "Màn hình" : "Screen"}:{" "}
                </span>
                <span className="font-bold text-brand-950 dark:text-brand-100">
                  {browser.viewport}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StructuredResult({
  value,
  masked,
  locale,
}: {
  value: unknown;
  masked: boolean;
  locale: Locale;
}) {
  if (!value || typeof value !== "object") {
    return <ResultValue value={value} masked={masked} />;
  }

  const obj = value as Record<string, unknown>;
  if (obj.profile && typeof obj.profile === "object") {
    return (
      <IpResultView
        profile={obj.profile as IpProfile}
        browser={obj.browser as BrowserEnvironment | undefined}
        masked={masked}
        locale={locale}
      />
    );
  }
  if (obj.ip && obj.version && obj.scope) {
    return (
      <IpResultView
        profile={obj as unknown as IpProfile}
        masked={masked}
        locale={locale}
      />
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2 w-full">
      {Object.entries(obj).map(([key, item]) => (
        <div
          key={key}
          className="min-w-0 rounded-2xl border border-emerald-500/20 bg-white/90 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/85"
        >
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
            {prettyKey(key)}
          </dt>
          <dd className="mt-1.5 text-xs">
            <ResultValue value={item} masked={masked} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function NetworkWorkspace({
  locale,
  slug,
}: {
  locale: Locale;
  slug: NetworkSlug;
}) {
  const dictionary = getDictionary(locale);
  const t = dictionary.networkSuite;
  const common = dictionary.common;
  const { toast } = useToast();

  const [input, setInput] = React.useState("");
  const [privacyMode, setPrivacyMode] = React.useState<"mine" | "entered">(
    "mine",
  );
  const [selectedDns, setSelectedDns] = React.useState<string[]>([
    "A",
    "AAAA",
  ]);
  const [result, setResult] = React.useState<unknown>(null);
  const [status, setStatus] = React.useState<
    "idle" | "checking" | "success" | "partial"
  >("idle");
  const [error, setError] = React.useState("");
  const [masked, setMasked] = React.useState(true);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const controller = React.useRef<AbortController | null>(null);
  const session = React.useRef<{ id: string; token: string } | null>(null);
  const isLeak = slug === "dns-leak-test" || slug === "ip-leak-test";
  const isWebRtc = slug === "webrtc-leak-test";
  const targetKind =
    slug === "ip-lookup" || slug === "vpn-proxy-checker"
      ? "ip"
      : slug === "dns-lookup" || slug === "ssl-checker"
        ? "host"
        : "url";
  const needsInput =
    slug !== "check-my-ip" &&
    !isLeak &&
    !isWebRtc &&
    !(slug === "vpn-proxy-checker" && privacyMode === "mine");

  const cleanup = React.useCallback(async () => {
    controller.current?.abort();
    controller.current = null;
    if (session.current) {
      const current = session.current;
      session.current = null;
      void fetch(`${apiBase}/v1/network/leak-sessions/${current.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${current.token}` },
        keepalive: true,
      }).catch(() => undefined);
    }
  }, []);

  React.useEffect(() => () => {
    void cleanup();
  }, [cleanup]);

  React.useEffect(() => {
    setResult(null);
    setError("");
    setStatus("idle");
  }, [input, privacyMode, selectedDns]);

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
          setInput(text.trim());
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
    if (targetKind === "ip") {
      setInput("8.8.8.8");
    } else if (targetKind === "host") {
      setInput("sfrankey.bond");
    } else {
      setInput("https://sfrankey.bond");
    }
  };

  const pollLeakSession = async (
    created: LeakSession,
    signal: AbortSignal,
  ) => {
    session.current = { id: created.sessionId, token: created.readToken };
    created.probeUrls.forEach((url) => {
      const image = new Image(1, 1);
      image.referrerPolicy = "no-referrer";
      image.src = `${url}${url.includes("?") ? "&" : "?"}r=${crypto.randomUUID()}`;
    });
    const deadline = Date.now() + 8000;
    let latest: unknown = { status: "pending", resolverIps: [] };
    while (Date.now() < deadline && !signal.aborted) {
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      const response = await fetch(
        `${apiBase}/v1/network/leak-sessions/${created.sessionId}`,
        {
          headers: { authorization: `Bearer ${created.readToken}` },
          cache: "no-store",
          signal,
        },
      );
      const envelope = (await response.json()) as
        | ApiSuccess<unknown>
        | ApiFailure;
      if (!response.ok || !envelope.success) {
        throw new Error(
          envelope.success ? "PROBE_UNAVAILABLE" : envelope.error.code,
        );
      }
      latest = envelope.data;
      if ((latest as { status?: string }).status === "complete") break;
    }
    return latest;
  };

  const run = async () => {
    await cleanup();
    const abort = new AbortController();
    controller.current = abort;
    setStatus("checking");
    setError("");
    setResult(null);
    try {
      if (isWebRtc) {
        setResult({ candidates: await collectIceCandidates(abort.signal) });
      } else if (isLeak) {
        const branches: Promise<unknown>[] = [];
        const created = await postNetwork<LeakSession>(
          "leak-sessions",
          { kind: slug === "ip-leak-test" ? "combined" : "dns" },
          abort.signal,
        );
        branches.push(pollLeakSession(created, abort.signal));
        if (slug === "ip-leak-test") {
          branches.push(collectIceCandidates(abort.signal));
        }
        const settled = await Promise.allSettled(branches);
        setResult({
          publicIp: created.ipProfile,
          dns:
            settled[0]?.status === "fulfilled" ? settled[0].value : null,
          webRtc:
            settled[1]?.status === "fulfilled" ? settled[1].value : undefined,
        });
        if (settled.some((item) => item.status === "rejected")) {
          setStatus("partial");
        }
      } else {
        const endpoint = endpointBySlug[slug]!;
        const body: Record<string, unknown> = {};
        if (slug === "ip-lookup") body.ip = input;
        if (slug === "vpn-proxy-checker" && privacyMode === "entered") {
          body.ip = input;
        }
        if (slug === "dns-lookup") {
          body.hostname = input;
          body.types = selectedDns;
        }
        if (slug === "ssl-checker") body.hostname = input;
        if (slug === "redirect-checker" || slug === "http-header-checker") {
          body.url = input;
        }
        const data = await postNetwork<unknown>(endpoint, body, abort.signal);
        if (slug === "check-my-ip") {
          setResult({
            profile: data,
            browser: {
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              viewport: `${window.innerWidth}×${window.innerHeight}`,
              screen: `${window.screen.width}×${window.screen.height}`,
              checkedAt: new Date().toISOString(),
            },
          });
        } else {
          setResult(data);
        }
      }
      setStatus((current) => (current === "partial" ? current : "success"));
    } catch (caught) {
      if (!abort.signal.aborted) {
        const code =
          caught instanceof Error ? caught.message : "PROCESSING_FAILED";
        setError(
          t.errors[code as keyof typeof t.errors] ?? dictionary.common.error,
        );
        setStatus("idle");
      }
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  };

  const reset = () => {
    void cleanup();
    setInput("");
    setResult(null);
    setError("");
    setStatus("idle");
    setMasked(true);
    setSelectedDns(["A", "AAAA"]);
  };

  const summary = result ? JSON.stringify(result, null, 2) : "";

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
                <Radio size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Cấu hình chẩn đoán mạng" : "Network Diagnostic Setup"}</span>
              </div>
            </div>

            {/* Privacy Disclosure Alert Banner */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/80 p-4 text-xs text-brand-950 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-brand-100 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-brand-900 dark:text-brand-100">
                <Info size={15} className="text-brand-600 dark:text-brand-400" />
                <span>{t.disclosureTitle}</span>
              </p>
              <p className="leading-relaxed opacity-85">{t.disclosure}</p>
            </div>

            {/* Mode Switcher for VPN Proxy Checker */}
            {slug === "vpn-proxy-checker" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.selectedMode}
                </label>
                <div
                  role="tablist"
                  aria-label={t.selectedMode}
                  className="grid grid-cols-2 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={privacyMode === "mine"}
                    onClick={() => setPrivacyMode("mine")}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${
                      privacyMode === "mine"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.myIp}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={privacyMode === "entered"}
                    onClick={() => setPrivacyMode("entered")}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${
                      privacyMode === "entered"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.enteredIp}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Target Input Box */}
            {needsInput ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="network-target"
                    className="text-xs font-bold text-brand-950 dark:text-brand-50"
                  >
                    {t.targetLabel}
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
                      onClick={handleLoadSample}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                    >
                      <Sparkles size={12} />
                      <span>{locale === "vi" ? "Mẫu" : "Sample"}</span>
                    </button>
                    {input ? (
                      <button
                        type="button"
                        onClick={() => setInput("")}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 size={12} />
                        <span>{common.clear}</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                <input
                  id="network-target"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={
                    targetKind === "ip" ? 64 : targetKind === "url" ? 2048 : 253
                  }
                  placeholder={
                    targetKind === "ip"
                      ? t.ipPlaceholder
                      : targetKind === "host"
                        ? t.hostPlaceholder
                        : t.urlPlaceholder
                  }
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-sm font-bold text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                />
              </div>
            ) : null}

            {/* DNS Lookup Types Pills */}
            {slug === "dns-lookup" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1.5">
                  <Layers size={13} className="text-brand-600 dark:text-brand-400" />
                  <span>{t.dnsTypes}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dnsTypes.map((type) => {
                    const isSelected = selectedDns.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setSelectedDns((current) =>
                            isSelected
                              ? current.filter((item) => item !== type)
                              : [...current, type],
                          )
                        }
                        className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-brand-500 text-brand-950 shadow-2xs font-black ring-1 ring-brand-500/40"
                            : "border border-emerald-500/20 bg-white/80 text-brand-800/70 hover:bg-white dark:border-emerald-500/20 dark:bg-[#07241a]/60 dark:text-brand-200/70"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
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
                onClick={run}
                disabled={
                  status === "checking" ||
                  (needsInput && !input.trim()) ||
                  (slug === "dns-lookup" && selectedDns.length === 0)
                }
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98 disabled:opacity-50"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>
                  {status === "checking"
                    ? common.loading
                    : isLeak || isWebRtc
                      ? t.startLeak
                      : t.check}
                </span>
              </button>

              {status === "checking" ? (
                <button
                  type="button"
                  onClick={() => {
                    void cleanup();
                    setStatus("idle");
                  }}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition"
                >
                  {t.cancel}
                </button>
              ) : null}

              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-brand-200/80 bg-white/90 px-4 py-3 text-xs font-bold text-brand-800 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200 transition"
              >
                {common.reset}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {dictionary.developerSuite.shared.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Diagnostic Inspector Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.results}</span>
            </div>

            {result ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMasked((m) => !m)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-white/80 px-2 py-1 text-[11px] font-bold text-brand-900 shadow-2xs hover:bg-white dark:border-emerald-500/20 dark:bg-[#07241a]/80 dark:text-brand-100 transition"
                >
                  {masked ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{masked ? t.reveal : t.hide}</span>
                </button>
                <span className="flex items-center gap-1 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                  <CheckCircle2 size={13} className="text-brand-600 dark:text-brand-300" />
                  <span>
                    {status === "partial" ? t.partial : t.approximate}
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 w-full">
            {status === "checking" ? (
              /* LOADING SKELETON */
              <div className="grid gap-3 sm:grid-cols-2 w-full animate-pulse">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="grid gap-2.5 rounded-2xl border border-emerald-500/20 bg-white/60 p-4 dark:border-emerald-500/20 dark:bg-[#07241a]/60"
                  >
                    <div className="h-3 w-20 rounded bg-emerald-500/20" />
                    <div className="h-5 w-3/4 rounded bg-emerald-500/30" />
                  </div>
                ))}
              </div>
            ) : result ? (
              <StructuredResult value={result} masked={masked} locale={locale} />
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Globe size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {t.noRequest}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Bấm 'Bắt đầu kiểm tra' để phân tích và xem dữ liệu chẩn đoán."
                      : "Click 'Run check' to analyze and inspect diagnostic data."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {result ? (
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
                <span>{t.copySummary}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
