import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Binary,
  Braces,
  Bug,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  CodeXml,
  Copy,
  Cpu,
  Database,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Fingerprint,
  Globe,
  Globe2,
  HardDrive,
  Hash,
  Heart,
  Info,
  KeyRound,
  Layers,
  Loader2,
  LockKeyhole,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Monitor,
  Moon,
  Network,
  PanelTop,
  QrCode,
  Radar,
  Radio,
  RadioTower,
  Route,
  ScanLine,
  ScanQrCode,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sliders,
  Sparkles,
  ServerCog,
  Sun,
  Target,
  Timer,
  X,
  Zap,
  ZapOff,
  type LucideIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale, ToolCategory, ToolDefinition, ToolIconKey } from "@sfrankey/shared";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const iconMap: Record<ToolIconKey, LucideIcon> = {
  timer: Timer,
  "scan-line": ScanLine,
  "key-round": KeyRound,
  "shield-check": ShieldCheck,
  "qr-code": QrCode,
  "scan-qr-code": ScanQrCode,
  binary: Binary,
  hash: Hash,
  "file-check": FileCheck,
  braces: Braces,
  "code-xml": CodeXml,
  fingerprint: Fingerprint,
  "clock-3": Clock3,
  "globe-2": Globe2,
  "map-pin": MapPin,
  "shield-question": ShieldQuestion,
  radar: Radar,
  "server-cog": ServerCog,
  "radio-tower": RadioTower,
  network: Network,
  "lock-keyhole": LockKeyhole,
  route: Route,
  "panel-top": PanelTop
};

type CategoryTone = { icon: string; text: string; rail: string; soft: string; glow: string };

