"use client";

import * as React from "react";
import type { Locale, NetworkErrorCode } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { maskIp, parseIceCandidate } from "@sfrankey/tool-core/network";
import { AlertTriangle, Building2, Button, Checkbox, cn, CopyButton, Input, Label, MapPin, Monitor, Select, ShieldCheck, Skeleton, StatusBadge } from "@sfrankey/ui";
import { ResultPanel } from "@/components/result-panel";
import { executeTurnstile } from "@/lib/turnstile-action";
import { useToast } from "@/components/toast-provider";

type NetworkSlug = "check-my-ip" | "ip-lookup" | "vpn-proxy-checker" | "ip-leak-test" | "dns-leak-test" | "webrtc-leak-test" | "dns-lookup" | "ssl-checker" | "redirect-checker" | "http-header-checker";
type ApiFailure = { success: false; error: { code: NetworkErrorCode; message: string; requestId: string } };
type ApiSuccess<T> = { success: true; data: T; requestId: string };
type LeakSession = { sessionId: string; readToken: string; probeUrls: string[]; expiresAt: string; ipProfile?: unknown };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const endpointBySlug: Partial<Record<NetworkSlug, string>> = {
  "check-my-ip": "my-ip", "ip-lookup": "ip-lookup", "vpn-proxy-checker": "privacy-check", "dns-lookup": "dns-lookup",
  "ssl-checker": "ssl-check", "redirect-checker": "redirect-check", "http-header-checker": "header-check"
};
const dnsTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA"] as const;