const categoryTone: Record<ToolCategory, CategoryTone> = {
  "2fa": { icon: "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200", text: "text-teal-700 dark:text-teal-200", rail: "bg-teal-400", soft: "from-teal-50/90 via-white to-white dark:from-teal-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(20,184,166,.18)]" },
  password: { icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200", text: "text-emerald-700 dark:text-emerald-200", rail: "bg-emerald-400", soft: "from-emerald-50/90 via-white to-white dark:from-emerald-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(16,185,129,.18)]" },
  qr: { icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200", text: "text-cyan-700 dark:text-cyan-200", rail: "bg-cyan-400", soft: "from-cyan-50/90 via-white to-white dark:from-cyan-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(6,182,212,.18)]" },
  encoding: { icon: "bg-lime-100 text-lime-700 dark:bg-lime-900/60 dark:text-lime-200", text: "text-lime-700 dark:text-lime-200", rail: "bg-lime-400", soft: "from-lime-50/90 via-white to-white dark:from-lime-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(132,204,22,.16)]" },
  developer: { icon: "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200", text: "text-violet-700 dark:text-violet-200", rail: "bg-violet-400", soft: "from-violet-50/90 via-white to-white dark:from-violet-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(139,92,246,.18)]" },
  network: { icon: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-200", text: "text-sky-700 dark:text-sky-200", rail: "bg-sky-400", soft: "from-sky-50/90 via-white to-white dark:from-sky-950/60 dark:via-brand-900/80 dark:to-brand-900/80", glow: "hover:shadow-[0_24px_60px_rgba(14,165,233,.18)]" }
};

export function getCategoryTone(category: ToolCategory) { return categoryTone[category]; }

export function ToolIcon({ iconKey, className, size = 20 }: { iconKey: ToolIconKey; className?: string; size?: number }) {
  const Icon = iconMap[iconKey];
  return <Icon aria-hidden="true" className={className} size={size} strokeWidth={1.8} />;
}

export function BrandMark({ className, title = "SFranKey" }: { className?: string; title?: string }) {
  return (
    <span className={cn("relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-xl bg-brand-950 shadow-sm ring-1 ring-emerald-500/30 transition-transform duration-300 group-hover:scale-105", className)}>
      <img
        src="/logo.jpg"
        alt={title}
        className="size-full object-cover"
        loading="eager"
      />
    </span>
  );
}

export function BrandLogo({ locale, descriptor, compact = false, inverse = false, className }: { locale?: Locale; descriptor?: string; compact?: boolean; inverse?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <BrandMark className="size-10" />
      <span className={cn("min-w-0", compact && "sr-only sm:not-sr-only")}>
        <span className="flex items-center gap-1.5">
          <span className={cn("block truncate text-base font-black tracking-[-0.03em]", inverse ? "text-white" : "text-brand-950 dark:text-brand-50")}>
            SFranKey
          </span>
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
        </span>
        {descriptor ? (
          <span className={cn("block truncate text-[10px] font-bold uppercase tracking-wider", inverse ? "text-brand-200/90" : "text-brand-950/80 dark:text-brand-200/80")}>
            {descriptor}
          </span>
        ) : null}
        {locale ? (
          <span className="sr-only">
            {locale === "vi" ? "Công cụ bảo mật và lập trình" : "Security and developer tools"}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function Button({ className, asChild = false, variant = "primary", size = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"; size?: "sm" | "default" | "lg" | "icon" }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("group inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)] disabled:pointer-events-none disabled:opacity-50", {
    "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-md shadow-brand-600/20 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] hover:shadow-raised": variant === "primary",
    "border border-[var(--border-card)] bg-[var(--surface-card)] text-[var(--ink)] shadow-sm hover:-translate-y-0.5 hover:border-brand-400 hover:bg-[var(--surface-card-hover)]": variant === "secondary",
    "border border-brand-300/50 bg-transparent text-brand-700 hover:border-brand-500 hover:bg-brand-100/60 dark:text-brand-100 dark:hover:border-brand-400 dark:hover:bg-brand-900/70": variant === "outline",
    "text-brand-800 hover:bg-brand-100/80 dark:text-brand-200 dark:hover:bg-brand-900/70": variant === "ghost",
    "bg-rose-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-rose-700": variant === "danger",
    "min-h-9 rounded-[var(--radius-sm)] px-3 text-xs": size === "sm",
    "min-h-12 px-5": size === "lg",
    "size-11 min-h-11 rounded-full p-0": size === "icon"
  }, className)} {...props} />;
}

export function IconButton({ label, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) { return <Button type="button" size="icon" variant="ghost" className={className} aria-label={label} {...props}>{children}</Button>; }

export function Card({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "elevated" | "glass" | "workspace" | "result" }) { return <div className={cn("sfr-card", `sfr-card-${variant}`, "rounded-[var(--radius-lg)] border border-[var(--border-card)] bg-[var(--surface-card)] p-5 text-[var(--color-text)] shadow-soft", {
  "shadow-raised": variant === "elevated",
  "bg-[var(--surface-glass)] backdrop-blur-xl": variant === "glass",
  "rounded-[var(--radius-xl)] bg-[var(--surface-workspace)] p-5 shadow-card sm:p-7": variant === "workspace",
  "border-brand-300/25 bg-[var(--surface-result)] text-[var(--result-ink)] shadow-inset": variant === "result"
}, className)} {...props} />; }

export type ToolCardVariant = "showcase" | "standard" | "compact" | "related";
export type ToolPreviewKind =
  | "totp"
  | "scanner"
  | "password"
  | "strength"
  | "qr"
  | "qr-reader"
  | "base64"
  | "hash"
  | "file-checksum"
  | "jwt"
  | "code"
  | "uuid"
  | "timestamp"
  | "ip"
  | "ip-lookup"
  | "vpn-proxy"
  | "ip-leak"
  | "dns-leak"
  | "webrtc"
  | "dns"
  | "ssl"
  | "redirect"
  | "headers";

export type ToolCardProps = { tool: ToolDefinition; locale: Locale; variant?: ToolCardVariant; previewKind?: ToolPreviewKind; href: string; favorite?: boolean; onFavoriteChange?: (toolId: string) => void; className?: string; privacyLabel: string; categoryLabel: string; favoriteLabel?: string; unfavoriteLabel?: string; relationLabel?: string; openLabel?: string };

const previewByTool: Record<string, ToolPreviewKind> = {
  "totp-generator": "totp",
  "qr-2fa-scanner": "scanner",
  "password-generator": "password",
  "password-strength-checker": "strength",
  "qr-generator": "qr",
  "qr-reader": "qr-reader",
  "base64": "base64",
  "hash-generator": "hash",
  "file-checksum": "file-checksum",
  "jwt-decoder": "jwt",
  "json-formatter": "code",
  "uuid-generator": "uuid",
  "timestamp-converter": "timestamp",
  "check-my-ip": "ip",
  "ip-lookup": "ip-lookup",
  "vpn-proxy-checker": "vpn-proxy",
  "ip-leak-test": "ip-leak",
  "dns-leak-test": "dns-leak",
  "webrtc-leak-test": "webrtc",
  "dns-lookup": "dns",
  "ssl-checker": "ssl",
  "redirect-checker": "redirect",
  "http-header-checker": "headers"
};

function MiniPreview({ kind }: { kind: ToolPreviewKind }) {
  if (kind === "totp") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-teal-500/40 group-hover:bg-teal-500/[0.09] dark:border-teal-500/25 dark:bg-teal-950/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
            <span className="size-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse" />
            LIVE TOKEN
          </span>
          <span className="rounded-full bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            30s
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xl font-black tracking-[.22em] text-teal-950 dark:text-teal-100">
            482 <span className="text-teal-600 dark:text-teal-400">913</span>
          </span>
          <span className="rounded-lg border border-teal-500/30 bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-800 shadow-sm dark:bg-teal-900/60 dark:text-teal-200">
            OTP
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-200/50 dark:bg-teal-950">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
        </div>
      </div>
    );
  }

  if (kind === "scanner") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-teal-500/40 group-hover:bg-teal-500/[0.09] dark:border-teal-500/25 dark:bg-teal-950/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
            <span className="size-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse" />
            CAMERA HUD
          </span>
          <span className="rounded-full bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            DECODER
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-teal-500/20 bg-white/80 px-2.5 py-1 shadow-sm dark:bg-teal-950/60">
          <div className="relative grid size-6 shrink-0 place-items-center rounded border border-teal-500/50 bg-teal-50 dark:bg-teal-900/50">
            <div className="size-3 rounded-[1px] border border-teal-500" />
            <div className="absolute inset-x-0.5 top-1/2 h-0.5 bg-teal-500" />
          </div>
          <p className="truncate font-mono text-xs text-teal-950 dark:text-teal-200">
            otpauth://totp/demo
          </p>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-teal-700/80 dark:text-teal-300/80">
          <span>PARSER READY</span>
          <span className="text-teal-600 dark:text-teal-400 font-extrabold">AUTO DETECT</span>
        </div>
      </div>
    );
  }

  if (kind === "password") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/[0.09] dark:border-emerald-500/25 dark:bg-emerald-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            CSPRNG ENTROPY
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            128 BIT
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-sm tracking-wider rounded-xl border border-emerald-500/20 bg-white/80 px-3 py-1 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/60">
          <span className="font-bold text-brand-950 dark:text-brand-50">
            <span className="text-amber-700 dark:text-amber-400">8x#</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Xm$8</span>
            <span className="text-teal-700 dark:text-teal-300 font-bold">P!</span>
            <span className="text-rose-700 dark:text-rose-400">vQ2</span>
          </span>
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300">
            MAX
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          <span className="h-1.5 rounded-full bg-emerald-500" />
          <span className="h-1.5 rounded-full bg-emerald-500" />
          <span className="h-1.5 rounded-full bg-emerald-500" />
          <span className="h-1.5 rounded-full bg-emerald-500" />
          <span className="h-1.5 rounded-full bg-emerald-500" />
          <span className="h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>
    );
  }

  if (kind === "strength") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/[0.09] dark:border-emerald-500/25 dark:bg-emerald-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            ZXCVBN ENTROPY
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            SCORE 100/100
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-white/80 px-3 py-1 shadow-sm dark:bg-emerald-950/60">
          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300">
            128.6 BITS
          </span>
          <span className="font-mono text-[10px] font-bold text-emerald-800/80 dark:text-emerald-200/80">
            3.2e+12 YEARS
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
          <span>CRACK RESISTANCE</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">UNBREAKABLE</span>
        </div>
      </div>
    );
  }

  if (kind === "qr") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/[0.09] dark:border-cyan-500/25 dark:bg-cyan-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
            VECTOR MATRIX
          </span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">
            1000px HD
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-white/80 px-2.5 py-1 shadow-sm dark:bg-cyan-950/60">
          <div className="grid size-6 shrink-0 grid-cols-3 gap-0.5 rounded border border-cyan-500/30 bg-cyan-50 p-0.5 dark:bg-brand-900">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={cn("rounded-[0.5px]", [0, 2, 4, 6, 8].includes(i) ? "bg-cyan-800 dark:bg-cyan-300" : "bg-transparent")} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-cyan-500/25 bg-cyan-50 px-1.5 py-0.5 font-mono text-[9px] font-black text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">SVG</span>
            <span className="rounded border border-cyan-500/25 bg-cyan-50 px-1.5 py-0.5 font-mono text-[9px] font-black text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">PNG</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-cyan-700/80 dark:text-cyan-300/80">
          <span>HIGH DENSITY</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">LOSSLESS</span>
        </div>
      </div>
    );
  }

  if (kind === "qr-reader") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/[0.09] dark:border-cyan-500/25 dark:bg-cyan-950/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
            <span className="size-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
            CAMERA SCANNER
          </span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">
            LENS ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-white/80 px-2.5 py-1 shadow-sm dark:bg-cyan-950/60">
          <span className="font-mono text-[11px] font-bold text-cyan-950 truncate dark:text-cyan-100">
            https://sfrankey.dev
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-cyan-700/80 dark:text-cyan-300/80">
          <span>INSTANT OCR</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">PARSED 100%</span>
        </div>
      </div>
    );
  }

  if (kind === "base64") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-lime-500/20 bg-lime-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-lime-500/40 group-hover:bg-lime-500/[0.09] dark:border-lime-500/25 dark:bg-lime-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-800 dark:text-lime-300">
            CODEC STREAM
          </span>
          <span className="rounded-full bg-lime-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-lime-800 dark:bg-lime-900/50 dark:text-lime-300">
            UTF-8 ⇄ B64
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-lime-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-lime-950/60">
          <span className="font-bold text-brand-950 dark:text-brand-50 truncate">SFranKey</span>
          <span className="text-lime-600 dark:text-lime-400 px-1">➔</span>
          <span className="font-bold text-lime-700 dark:text-lime-300 truncate">U0ZyYW5LZXk=</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-lime-700/80 dark:text-lime-300/80">
          <span>RFC 4648</span>
          <span className="text-lime-600 dark:text-lime-400 font-extrabold">URL-SAFE</span>
        </div>
      </div>
    );
  }

  if (kind === "hash") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-lime-500/20 bg-lime-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-lime-500/40 group-hover:bg-lime-500/[0.09] dark:border-lime-500/25 dark:bg-lime-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-800 dark:text-lime-300">
            CRYPTOGRAPHIC HASH
          </span>
          <span className="rounded-full bg-lime-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-lime-800 dark:bg-lime-900/50 dark:text-lime-300">
            SHA-256
          </span>
        </div>
        <div className="rounded-xl border border-lime-500/20 bg-white/80 px-3 py-1 font-mono text-[11px] text-lime-950 shadow-sm dark:bg-lime-950/60 dark:text-lime-200">
          <span className="text-lime-700 dark:text-lime-400 font-extrabold">✓ e3b0c442</span> 98fc1c14...
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-lime-700/80 dark:text-lime-300/80">
          <span>INTEGRITY CHECK</span>
          <span className="text-lime-600 dark:text-lime-400 font-extrabold">MATCH 100%</span>
        </div>
      </div>
    );
  }

  if (kind === "file-checksum") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-lime-500/20 bg-lime-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-lime-500/40 group-hover:bg-lime-500/[0.09] dark:border-lime-500/25 dark:bg-lime-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-800 dark:text-lime-300">
            FILE DIGEST
          </span>
          <span className="rounded-full bg-lime-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-lime-800 dark:bg-lime-900/50 dark:text-lime-300">
            42 MB
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-lime-500/20 bg-white/80 px-3 py-1 font-mono text-xs shadow-sm dark:bg-lime-950/60">
          <span className="truncate text-brand-950 dark:text-brand-50">📦 release.tar.gz</span>
          <span className="font-black text-lime-600 dark:text-lime-400">MATCH ✓</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-lime-700/80 dark:text-lime-300/80">
          <span>BINARY HASH</span>
          <span className="text-lime-600 dark:text-lime-400 font-extrabold">SHA-256 VERIFIED</span>
        </div>
      </div>
    );
  }

  if (kind === "jwt") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-violet-500/40 group-hover:bg-violet-500/[0.09] dark:border-violet-500/25 dark:bg-violet-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300">
            TOKEN INSPECTOR
          </span>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
            HS256
          </span>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-white/80 px-2.5 py-1 font-mono text-[11px] shadow-sm truncate dark:bg-violet-950/60">
          <span className="font-bold text-rose-600 dark:text-rose-400">eyJhbGci...</span>
          <span className="text-violet-400 font-black">.</span>
          <span className="font-bold text-violet-700 dark:text-violet-300">eyJzdWIi...</span>
          <span className="text-violet-400 font-black">.</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">SflKxwR...</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-violet-700/80 dark:text-violet-300/80">
          <span>HEADER · PAYLOAD · SIGNATURE</span>
          <span className="text-violet-600 dark:text-violet-400 font-extrabold">VALID</span>
        </div>
      </div>
    );
  }

  if (kind === "code") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-violet-500/40 group-hover:bg-violet-500/[0.09] dark:border-violet-500/25 dark:bg-violet-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-[9px] font-black text-violet-800 bg-violet-500/15 px-2 py-0.5 rounded-full dark:bg-violet-900/50 dark:text-violet-300">
            VALID JSON ✓
          </span>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-white/80 px-3 py-1 font-mono text-[11px] text-violet-950 shadow-sm dark:bg-violet-950/60 dark:text-violet-200">
          <span className="text-violet-700 dark:text-violet-400 font-bold">{`{ `}</span>
          <span className="text-brand-900 dark:text-brand-100">&quot;safe&quot;: </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">true</span>
          <span className="text-brand-900 dark:text-brand-100">, &quot;speed&quot;: </span>
          <span className="text-teal-700 dark:text-teal-400 font-bold">&quot;0ms&quot;</span>
          <span className="text-violet-700 dark:text-violet-400 font-bold">{` }`}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-violet-700/80 dark:text-violet-300/80">
          <span>PARSER TREE</span>
          <span className="text-violet-600 dark:text-violet-400 font-extrabold">CLEAN FORMAT</span>
        </div>
      </div>
    );
  }

  if (kind === "uuid") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-violet-500/40 group-hover:bg-violet-500/[0.09] dark:border-violet-500/25 dark:bg-violet-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300">
            RFC 4122 v4
          </span>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
            CSPRNG
          </span>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-violet-950 shadow-sm truncate dark:bg-violet-950/60 dark:text-violet-100">
          4f7d2b8c-9a1e-4c7b-8d3f-e1a2b3c4
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-violet-700/80 dark:text-violet-300/80">
          <span>RANDOM BITS: 122</span>
          <span className="text-violet-600 dark:text-violet-400 font-extrabold">COLLISION: 0%</span>
        </div>
      </div>
    );
  }

  if (kind === "timestamp") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-violet-500/40 group-hover:bg-violet-500/[0.09] dark:border-violet-500/25 dark:bg-violet-950/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300">
            <Clock3 size={12} className="text-violet-600 dark:text-violet-400" />
            EPOCH CONVERTER
          </span>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
            UTC / LOCAL
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-violet-950/60">
          <span className="font-bold text-violet-700 dark:text-violet-400">1724502000</span>
          <span className="text-brand-400">➔</span>
          <span className="font-semibold text-brand-950 dark:text-brand-50">2026-08-24</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-violet-700/80 dark:text-violet-300/80">
          <span>MILLISECONDS / SECONDS</span>
          <span className="text-violet-600 dark:text-violet-400 font-extrabold">ISO-8601</span>
        </div>
      </div>
    );
  }

  if (kind === "ip") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            <span className="size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)] animate-pulse" />
            PUBLIC IP HUD
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
            IPv4 / IPv6
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="font-bold text-sky-950 dark:text-sky-100">103.142.122.45</span>
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">🇻🇳 VN</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>AS135905 · VIETTEL</span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold">CONNECTED</span>
        </div>
      </div>
    );
  }

  if (kind === "ip-lookup") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            GEOIP INTEL
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
            BGP ASN
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="font-bold text-sky-950 dark:text-sky-100 truncate">8.8.8.8</span>
          <span className="text-[10px] text-sky-700 dark:text-sky-300 truncate">🇺🇸 Google DNS</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>REVERSE DNS: READY</span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold">ACCURATE</span>
        </div>
      </div>
    );
  }

  if (kind === "vpn-proxy") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            PRIVACY SIGNALS
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            CLEAN ✓
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] font-bold">
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-sky-950 dark:bg-sky-950/60 dark:text-sky-200">VPN: NO</span>
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-sky-950 dark:bg-sky-950/60 dark:text-sky-200">PROXY: NO</span>
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-sky-950 dark:bg-sky-950/60 dark:text-sky-200">TOR: NO</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>NETWORK TYPE</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">RESIDENTIAL</span>
        </div>
      </div>
    );
  }

  if (kind === "ip-leak") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            LEAK DETECTION
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            0 LEAKS
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">WebRTC: OK</span>
          <span className="text-brand-400">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">DNS: MATCH</span>
          <span className="text-brand-400">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">IP: SAFE</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>SECURE TUNNEL</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">PASS 100%</span>
        </div>
      </div>
    );
  }

  if (kind === "dns-leak") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            DNS RESOLVER PROBE
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
            2 SERVERS
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="font-bold text-sky-950 dark:text-sky-100">1.1.1.1 · 1.0.0.1</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">ENCRYPTED</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>NO ISP FALLBACK</span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold">DoH ACTIVE</span>
        </div>
      </div>
    );
  }

  if (kind === "webrtc") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            ICE CANDIDATES
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            STUN OK
          </span>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm truncate dark:bg-sky-950/60">
          <span className="text-sky-700 dark:text-sky-400 font-bold">Local IP: </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Shielded (mDNS)</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>PEER CONNECTION</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">NO LOCAL LEAK</span>
        </div>
      </div>
    );
  }

  if (kind === "dns") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            DNS RECORDS
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
            NOERROR
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-[11px] shadow-sm dark:bg-sky-950/60">
          <span className="font-bold text-sky-950 dark:text-sky-100">A: 104.21.32.1</span>
          <span className="text-sky-700 dark:text-sky-400">MX: mail.spf</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>TTL: 300s</span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold">0ms CACHED</span>
        </div>
      </div>
    );
  }

  if (kind === "ssl") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            SSL / TLS CERTIFICATE
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            TLS 1.3
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Valid: 82 Days</span>
          <span className="text-[10px] text-sky-950 dark:text-sky-200">ECC 256-bit</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>HOSTNAME MATCH</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">TRUSTED CA</span>
        </div>
      </div>
    );
  }

  if (kind === "redirect") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            HTTP REDIRECT CHAIN
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
            2 HOPS
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-white/80 px-2.5 py-1 font-mono text-xs shadow-sm dark:bg-sky-950/60">
          <span className="text-amber-600 dark:text-amber-400 font-bold">301</span>
          <span className="text-brand-400">➔</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">302</span>
          <span className="text-brand-400">➔</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">200 OK</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>LATENCY: 42ms</span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold">GUARDED</span>
        </div>
      </div>
    );
  }

  if (kind === "headers") {
    return (
      <div className="flex h-[96px] w-full flex-col justify-between rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-3 shadow-sm transition-all duration-300 group-hover:border-sky-500/40 group-hover:bg-sky-500/[0.09] dark:border-sky-500/25 dark:bg-sky-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
            SECURITY HEADERS
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            GRADE A+
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] font-bold">
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-emerald-700 dark:bg-sky-950/60 dark:text-emerald-300">HSTS ✓</span>
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-emerald-700 dark:bg-sky-950/60 dark:text-emerald-300">CSP ✓</span>
          <span className="rounded-lg border border-sky-500/20 bg-white/80 py-1 text-emerald-700 dark:bg-sky-950/60 dark:text-emerald-300">DENY ✓</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
          <span>OWASP COMPLIANT</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">HARDENED</span>
        </div>
      </div>
    );
  }

  return null;
}

export function ToolCard({ tool, locale, variant = "standard", previewKind, href, favorite = false, onFavoriteChange, className, privacyLabel, categoryLabel, favoriteLabel = "Add to favorites", unfavoriteLabel = "Remove from favorites", relationLabel, openLabel = "Open tool" }: ToolCardProps) {
  const tone = categoryTone[tool.category];
  const kind = previewKind ?? previewByTool[tool.id];
  const isShowcase = variant === "showcase";
  const isCompact = variant === "compact";
  const cardClass = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-[26px] border-2 border-[var(--border-card)] bg-gradient-to-b from-[var(--surface-card)] via-[var(--surface-card)] to-[var(--surface-card-tinted)] p-6 shadow-soft transition-all duration-300 ease-out hover:-translate-y-2 hover:border-brand-400 hover:shadow-[0_20px_45px_-10px_rgba(20,184,166,0.22)]",
    tone.glow,
    isShowcase && "rounded-[var(--radius-2xl)] border-brand-300/25 bg-gradient-to-br p-6 shadow-featured sm:p-7",
    isCompact && "min-h-[84px] rounded-2xl p-3 border",
    className
  );
  const content = isCompact ? (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl shadow-xs ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10", tone.icon)}>
          <ToolIcon iconKey={tool.iconKey} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("truncate text-[10px] font-bold uppercase tracking-[.13em]", tone.text)}>{categoryLabel}</span>
            {relationLabel ? (
              <span className="shrink-0 rounded-full border border-brand-200/60 bg-brand-50/70 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:border-brand-800/60 dark:bg-brand-900/50 dark:text-brand-300">
                {relationLabel}
              </span>
            ) : null}
          </div>
          <h3 className="truncate text-sm font-bold text-brand-950 transition-colors duration-200 group-hover:text-brand-600 dark:text-brand-50 dark:group-hover:text-brand-300">
            {tool.title[locale]}
          </h3>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {onFavoriteChange ? (
          <button
            type="button"
            aria-label={favorite ? unfavoriteLabel : favoriteLabel}
            aria-pressed={favorite}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onFavoriteChange(tool.id);
            }}
            className={cn(
              "grid size-8 place-items-center rounded-full transition-all duration-200 hover:scale-115 active:scale-90",
              favorite
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 shadow-xs"
                : "text-brand-300 hover:bg-rose-50/60 hover:text-rose-500 dark:text-brand-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            )}
          >
            <Heart size={15} fill={favorite ? "currentColor" : "none"} className={favorite ? "animate-pulse" : ""} />
          </button>
        ) : null}
        <div className="grid size-7 place-items-center rounded-full bg-brand-500/5 text-brand-600 transition-all duration-200 group-hover:bg-brand-500 group-hover:text-brand-950 group-hover:translate-x-0.5 dark:bg-brand-400/10 dark:text-brand-300 dark:group-hover:bg-brand-400">
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  ) : (
    <>
      {/* Top light reflection */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      
      <div className="flex items-start justify-between gap-2.5">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 dark:ring-white/10", tone.icon)}>
          <ToolIcon iconKey={tool.iconKey} size={isShowcase ? 24 : 22} />
        </span>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full border border-brand-200/60 bg-brand-50/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800/80 shadow-xs dark:border-brand-800/60 dark:bg-brand-950/60 dark:text-brand-200/80">
            <span className={cn("size-1.5 rounded-full", tool.privacyMode === "network-required" ? "bg-sky-500" : "bg-emerald-500")} />
            {privacyLabel}
          </span>
          {onFavoriteChange ? (
            <button
              type="button"
              aria-label={favorite ? unfavoriteLabel : favoriteLabel}
              aria-pressed={favorite}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onFavoriteChange(tool.id);
              }}
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90",
                favorite
                  ? "bg-rose-50 text-rose-500 shadow-2xs dark:bg-rose-950/60 dark:text-rose-400"
                  : "text-brand-400 hover:bg-rose-50/80 hover:text-rose-500 dark:text-brand-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 opacity-60 hover:opacity-100"
              )}
            >
              <Heart size={14} fill={favorite ? "currentColor" : "none"} className={favorite ? "animate-pulse" : ""} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={cn("text-[10px] font-black uppercase tracking-[.16em]", tone.text)}>
            {categoryLabel}
            {relationLabel && relationLabel !== categoryLabel ? <span className="ml-1.5 font-semibold text-brand-700/50 dark:text-brand-200/50">· {relationLabel}</span> : null}
          </span>
          <h3 className={cn("mt-1 font-black tracking-tight text-brand-950 transition-colors duration-200 group-hover:text-brand-600 dark:text-brand-50 dark:group-hover:text-brand-300", isShowcase ? "text-2xl" : "text-lg")}>
            {tool.title[locale]}
          </h3>
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-brand-950 group-hover:scale-110 dark:bg-brand-400/10 dark:text-brand-300 dark:group-hover:bg-brand-400">
          <ArrowUpRight aria-hidden="true" size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      <p className={cn("mt-2 h-12 text-sm leading-6 text-brand-900/65 dark:text-brand-100/65 line-clamp-2", isShowcase && "h-auto")}>
        {tool.description[locale]}
      </p>

      {kind ? (
        <div className="mt-4" data-preview-kind={kind} aria-hidden="true">
          <MiniPreview kind={kind} />
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition-colors duration-200 group-hover:text-brand-500 dark:text-brand-300">
          {openLabel}
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </>
  );
  return (
    <article className={cardClass}>
      {isCompact ? (
        <a href={href} className="flex min-h-[58px] items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2">
          {content}
        </a>
      ) : (
        <a href={href} className="flex min-h-full flex-1 flex-col rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2">
          {content}
        </a>
      )}
    </article>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-card)] bg-white/80 px-3.5 text-sm text-brand-950 outline-none transition-[border-color,box-shadow,background-color] duration-fast placeholder:text-brand-700/45 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-400/15 dark:bg-brand-950/70 dark:text-brand-50 dark:placeholder:text-brand-200/40", className)} {...props} />; }
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn("min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--border-card)] bg-white/80 p-3.5 text-sm leading-6 text-brand-950 outline-none transition-[border-color,box-shadow,background-color] duration-fast placeholder:text-brand-700/45 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-400/15 dark:bg-brand-950/70 dark:text-brand-50 dark:placeholder:text-brand-200/40", className)} {...props} />);
Textarea.displayName = "Textarea";
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) { return <label className={cn("mb-2 block text-sm font-semibold text-brand-950 dark:text-brand-100", className)} {...props} />; }
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn("min-h-11 rounded-[var(--radius-md)] border border-[var(--border-card)] bg-white/80 px-3.5 text-sm text-brand-950 outline-none transition-[border-color,box-shadow] duration-fast focus:border-brand-500 focus:ring-4 focus:ring-brand-400/15 dark:bg-brand-950/70 dark:text-brand-50", className)} {...props} />; }
export function PasswordInput({ visible = false, onVisibilityChange, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { visible?: boolean; onVisibilityChange?: (visible: boolean) => void }) { return <div className="relative"><Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} /><IconButton label={visible ? "Hide value" : "Show value"} className="absolute right-1 top-1 size-9" onClick={() => onVisibilityChange?.(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</IconButton></div>; }

export function Checkbox({ className, ...props }: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) { return <CheckboxPrimitive.Root className={cn("grid size-5 place-items-center rounded-md border border-brand-300 bg-white transition-colors data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 dark:border-brand-700 dark:bg-brand-950", className)} {...props}><CheckboxPrimitive.Indicator className="text-white"><Check size={14} strokeWidth={3} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>; }
export function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) { return <SwitchPrimitive.Root className={cn("relative h-6 w-11 rounded-full bg-brand-200 outline-none transition-colors data-[state=checked]:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-400 dark:bg-brand-800 dark:data-[state=checked]:bg-brand-300", className)} {...props}><SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px] dark:bg-brand-950" /></SwitchPrimitive.Root>; }
export function Slider({ className, ...props }: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) { return <SliderPrimitive.Root className={cn("relative flex h-6 w-full touch-none select-none items-center", className)} {...props}><SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900"><SliderPrimitive.Range className="absolute h-full bg-brand-600 dark:bg-brand-300" /></SliderPrimitive.Track><SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-brand-600 bg-white shadow-md outline-none focus-visible:ring-4 focus-visible:ring-brand-400/20 dark:border-brand-300 dark:bg-brand-950" /></SliderPrimitive.Root>; }

export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn("inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-card)] bg-brand-50/70 p-1 dark:bg-brand-950/60", className)} {...props} />);
TabsList.displayName = TabsPrimitive.List.displayName;
export const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn("min-h-9 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-brand-700 transition data-[state=active]:bg-white data-[state=active]:text-brand-950 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-200 dark:data-[state=active]:bg-brand-900 dark:data-[state=active]:text-brand-50", className)} {...props} />);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
export const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400", className)} {...props} />);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-brand-950/65 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in", className)} {...props} />);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
export const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { closeLabel?: string; showClose?: boolean }>(({ className, children, closeLabel = "Close", showClose = true, ...props }, ref) => <DialogPortal><DialogOverlay /><DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-dialog)] p-5 text-brand-950 shadow-dialog outline-none data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in dark:text-brand-50", className)} {...props}>{children}{showClose ? <DialogPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-brand-700/70 transition hover:bg-brand-100 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-200/70 dark:hover:bg-brand-900 dark:hover:text-brand-50"><X size={17} /><span className="sr-only">{closeLabel}</span></DialogPrimitive.Close> : null}</DialogPrimitive.Content></DialogPortal>);
DialogContent.displayName = DialogPrimitive.Content.displayName;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export * from "./confirm-dialog";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(({ className, sideOffset = 8, ...props }, ref) => <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 min-w-40 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-dialog)] p-1.5 text-brand-950 shadow-dialog dark:text-brand-50", className)} {...props} /></DropdownMenuPrimitive.Portal>);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
export const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(({ className, ...props }, ref) => <DropdownMenuPrimitive.Item ref={ref} className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm outline-none transition-colors focus:bg-brand-100 dark:focus:bg-brand-900", className)} {...props} />);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(({ className, sideOffset = 6, ...props }, ref) => <TooltipPrimitive.Portal><TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 rounded-md bg-brand-950 px-2.5 py-1.5 text-xs text-white shadow-dialog dark:bg-brand-50 dark:text-brand-950", className)} {...props} /></TooltipPrimitive.Portal>);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export const Drawer = Dialog;
export const DrawerTrigger = DialogTrigger;
export const DrawerClose = DialogClose;
export function DrawerContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogContent>) { return <DialogContent showClose={false} className={cn("left-auto right-0 top-0 h-full max-h-none w-[min(90vw,27rem)] translate-x-0 translate-y-0 rounded-none rounded-l-[var(--radius-xl)] data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in", className)} {...props}>{children}</DialogContent>; }

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>>(({ className, ...props }, ref) => <ToastPrimitive.Viewport ref={ref} className={cn("fixed bottom-5 right-5 z-[120] flex w-auto max-w-[calc(100vw-2.5rem)] sm:max-w-sm flex-col gap-2.5 outline-none pointer-events-none", className)} {...props} />);
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;
export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>>(({ className, ...props }, ref) => <ToastPrimitive.Root ref={ref} className={cn("pointer-events-auto group relative flex w-auto min-w-[200px] items-center justify-between gap-3 overflow-hidden rounded-2xl border border-emerald-500/25 bg-white/95 px-4 py-3 text-sm text-brand-950 shadow-[0_12px_36px_rgba(26,105,71,0.18)] backdrop-blur-2xl data-[state=closed]:animate-toast-out data-[state=open]:animate-toast-in dark:border-emerald-500/20 dark:bg-[#07241a]/95 dark:text-brand-50 dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]", className)} {...props} />);
Toast.displayName = ToastPrimitive.Root.displayName;
export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;
export const ToastClose = ToastPrimitive.Close;
export const ToastAction = ToastPrimitive.Action;

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) { return <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-brand-200/80 bg-brand-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-brand-800 dark:border-brand-700 dark:bg-brand-900/70 dark:text-brand-100", className)}>{children}</span>; }
export function PrivacyBadge({ label = "On-device", mode = "on-device" }: { label?: string; mode?: ToolDefinition["privacyMode"] }) { const networkRequired = mode === "network-required"; return <Badge className={networkRequired ? "border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"}><span className={cn("size-1.5 rounded-full", networkRequired ? "bg-sky-500" : "bg-emerald-500")} />{label}</Badge>; }
export function StatusBadge({ status, children }: { status: "success" | "warning" | "danger" | "info"; children: React.ReactNode }) { const classes = { success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200", warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200", danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200", info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200" }; return <Badge className={classes[status]}>{children}</Badge>; }
export function Progress({ value, className }: { value: number; className?: string }) { return <div className={cn("h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, value))}><div className="h-full origin-left rounded-full bg-brand-500 transition-transform duration-normal dark:bg-brand-300" style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }} /></div>; }
export function StrengthMeter({ score, label }: { score: number; label?: string }) { return <div className="grid gap-2" aria-label={label}><div className="grid grid-cols-5 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score}>{[0, 1, 2, 3, 4].map((item) => <span key={item} className={cn("h-2 rounded-full transition-colors duration-normal", item <= score ? score < 2 ? "bg-rose-500" : score < 4 ? "bg-amber-500" : "bg-emerald-500" : "bg-brand-100 dark:bg-brand-900")} />)}</div></div>; }
export function Skeleton({ className }: { className?: string }) { return <span className={cn("block animate-pulse rounded-md bg-brand-100 dark:bg-brand-900", className)} aria-hidden="true" />; }
export function EmptyState({ icon = <Sparkles size={21} />, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) { return <div className={cn("grid place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-card)] bg-[var(--surface-section-soft)] p-8 text-center dark:bg-brand-950/40", className)}><span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">{icon}</span><h3 className="mt-4 font-bold text-brand-950 dark:text-brand-50">{title}</h3>{description ? <p className="mt-1 max-w-sm text-sm leading-6 text-brand-800/65 dark:text-brand-200/65">{description}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div>; }
export type DiagnosticPanelProps = { status: "valid" | "error" | "warning"; title: string; message: string; line?: number; column?: number; offset?: number; onJumpToError?: () => void; jumpLabel?: string };
export function DiagnosticPanel({ status, title, message, line, column, offset, onJumpToError, jumpLabel = "Go to error" }: DiagnosticPanelProps) { const tone = status === "valid" ? "border-emerald-300/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:text-emerald-100" : status === "warning" ? "border-amber-300/70 bg-amber-50/70 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100" : "border-rose-300/70 bg-rose-50/70 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/30 dark:text-rose-100"; return <div className={cn("rounded-2xl border p-4", tone)} role={status === "error" ? "alert" : "status"}><p className="font-semibold">{title}</p><p className="mt-1 text-sm">{message}</p>{line !== undefined || column !== undefined || offset !== undefined ? <p className="mt-2 text-xs opacity-80">{line !== undefined && column !== undefined ? `${line}:${column}` : ""}{offset !== undefined ? ` · offset ${offset}` : ""}</p> : null}{onJumpToError ? <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onJumpToError}>{jumpLabel}</Button> : null}</div>; }
export function CopyButton({ value, label = "Copy", copiedLabel = "Copied", onCopied }: { value: string; label?: string; copiedLabel?: string; onCopied?: () => void }) { const [copied, setCopied] = React.useState(false); return <Button type="button" variant="secondary" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); onCopied?.(); window.setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } }}>{copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}{copied ? copiedLabel : label}</Button>; }

export type WorkspaceStatus = "idle" | "working" | "success" | "warning";
export type WorkspaceShellProps = { tool: ToolDefinition; locale: Locale; status?: WorkspaceStatus; statusLabel?: string; resetLabel?: string; onReset?: () => void; children: React.ReactNode };
export function WorkspaceShell({ tool, locale, status = "idle", statusLabel = "Processed locally", resetLabel = "Reset", onReset, children }: WorkspaceShellProps) {
  const tone = categoryTone[tool.category];
  const statusClass = status === "working" ? "text-amber-700 dark:text-amber-300" : status === "warning" ? "text-amber-700 dark:text-amber-300" : status === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-brand-700 dark:text-brand-300";
  return <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-card)] bg-[var(--surface-workspace)] shadow-card" data-workspace-shell={tool.id}><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone.icon)}><ToolIcon iconKey={tool.iconKey} size={19} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-brand-950 dark:text-brand-50">{tool.title[locale]}</p><p className={cn("mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.13em]", statusClass)}><span className="size-1.5 rounded-full bg-current" />{statusLabel}</p></div></div>{onReset ? <Button type="button" variant="ghost" size="sm" onClick={onReset}>{resetLabel}</Button> : null}</div><div className="p-4 sm:p-6">{children}</div></section>;
}