async function postNetwork<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const turnstileToken = await executeTurnstile();
  const response = await fetch(`${apiBase}/v1/network/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, turnstileToken }), cache: "no-store", signal });
  const value = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !value.success) throw new Error(value.success ? "PROCESSING_FAILED" : value.error.code);
  return value.data;
}

async function collectIceCandidates(signal: AbortSignal) {
  if (typeof RTCPeerConnection === "undefined") throw new Error("PROBE_UNAVAILABLE");
  const peer = new RTCPeerConnection({ iceServers: process.env.NEXT_PUBLIC_STUN_URL ? [{ urls: process.env.NEXT_PUBLIC_STUN_URL }] : [], iceTransportPolicy: "all" });
  const observations = new Map<string, ReturnType<typeof parseIceCandidate>>();
  const close = () => { peer.onicecandidate = null; peer.close(); };
  signal.addEventListener("abort", close, { once: true });
  try {
    peer.createDataChannel("diagnostic");
    peer.onicecandidate = (event) => { if (event.candidate?.candidate) { const parsed = parseIceCandidate(event.candidate.candidate); if (parsed) observations.set(`${parsed.address}-${parsed.type}-${parsed.protocol}`, parsed); } };
    await peer.setLocalDescription(await peer.createOffer());
    await new Promise<void>((resolve) => { const timer = window.setTimeout(resolve, 5000); peer.addEventListener("icegatheringstatechange", () => { if (peer.iceGatheringState === "complete") { window.clearTimeout(timer); resolve(); } }); });
    return [...observations.values()].filter(Boolean);
  } finally { close(); }
}

function prettyKey(value: string) { return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }

function ResultValue({ value, masked }: { value: unknown; masked: boolean }) {
  if (value === null || value === undefined || value === "") return <span className="text-[var(--ink-muted)]">—</span>;
  if (typeof value === "string") {
    let output = value;
    if (masked) {
      try { output = maskIp(value); } catch { /* not an IP */ }
    }
    return <span className="break-all font-semibold text-brand-950 dark:text-brand-50">{output}</span>;
  }
  if (typeof value === "boolean" || typeof value === "number") return <span className="font-mono font-bold text-brand-950 dark:text-brand-50">{String(value)}</span>;
  return <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs font-mono">{JSON.stringify(value, null, 2)}</pre>;
}

function IpResultView({ profile, browser, masked, locale }: { profile: any; browser?: any; masked: boolean; locale: Locale }) {
  const isVi = locale === "vi";
  const displayIp = masked ? maskIp(profile.ip) : profile.ip;
  const isLoopback = profile.scope === "loopback" || profile.scope === "private";

  return (
    <div className="space-y-4">
      {/* ─── Hero IP Banner ─── */}
      <div className="rounded-2xl border border-brand-200/80 bg-white/90 p-5 shadow-xs dark:border-brand-800/80 dark:bg-brand-950/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-700/70 dark:text-brand-300/70">
              {isVi ? "Địa chỉ IP nhận diện" : "Detected IP Address"}
            </span>
            <p className="mt-1 font-mono text-2xl font-black tracking-wide text-brand-950 sm:text-3xl dark:text-brand-50">
              {displayIp}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-500/15 px-3 py-1 font-mono text-xs font-black text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
              IPv{profile.version}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider",
                isLoopback
                  ? "bg-amber-500/15 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                  : "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
              )}
            >
              {profile.scope}
            </span>
          </div>
        </div>

        {isLoopback ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-xs leading-5 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <strong>{isVi ? "Môi trường Localhost / Loopback" : "Localhost / Loopback Environment"}</strong>:{" "}
              {isVi
                ? "Bạn đang chạy kiểm thử trên máy chủ nội bộ. Khi triển khai lên môi trường mạng Internet công khai, hệ thống sẽ tự động phân giải chính xác 100% IP, nhà mạng và vị trí thực của người dùng."
                : "You are testing from a local/private network. In production, public IP and ISP details are resolved automatically."}
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── Location & Network Grid ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Vị trí địa lý */}
        <div className="rounded-xl border border-brand-200/60 bg-white/70 p-4 shadow-2xs dark:border-brand-800/60 dark:bg-brand-900/40">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-700/70 dark:text-brand-300/70">
            <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{isVi ? "Vị trí địa lý (Ước tính)" : "Geolocation (Approx.)"}</span>
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-bold text-brand-950 dark:text-brand-50">
              {profile.countryCode ? `${profile.countryCode} · ` : ""}
              {profile.city ? `${profile.city}, ` : ""}
              {profile.region || (isVi ? "Mạng cục bộ" : "Local")}
            </p>
            <p className="text-xs text-brand-800/70 dark:text-brand-200/70">
              {isVi ? "Múi giờ" : "Timezone"}: {profile.timezone || (isVi ? "Tự động" : "Auto")}
            </p>
          </div>
        </div>

        {/* Nhà mạng & ASN */}
        <div className="rounded-xl border border-brand-200/60 bg-white/70 p-4 shadow-2xs dark:border-brand-800/60 dark:bg-brand-900/40">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-700/70 dark:text-brand-300/70">
            <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
            <span>{isVi ? "Nhà mạng & Tuyến đường (ISP / ASN)" : "ISP & ASN Routing"}</span>
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-bold text-brand-950 dark:text-brand-50">
              {profile.asn?.number ? `${profile.asn.number} · ` : ""}
              {profile.asn?.name || (isVi ? "Mạng nội bộ / Riêng tư" : "Private / Local ISP")}
            </p>
            <p className="text-xs text-brand-800/70 dark:text-brand-200/70">
              {isVi ? "Loại mạng" : "Network Type"}: {profile.network?.type || "ISP / Consumer"}
            </p>
          </div>
        </div>

        {/* Tín hiệu bảo mật */}
        <div className="rounded-xl border border-brand-200/60 bg-white/70 p-4 shadow-2xs dark:border-brand-800/60 dark:bg-brand-900/40">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-700/70 dark:text-brand-300/70">
            <ShieldCheck size={13} className="text-sky-600 dark:text-sky-400" />
            <span>{isVi ? "Tín hiệu bảo mật & Proxy" : "Security & Privacy Signals"}</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-brand-800/60 dark:text-brand-200/60">Mobile: </span>
              <span className="font-bold text-brand-950 dark:text-brand-100">{profile.network?.mobile || "unknown"}</span>
            </div>
            <div>
              <span className="text-brand-800/60 dark:text-brand-200/60">Hosting: </span>
              <span className="font-bold text-brand-950 dark:text-brand-100">{profile.network?.hosting || "unknown"}</span>
            </div>
          </div>
        </div>

        {/* Thông tin trình duyệt */}
        {browser ? (
          <div className="rounded-xl border border-brand-200/60 bg-white/70 p-4 shadow-2xs dark:border-brand-800/60 dark:bg-brand-900/40">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-700/70 dark:text-brand-300/70">
              <Monitor size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{isVi ? "Môi trường Client" : "Client Environment"}</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-brand-800/60 dark:text-brand-200/60">{isVi ? "Ngôn ngữ" : "Lang"}: </span>
                <span className="font-bold text-brand-950 dark:text-brand-100">{browser.language}</span>
              </div>
              <div>
                <span className="text-brand-800/60 dark:text-brand-200/60">{isVi ? "Màn hình" : "Screen"}: </span>
                <span className="font-bold text-brand-950 dark:text-brand-100">{browser.viewport}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StructuredResult({ value, masked, locale }: { value: unknown; masked: boolean; locale: Locale }) {
  if (!value || typeof value !== "object") return <ResultValue value={value} masked={masked} />;
  
  const obj = value as Record<string, unknown>;
  if (obj.profile && typeof obj.profile === "object") {
    return <IpResultView profile={obj.profile} browser={obj.browser} masked={masked} locale={locale} />;
  }
  if (obj.ip && obj.version && obj.scope) {
    return <IpResultView profile={obj} masked={masked} locale={locale} />;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {Object.entries(obj).map(([key, item]) => (
        <div key={key} className="min-w-0 rounded-xl border border-brand-200/60 bg-white/70 p-3.5 shadow-2xs dark:border-brand-800/60 dark:bg-brand-900/40">
          <dt className="text-[10px] font-black uppercase tracking-[.13em] text-brand-700/70 dark:text-brand-300/70">{prettyKey(key)}</dt>
          <dd className="mt-1.5 text-sm">
            <ResultValue value={item} masked={masked} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function NetworkWorkspace({ locale, slug }: { locale: Locale; slug: NetworkSlug }) {
  const dictionary = getDictionary(locale); const t = dictionary.networkSuite;
  const { toast } = useToast();
  const [input, setInput] = React.useState(""); const [privacyMode, setPrivacyMode] = React.useState<"mine" | "entered">("mine");
  const [selectedDns, setSelectedDns] = React.useState<string[]>(["A", "AAAA"]); const [result, setResult] = React.useState<unknown>(null);
  const [status, setStatus] = React.useState<"idle" | "checking" | "success" | "partial">("idle"); const [error, setError] = React.useState(""); const [masked, setMasked] = React.useState(true);
  const controller = React.useRef<AbortController | null>(null); const session = React.useRef<{ id: string; token: string } | null>(null);
  const isLeak = slug === "dns-leak-test" || slug === "ip-leak-test"; const isWebRtc = slug === "webrtc-leak-test";
  const targetKind = slug === "ip-lookup" || slug === "vpn-proxy-checker" ? "ip" : slug === "dns-lookup" || slug === "ssl-checker" ? "host" : "url";
  const needsInput = slug !== "check-my-ip" && !isLeak && !isWebRtc && !(slug === "vpn-proxy-checker" && privacyMode === "mine");

  const cleanup = React.useCallback(async () => {
    controller.current?.abort(); controller.current = null;
    if (session.current) { const current = session.current; session.current = null; void fetch(`${apiBase}/v1/network/leak-sessions/${current.id}`, { method: "DELETE", headers: { authorization: `Bearer ${current.token}` }, keepalive: true }).catch(() => undefined); }
  }, []);
  React.useEffect(() => () => { void cleanup(); }, [cleanup]);
  React.useEffect(() => { setResult(null); setError(""); setStatus("idle"); }, [input, privacyMode, selectedDns]);

  const pollLeakSession = async (created: LeakSession, signal: AbortSignal) => {
    session.current = { id: created.sessionId, token: created.readToken };
    created.probeUrls.forEach((url) => { const image = new Image(1, 1); image.referrerPolicy = "no-referrer"; image.src = `${url}${url.includes("?") ? "&" : "?"}r=${crypto.randomUUID()}`; });
    const deadline = Date.now() + 8000; let latest: unknown = { status: "pending", resolverIps: [] };
    while (Date.now() < deadline && !signal.aborted) {
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      const response = await fetch(`${apiBase}/v1/network/leak-sessions/${created.sessionId}`, { headers: { authorization: `Bearer ${created.readToken}` }, cache: "no-store", signal });
      const envelope = await response.json() as ApiSuccess<unknown> | ApiFailure;
      if (!response.ok || !envelope.success) throw new Error(envelope.success ? "PROBE_UNAVAILABLE" : envelope.error.code);
      latest = envelope.data;
      if ((latest as { status?: string }).status === "complete") break;
    }
    return latest;
  };

  const run = async () => {
    await cleanup(); const abort = new AbortController(); controller.current = abort; setStatus("checking"); setError(""); setResult(null);
    try {
      if (isWebRtc) setResult({ candidates: await collectIceCandidates(abort.signal) });
      else if (isLeak) {
        const branches: Promise<unknown>[] = [];
        const created = await postNetwork<LeakSession>("leak-sessions", { kind: slug === "ip-leak-test" ? "combined" : "dns" }, abort.signal);
        branches.push(pollLeakSession(created, abort.signal));
        if (slug === "ip-leak-test") branches.push(collectIceCandidates(abort.signal));
        const settled = await Promise.allSettled(branches);
        setResult({ publicIp: created.ipProfile, dns: settled[0]?.status === "fulfilled" ? settled[0].value : null, webRtc: settled[1]?.status === "fulfilled" ? settled[1].value : undefined });
        if (settled.some((item) => item.status === "rejected")) setStatus("partial");
      } else {
        const endpoint = endpointBySlug[slug]!; const body: Record<string, unknown> = {};
        if (slug === "ip-lookup") body.ip = input;
        if (slug === "vpn-proxy-checker" && privacyMode === "entered") body.ip = input;
        if (slug === "dns-lookup") { body.hostname = input; body.types = selectedDns; }
        if (slug === "ssl-checker") body.hostname = input;
        if (slug === "redirect-checker" || slug === "http-header-checker") body.url = input;
        const data = await postNetwork<unknown>(endpoint, body, abort.signal);
        if (slug === "check-my-ip") setResult({ profile: data, browser: { language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, viewport: `${window.innerWidth}×${window.innerHeight}`, screen: `${window.screen.width}×${window.screen.height}`, checkedAt: new Date().toISOString() } });
        else setResult(data);
      }
      setStatus((current) => current === "partial" ? current : "success");
    } catch (caught) { if (!abort.signal.aborted) { const code = caught instanceof Error ? caught.message : "PROCESSING_FAILED"; setError(t.errors[code as keyof typeof t.errors] ?? dictionary.common.error); setStatus("idle"); } }
    finally { if (controller.current === abort) controller.current = null; }
  };
  const reset = () => { void cleanup(); setInput(""); setResult(null); setError(""); setStatus("idle"); setMasked(true); setSelectedDns(["A", "AAAA"]); };
  const summary = result ? JSON.stringify(result, null, 2) : "";

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
    <section className="space-y-5">
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sky-950 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100"><p className="font-bold">{t.disclosureTitle}</p><p className="mt-2 text-sm leading-6 opacity-80">{t.disclosure}</p></div>
      {slug === "vpn-proxy-checker" ? <div><Label htmlFor="privacy-mode">{t.selectedMode}</Label><Select id="privacy-mode" className="w-full" value={privacyMode} onChange={(event) => setPrivacyMode(event.target.value as "mine" | "entered")}><option value="mine">{t.myIp}</option><option value="entered">{t.enteredIp}</option></Select></div> : null}
      {needsInput ? <div><Label htmlFor="network-target">{t.targetLabel}</Label><Input id="network-target" value={input} onChange={(event) => setInput(event.target.value)} maxLength={targetKind === "ip" ? 64 : targetKind === "url" ? 2048 : 253} placeholder={targetKind === "ip" ? t.ipPlaceholder : targetKind === "host" ? t.hostPlaceholder : t.urlPlaceholder} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div> : null}
      {slug === "dns-lookup" ? <fieldset><legend className="mb-3 text-sm font-semibold">{t.dnsTypes}</legend><div className="flex flex-wrap gap-3">{dnsTypes.map((type) => <label key={type} className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-card)] px-3 text-sm"><Checkbox checked={selectedDns.includes(type)} onCheckedChange={(checked) => setSelectedDns((current) => checked ? [...current, type] : current.filter((item) => item !== type))} />{type}</label>)}</div></fieldset> : null}
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={run} disabled={status === "checking" || (needsInput && !input.trim()) || (slug === "dns-lookup" && selectedDns.length === 0)}>{status === "checking" ? dictionary.common.loading : isLeak || isWebRtc ? t.startLeak : t.check}</Button>{status === "checking" ? <Button type="button" variant="secondary" onClick={() => { void cleanup(); setStatus("idle"); }}>{t.cancel}</Button> : null}<Button type="button" variant="ghost" onClick={reset}>{dictionary.common.reset}</Button></div>
      {status === "idle" && !error && !result ? <p className="text-sm text-[var(--ink-muted)]">{t.noRequest}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
    </section>
    <section aria-live="polite">
      <ResultPanel label={t.results} status={status === "checking" ? "working" : status === "partial" ? "warning" : result ? "success" : "idle"} actions={result ? <><Button type="button" size="sm" variant="secondary" onClick={() => setMasked((value) => !value)}>{masked ? t.reveal : t.hide}</Button><CopyButton value={summary} label={t.copySummary} copiedLabel={dictionary.common.copied} onCopied={() => toast({ title: dictionary.common.copied, variant: "success" })} /></> : undefined}>
        {status === "checking" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="grid gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4">
                <Skeleton className="h-3.5 w-24 bg-white/10" />
                <Skeleton className="h-5 w-3/4 bg-white/10" />
              </div>
            ))}
          </div>
        ) : result ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {status === "partial" ? <StatusBadge status="warning">{t.partial}</StatusBadge> : <StatusBadge status="success">{t.approximate}</StatusBadge>}
            </div>
            <StructuredResult value={result} masked={masked} locale={locale} />
          </>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">{t.noRequest}</p>
        )}
      </ResultPanel>
    </section>
  </div>;
}