export type InfoCardTone = "amber" | "emerald" | "sky" | "violet" | "rose";

type InfoCardToneConfig = {
  border: string;
  glow: string;
  gradient: string;
  topRim: string;
  pill: string;
  iconBg: string;
  arc: string;
};

const infoCardTones: Record<InfoCardTone, InfoCardToneConfig> = {
  amber: {
    border: "border-amber-200/70 hover:border-amber-400 dark:border-amber-800/40 dark:hover:border-amber-400",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(245,158,11,0.28)]",
    gradient: "bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-brand-950 dark:to-amber-950/10",
    topRim: "via-amber-400",
    pill: "border-amber-200/80 bg-white/95 text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200",
    iconBg: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    arc: "border-amber-400/70 dark:border-amber-400/50"
  },
  emerald: {
    border: "border-emerald-200/70 hover:border-emerald-400 dark:border-emerald-800/40 dark:hover:border-emerald-400",
    glow: "shadow-[0_4px_20px_rgba(16,185,129,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(16,185,129,0.28)]",
    gradient: "bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-brand-950 dark:to-emerald-950/10",
    topRim: "via-emerald-400",
    pill: "border-emerald-200/80 bg-white/95 text-emerald-900 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-950/90 dark:text-emerald-200",
    iconBg: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
    arc: "border-emerald-400/70 dark:border-emerald-400/50"
  },
  sky: {
    border: "border-sky-200/70 hover:border-sky-400 dark:border-sky-800/40 dark:hover:border-sky-400",
    glow: "shadow-[0_4px_20px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(14,165,233,0.28)]",
    gradient: "bg-gradient-to-b from-sky-50/50 via-white to-sky-50/20 dark:from-sky-950/20 dark:via-brand-950 dark:to-sky-950/10",
    topRim: "via-sky-400",
    pill: "border-sky-200/80 bg-white/95 text-sky-900 shadow-sm dark:border-sky-700/60 dark:bg-sky-950/90 dark:text-sky-200",
    iconBg: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
    arc: "border-sky-400/70 dark:border-sky-400/50"
  },
  violet: {
    border: "border-violet-200/70 hover:border-violet-400 dark:border-violet-800/40 dark:hover:border-violet-400",
    glow: "shadow-[0_4px_20px_rgba(139,92,246,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(139,92,246,0.28)]",
    gradient: "bg-gradient-to-b from-violet-50/50 via-white to-violet-50/20 dark:from-violet-950/20 dark:via-brand-950 dark:to-violet-950/10",
    topRim: "via-violet-400",
    pill: "border-violet-200/80 bg-white/95 text-violet-900 shadow-sm dark:border-violet-700/60 dark:bg-violet-950/90 dark:text-violet-200",
    iconBg: "bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300",
    arc: "border-violet-400/70 dark:border-violet-400/50"
  },
  rose: {
    border: "border-rose-200/70 hover:border-rose-400 dark:border-rose-800/40 dark:hover:border-rose-400",
    glow: "shadow-[0_4px_20px_rgba(244,63,94,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(244,63,94,0.28)]",
    gradient: "bg-gradient-to-b from-rose-50/50 via-white to-rose-50/20 dark:from-rose-950/20 dark:via-brand-950 dark:to-rose-950/10",
    topRim: "via-rose-400",
    pill: "border-rose-200/80 bg-white/95 text-rose-900 shadow-sm dark:border-rose-700/60 dark:bg-rose-950/90 dark:text-rose-200",
    iconBg: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
    arc: "border-rose-400/70 dark:border-rose-400/50"
  }
};

export type InfoCardProps = {
  tone?: InfoCardTone;
  icon?: React.ReactNode;
  title: string;
  badge?: string;
  description: React.ReactNode;
  className?: string;
};

export function InfoCard({ tone = "sky", icon, title, badge, description, className }: InfoCardProps) {
  const config = infoCardTones[tone];
  return (
    <div className={cn("group relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2 sm:p-7", config.border, config.glow, config.gradient, className)}>
      {/* Top glowing rim - sweeps across on hover */}
      <div className={cn("pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 transition-all duration-500 ease-out group-hover:inset-x-4 group-hover:opacity-100", config.topRim)} aria-hidden="true" />
      
      {/* Header: Icon + Title & Pill Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon ? <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", config.iconBg)}>{icon}</span> : null}
          <h3 className="text-base font-black uppercase tracking-tight text-brand-950 dark:text-brand-50 sm:text-lg">{title}</h3>
        </div>
        {badge ? <span className={cn("shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:shadow-md", config.pill)}>{badge}</span> : null}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-4 flex-1 text-sm leading-relaxed text-brand-900/75 dark:text-brand-100/75">{description}</div>

      {/* Decorative circular arc: initially tucked in the corner, slides and floats inwards on hover */}
      <div className={cn("pointer-events-none absolute -bottom-16 -right-16 size-44 rounded-full border-2 opacity-30 transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-110 group-hover:opacity-90", config.arc)} aria-hidden="true" />
    </div>
  );
}

export {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Binary,
  Braces,
  Bug,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  CodeXml,
  Copy,
  Cpu,
  Database,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Fingerprint,
  Globe,
  Globe2,
  HardDrive,
  Hash,
  Heart,
  Info,
  KeyRound,
  Layers,
  Loader2,
  LockKeyhole,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Monitor,
  Moon,
  Network,
  PanelTop,
  QrCode,
  Radar,
  Radio,
  RadioTower,
  Route,
  ScanLine,
  ScanQrCode,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sliders,
  Sparkles,
  ServerCog,
  Sun,
  Target,
  Timer,
  X,
  Zap,
  ZapOff,
  type LucideIcon
};
