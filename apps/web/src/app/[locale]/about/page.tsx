import Link from "next/link";
import type { Metadata } from "next";
import type { Dictionary } from "@sfrankey/i18n";
import { getDictionary } from "@sfrankey/i18n";
import {
  categories,
  toolDefinitions,
  type Locale,
  type ToolCategory,
} from "@sfrankey/shared";
import {
  AlertTriangle,
  ArrowRight,
  Badge,
  BrandMark,
  Button,
  Card,
  Check,
  cn,
  Code2,
  Cpu,
  Eye,
  FileText,
  getCategoryTone,
  Globe,
  HardDrive,
  Layers,
  LockKeyhole,
  MessageSquare,
  QrCode,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  ToolIcon,
  Zap,
  ZapOff,
} from "@sfrankey/ui";
import { AboutHeroTerminal } from "@/components/marketing/about-hero-terminal";
import { AboutPrivacyFlow } from "@/components/marketing/about-privacy-flow";
import { AboutReveal } from "@/components/marketing/about-reveal";
import { localePath } from "@/lib/locale";

type AboutCopy = Dictionary["about"];

/* ── Icon & style maps for cards (Signature Bubble Arc Design) ──── */

const PROBLEM_ICONS = [Layers, ShieldAlert, ZapOff];
const PROBLEM_STYLES = [
  {
    bg: "bg-gradient-to-b from-rose-50/60 via-white to-rose-50/20 dark:from-rose-950/20 dark:via-brand-950 dark:to-rose-950/10",
    border:
      "border-rose-200/70 hover:border-rose-400 dark:border-rose-800/40 dark:hover:border-rose-400",
    glow: "shadow-[0_4px_20px_rgba(244,63,94,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(244,63,94,0.28)]",
    topRim: "via-rose-400",
    pill: "border-rose-200/80 bg-white/95 text-rose-900 shadow-xs dark:border-rose-700/60 dark:bg-rose-950/90 dark:text-rose-200",
    iconBg:
      "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
    arc: "border-rose-400/70 dark:border-rose-400/50",
  },
  {
    bg: "bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-brand-950 dark:to-amber-950/10",
    border:
      "border-amber-200/70 hover:border-amber-400 dark:border-amber-800/40 dark:hover:border-amber-400",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(245,158,11,0.28)]",
    topRim: "via-amber-400",
    pill: "border-amber-200/80 bg-white/95 text-amber-900 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200",
    iconBg:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    arc: "border-amber-400/70 dark:border-amber-400/50",
  },
  {
    bg: "bg-gradient-to-b from-teal-50/60 via-white to-teal-50/20 dark:from-teal-950/20 dark:via-brand-950 dark:to-teal-950/10",
    border:
      "border-teal-200/70 hover:border-teal-400 dark:border-teal-800/40 dark:hover:border-teal-400",
    glow: "shadow-[0_4px_20px_rgba(20,184,166,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(20,184,166,0.28)]",
    topRim: "via-teal-400",
    pill: "border-teal-200/80 bg-white/95 text-teal-900 shadow-xs dark:border-teal-700/60 dark:bg-teal-950/90 dark:text-teal-200",
    iconBg:
      "bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300",
    arc: "border-teal-400/70 dark:border-teal-400/50",
  },
];

const PRINCIPLE_CONFIGS = [
  {
    icon: HardDrive,
    bg: "bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-brand-950 dark:to-emerald-950/10",
    border:
      "border-emerald-200/70 hover:border-emerald-400 dark:border-emerald-800/40 dark:hover:border-emerald-400",
    glow: "shadow-[0_4px_20px_rgba(16,185,129,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(16,185,129,0.28)]",
    topRim: "via-emerald-400",
    pill: "border-emerald-200/80 bg-white/95 text-emerald-900 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/90 dark:text-emerald-200",
    iconBg:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
    arc: "border-emerald-400/70 dark:border-emerald-400/50",
    dot: "bg-emerald-500",
    badge: "RAM ONLY",
  },
  {
    icon: Eye,
    bg: "bg-gradient-to-b from-sky-50/60 via-white to-sky-50/20 dark:from-sky-950/20 dark:via-brand-950 dark:to-sky-950/10",
    border:
      "border-sky-200/70 hover:border-sky-400 dark:border-sky-800/40 dark:hover:border-sky-400",
    glow: "shadow-[0_4px_20px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(14,165,233,0.28)]",
    topRim: "via-sky-400",
    pill: "border-sky-200/80 bg-white/95 text-sky-900 shadow-xs dark:border-sky-700/60 dark:bg-sky-950/90 dark:text-sky-200",
    iconBg: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
    arc: "border-sky-400/70 dark:border-sky-400/50",
    dot: "bg-sky-500",
    badge: "NO TELEMETRY",
  },
  {
    icon: Zap,
    bg: "bg-gradient-to-b from-teal-50/60 via-white to-teal-50/20 dark:from-teal-950/20 dark:via-brand-950 dark:to-teal-950/10",
    border:
      "border-teal-200/70 hover:border-teal-400 dark:border-teal-800/40 dark:hover:border-teal-400",
    glow: "shadow-[0_4px_20px_rgba(20,184,166,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(20,184,166,0.28)]",
    topRim: "via-teal-400",
    pill: "border-teal-200/80 bg-white/95 text-teal-900 shadow-xs dark:border-teal-700/60 dark:bg-teal-950/90 dark:text-teal-200",
    iconBg:
      "bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300",
    arc: "border-teal-400/70 dark:border-teal-400/50",
    dot: "bg-teal-500",
    badge: "ZERO ACCOUNT",
  },
  {
    icon: Target,
    bg: "bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-brand-950 dark:to-amber-950/10",
    border:
      "border-amber-200/70 hover:border-amber-400 dark:border-amber-800/40 dark:hover:border-amber-400",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(245,158,11,0.28)]",
    topRim: "via-amber-400",
    pill: "border-amber-200/80 bg-white/95 text-amber-900 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200",
    iconBg:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    arc: "border-amber-400/70 dark:border-amber-400/50",
    dot: "bg-amber-500",
    badge: "HONEST CODE",
  },
];

const CAPABILITY_CONFIGS = [
  {
    icon: Code2,
    bg: "bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-brand-950 dark:to-emerald-950/10",
    border:
      "border-emerald-200/70 hover:border-emerald-400 dark:border-emerald-800/40 dark:hover:border-emerald-400",
    glow: "shadow-[0_4px_20px_rgba(16,185,129,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(16,185,129,0.28)]",
    topRim: "via-emerald-400",
    pill: "border-emerald-200/80 bg-white/95 text-emerald-900 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/90 dark:text-emerald-200",
    iconBg:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
    arc: "border-emerald-400/70 dark:border-emerald-400/50",
  },
  {
    icon: ShieldCheck,
    bg: "bg-gradient-to-b from-teal-50/60 via-white to-teal-50/20 dark:from-teal-950/20 dark:via-brand-950 dark:to-teal-950/10",
    border:
      "border-teal-200/70 hover:border-teal-400 dark:border-teal-800/40 dark:hover:border-teal-400",
    glow: "shadow-[0_4px_20px_rgba(20,184,166,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(20,184,166,0.28)]",
    topRim: "via-teal-400",
    pill: "border-teal-200/80 bg-white/95 text-teal-900 shadow-xs dark:border-teal-700/60 dark:bg-teal-950/90 dark:text-teal-200",
    iconBg:
      "bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300",
    arc: "border-teal-400/70 dark:border-teal-400/50",
  },
  {
    icon: Globe,
    bg: "bg-gradient-to-b from-sky-50/60 via-white to-sky-50/20 dark:from-sky-950/20 dark:via-brand-950 dark:to-sky-950/10",
    border:
      "border-sky-200/70 hover:border-sky-400 dark:border-sky-800/40 dark:hover:border-sky-400",
    glow: "shadow-[0_4px_20px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(14,165,233,0.28)]",
    topRim: "via-sky-400",
    pill: "border-sky-200/80 bg-white/95 text-sky-900 shadow-xs dark:border-sky-700/60 dark:bg-sky-950/90 dark:text-sky-200",
    iconBg: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
    arc: "border-sky-400/70 dark:border-sky-400/50",
  },
  {
    icon: Cpu,
    bg: "bg-gradient-to-b from-cyan-50/60 via-white to-cyan-50/20 dark:from-cyan-950/20 dark:via-brand-950 dark:to-cyan-950/10",
    border:
      "border-cyan-200/70 hover:border-cyan-400 dark:border-cyan-800/40 dark:hover:border-cyan-400",
    glow: "shadow-[0_4px_20px_rgba(6,182,212,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(6,182,212,0.28)]",
    topRim: "via-cyan-400",
    pill: "border-cyan-200/80 bg-white/95 text-cyan-900 shadow-xs dark:border-cyan-700/60 dark:bg-cyan-950/90 dark:text-cyan-200",
    iconBg:
      "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300",
    arc: "border-cyan-400/70 dark:border-cyan-400/50",
  },
];

const LIMIT_CONFIGS = [
  {
    bg: "bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-brand-950 dark:to-amber-950/10",
    border:
      "border-amber-200/70 hover:border-amber-400 dark:border-amber-800/40 dark:hover:border-amber-400",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(245,158,11,0.28)]",
    topRim: "via-amber-400",
    pill: "border-amber-200/80 bg-white/95 text-amber-900 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200",
    iconBg:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    arc: "border-amber-400/70 dark:border-amber-400/50",
  },
  {
    bg: "bg-gradient-to-b from-orange-50/60 via-white to-orange-50/20 dark:from-orange-950/20 dark:via-brand-950 dark:to-orange-950/10",
    border:
      "border-orange-200/70 hover:border-orange-400 dark:border-orange-800/40 dark:hover:border-orange-400",
    glow: "shadow-[0_4px_20px_rgba(249,115,22,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(249,115,22,0.28)]",
    topRim: "via-orange-400",
    pill: "border-orange-200/80 bg-white/95 text-orange-900 shadow-xs dark:border-orange-700/60 dark:bg-orange-950/90 dark:text-orange-200",
    iconBg:
      "bg-orange-500/15 text-orange-700 dark:bg-orange-400/20 dark:text-orange-300",
    arc: "border-orange-400/70 dark:border-orange-400/50",
  },
  {
    bg: "bg-gradient-to-b from-yellow-50/60 via-white to-yellow-50/20 dark:from-yellow-950/20 dark:via-brand-950 dark:to-yellow-950/10",
    border:
      "border-yellow-200/70 hover:border-yellow-400 dark:border-yellow-800/40 dark:hover:border-yellow-400",
    glow: "shadow-[0_4px_20px_rgba(234,179,8,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(234,179,8,0.28)]",
    topRim: "via-yellow-400",
    pill: "border-yellow-200/80 bg-white/95 text-yellow-900 shadow-xs dark:border-yellow-700/60 dark:bg-yellow-950/90 dark:text-yellow-200",
    iconBg:
      "bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300",
    arc: "border-yellow-400/70 dark:border-yellow-400/50",
  },
];

const categoryDescriptions: Record<ToolCategory, { vi: string; en: string }> = {
  "2fa": {
    vi: "Xác thực hai yếu tố, bảo mật mã OTP theo thời gian thực",
    en: "Two-factor authentication & real-time time-based OTP codes",
  },
  password: {
    vi: "Trình tạo mật khẩu ngẫu nhiên CSPRNG & phân tích độ mạnh",
    en: "CSPRNG random password generator & offline entropy audit",
  },
  qr: {
    vi: "Tạo & quét mã QR đa năng, trích xuất dữ liệu, xuất file SVG/PNG",
    en: "Vector QR generator & camera scanner with SVG/PNG exports",
  },
  encoding: {
    vi: "Mã hóa Base64, tính mã băm SHA/MD5 & xác thực toàn vẹn file",
    en: "Base64 codecs, SHA/MD5 cryptographic hashes & file digests",
  },
  developer: {
    vi: "Định dạng JSON, giải mã JWT, chuyển đổi UUID & tiện ích code",
    en: "JSON formatter, JWT decoder, UUID generator & developer suite",
  },
  network: {
    vi: "Chẩn đoán IP, ping, tra cứu DNS & kiểm tra kết nối mạng",
    en: "IP diagnostics, network ping, DNS lookup & connectivity checks",
  },
};

const categoryHoverStyles: Record<
  ToolCategory,
  {
    border: string;
    bg: string;
    text: string;
    badge: string;
    arrow: string;
    watermark: string;
    shadow: string;
  }
> = {
  "2fa": {
    border: "hover:border-teal-400/90 dark:hover:border-teal-500",
    bg: "hover:bg-teal-50/50 dark:hover:bg-teal-950/40",
    text: "group-hover:text-teal-700 dark:group-hover:text-teal-300",
    badge:
      "bg-teal-500/15 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    arrow:
      "group-hover:bg-teal-500 group-hover:text-white dark:group-hover:bg-teal-400 dark:group-hover:text-teal-950",
    watermark: "group-hover:text-teal-500/15 dark:group-hover:text-teal-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(20,184,166,0.16)]",
  },
  password: {
    border: "hover:border-emerald-400/90 dark:hover:border-emerald-500",
    bg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40",
    text: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
    badge:
      "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    arrow:
      "group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-400 dark:group-hover:text-emerald-950",
    watermark:
      "group-hover:text-emerald-500/15 dark:group-hover:text-emerald-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(16,185,129,0.16)]",
  },
  qr: {
    border: "hover:border-cyan-400/90 dark:hover:border-cyan-500",
    bg: "hover:bg-cyan-50/50 dark:hover:bg-cyan-950/40",
    text: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
    badge:
      "bg-cyan-500/15 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300",
    arrow:
      "group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:bg-cyan-400 dark:group-hover:text-cyan-950",
    watermark: "group-hover:text-cyan-500/15 dark:group-hover:text-cyan-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(6,182,212,0.16)]",
  },
  encoding: {
    border: "hover:border-lime-400/90 dark:hover:border-lime-500",
    bg: "hover:bg-lime-50/50 dark:hover:bg-lime-950/40",
    text: "group-hover:text-lime-800 dark:group-hover:text-lime-300",
    badge:
      "bg-lime-500/15 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300",
    arrow:
      "group-hover:bg-lime-500 group-hover:text-lime-950 dark:group-hover:bg-lime-400 dark:group-hover:text-lime-950",
    watermark: "group-hover:text-lime-500/15 dark:group-hover:text-lime-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(132,204,22,0.16)]",
  },
  developer: {
    border: "hover:border-violet-400/90 dark:hover:border-violet-500",
    bg: "hover:bg-violet-50/50 dark:hover:bg-violet-950/40",
    text: "group-hover:text-violet-700 dark:group-hover:text-violet-300",
    badge:
      "bg-violet-500/15 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
    arrow:
      "group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-400 dark:group-hover:text-violet-950",
    watermark:
      "group-hover:text-violet-500/15 dark:group-hover:text-violet-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(139,92,246,0.16)]",
  },
  network: {
    border: "hover:border-sky-400/90 dark:hover:border-sky-500",
    bg: "hover:bg-sky-50/50 dark:hover:bg-sky-950/40",
    text: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
    badge: "bg-sky-500/15 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    arrow:
      "group-hover:bg-sky-500 group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-sky-950",
    watermark: "group-hover:text-sky-500/15 dark:group-hover:text-sky-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(14,165,233,0.16)]",
  },
};

/* ── Metadata ───────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const about = getDictionary(locale).about;
  return {
    title: about.metaTitle,
    description: about.metaDescription,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { vi: "/vi/about", en: "/en/about", "x-default": "/vi/about" },
    },
    openGraph: {
      type: "website",
      title: about.metaTitle,
      description: about.metaDescription,
      url: `/${locale}/about`,
    },
  };
}

/* ── Page ────────────────────────────────────────────────────────── */

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const about = t.about;
  const categoryData = categories.map((category) => ({
    category,
    tools: toolDefinitions.filter((tool) => tool.category === category),
  }));
  const localTools = toolDefinitions.filter(
    (tool) => tool.privacyMode === "on-device",
  ).length;
  const networkTools = toolDefinitions.length - localTools;
  const trustLabels = [
    `${toolDefinitions.length} ${about.ecosystem.toolCount}`,
    `${categories.length} ${about.ecosystem.categoryCount}`,
    "VI · EN",
    locale === "vi"
      ? `${localTools} cục bộ · ${networkTools} cần mạng`
      : `${localTools} on-device · ${networkTools} network-required`,
  ];

  return (
    <main>
      {/* ─── Hero ─── */}
      <section className="relative isolate overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--surface-hero)] px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
        <div
          className="about-section-grid pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-32 top-12 size-[30rem] rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-[34rem] rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-400/10"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-[var(--radius-xl)] border border-brand-400/30 bg-[var(--surface-card)] text-brand-700 shadow-card dark:text-brand-300">
                <BrandMark className="size-11" />
              </span>
              <div>
                <Badge>{about.eyebrow}</Badge>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--ink-muted)]">
                  SFranKey · {t.brandDescriptor}
                </p>
              </div>
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-black tracking-[-.065em] text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              {about.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
              {about.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-2xl font-bold shadow-soft"
              >
                <Link href={localePath(locale, "tools")}>
                  {about.primaryCta} ({toolDefinitions.length})
                  <span aria-hidden="true">→</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-2xl font-bold"
              >
                <Link href={localePath(locale, "privacy")}>
                  {about.privacyCta}
                </Link>
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {trustLabels.map((label) => (
                <span
                  key={label}
                  className="about-trust-pill inline-flex min-h-9 items-center rounded-full border border-brand-400/35 bg-[var(--surface-card)] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-[var(--color-text)] shadow-soft"
                >
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>

          {/* Dedicated Live Security Architecture HUD (Zero Duplicate) */}
          <AboutHeroTerminal locale={locale} />
        </div>
      </section>

      {/* ─── Why SFranKey exists (Upgraded with Signature Bubble Arc Design) ─── */}
      <section
        className="bg-[var(--surface-section-soft)] px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="about-why-title"
      >
        <div className="mx-auto max-w-7xl">
          <AboutReveal className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-700 dark:text-brand-300">
              {about.why.eyebrow}
            </p>
            <h2
              id="about-why-title"
              className="mt-3 text-3xl font-black tracking-[-.04em] text-[var(--color-text)] sm:text-5xl"
            >
              {about.why.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">
              {about.why.description}
            </p>
          </AboutReveal>

          <AboutReveal stagger className="mt-10 grid gap-6 md:grid-cols-3">
            {about.why.problems.map((problem, index) => (
              <ProblemCard
                key={problem.title}
                problem={problem}
                index={index}
              />
            ))}
          </AboutReveal>

          <AboutReveal>
            <p className="mt-12 max-w-4xl text-2xl font-bold leading-tight tracking-[-.03em] text-[var(--color-text)] sm:text-4xl">
              {about.why.statement}
            </p>
          </AboutReveal>
        </div>
      </section>

      {/* ─── Manifesto (Upgraded with Signature Bubble Arc Design) ─── */}
      <section
        className="border-y border-[var(--border-subtle)] bg-[var(--surface-section-strong)] px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="about-manifesto-title"
      >
        <AboutReveal className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <Card className="relative overflow-hidden rounded-[32px] border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 shadow-raised sm:p-12 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:via-brand-950/80 dark:to-brand-950">
            <span
              className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                <Sparkles
                  size={13}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {about.manifesto.eyebrow}
              </span>

              <h2
                id="about-manifesto-title"
                className="mt-5 max-w-2xl text-3xl font-black tracking-[-.045em] text-[var(--color-text)] sm:text-5xl"
              >
                {about.manifesto.title}
              </h2>

              <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-[var(--color-text)]">
                {about.manifesto.body}
              </p>

              <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-[var(--ink-muted)]">
                <BrandMark className="size-10 shadow-sm" />
                <span>SFranKey · {t.brandDescriptor}</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {about.manifesto.principles.map((principle, index) => (
              <PrincipleCard
                key={principle.title}
                principle={principle}
                index={index}
              />
            ))}
          </div>
        </AboutReveal>
      </section>

      {/* ─── Data flow ─── */}
      <section
        className="relative overflow-hidden bg-[var(--surface-terminal)] px-4 py-16 text-white sm:px-6 sm:py-24"
        aria-labelledby="about-flow-title"
      >
        <div
          className="about-section-grid pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
            <AboutReveal>
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-800 dark:text-emerald-300">
                  {about.flow.eyebrow}
                </p>
                <h2
                  id="about-flow-title"
                  className="mt-3 text-3xl font-black tracking-[-.04em] text-brand-950 sm:text-5xl dark:text-white"
                >
                  {about.flow.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-brand-950/80 dark:text-white/75">
                  {about.flow.description}
                </p>
                <div className="mt-7 flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-bold text-emerald-950 shadow-2xs dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-200">
                    ✓ {about.flow.noUpload}
                  </span>
                  <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-bold text-emerald-950 shadow-2xs dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-200">
                    ✓ {about.flow.noSecretApi}
                  </span>
                </div>
              </div>
            </AboutReveal>

            <AboutPrivacyFlow copy={about.flow} compact />
          </div>
        </div>
      </section>

      {/* ─── Ecosystem (Synchronized with Homepage Category Rows) ─── */}
      <section
        className="bg-[var(--surface-section-soft)] px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="about-ecosystem-title"
      >
        <div className="mx-auto max-w-7xl">
          <AboutReveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-white/80 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/80 dark:text-emerald-200">
                <Sparkles
                  size={13}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {about.ecosystem.eyebrow}
              </span>
              <h2
                id="about-ecosystem-title"
                className="mt-3 text-3xl font-black tracking-[-.04em] text-[var(--color-text)] sm:text-5xl"
              >
                {about.ecosystem.title}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
                {about.ecosystem.description}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Metric
                value={toolDefinitions.length}
                label={about.ecosystem.toolCount}
              />
              <Metric
                value={categories.length}
                label={about.ecosystem.categoryCount}
              />
              <Metric value={2} label={about.ecosystem.languageCount} />
            </div>
          </AboutReveal>

          <AboutReveal stagger className="mt-10 grid gap-4 sm:grid-cols-2">
            {categoryData.map(({ category, tools }, index) => (
              <CategoryRowItem
                key={category}
                index={index}
                locale={locale}
                category={category}
                tools={tools}
              />
            ))}
          </AboutReveal>
        </div>
      </section>

      {/* ─── Technical (Upgraded with Signature Bubble Arc Design) ─── */}
      <section
        className="border-y border-[var(--border-subtle)] bg-[var(--surface-privacy)] px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="about-technical-title"
      >
        <div className="mx-auto max-w-7xl">
          <AboutReveal className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-700 dark:text-brand-300">
              {about.technical.eyebrow}
            </p>
            <h2
              id="about-technical-title"
              className="mt-3 text-3xl font-black tracking-[-.04em] text-[var(--color-text)] sm:text-5xl"
            >
              {about.technical.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
              {about.technical.description}
            </p>
          </AboutReveal>

          <AboutReveal
            stagger
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {about.technical.capabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.title}
                capability={capability}
                index={index}
              />
            ))}
          </AboutReveal>
        </div>
      </section>

      {/* ─── Limits (Upgraded with Signature Bubble Arc Design) ─── */}
      <section
        className="bg-[var(--surface-section-soft)] px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="about-limits-title"
      >
        <div className="mx-auto max-w-7xl">
          <AboutReveal className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">
              {about.limits.eyebrow}
            </p>
            <h2
              id="about-limits-title"
              className="mt-3 text-3xl font-black tracking-[-.04em] text-[var(--color-text)] sm:text-5xl"
            >
              {about.limits.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
              {about.limits.description}
            </p>
          </AboutReveal>

          <AboutReveal stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {about.limits.items.map((item, index) => (
              <LimitCard key={item.title} item={item} index={index} />
            ))}
          </AboutReveal>
        </div>
      </section>

      {/* ─── Unified Master Hero CTA Banner ─── */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative isolate overflow-hidden rounded-[32px] border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.18)] backdrop-blur-xl sm:p-12 lg:p-14 dark:border-emerald-700/50 dark:from-emerald-950/60 dark:via-brand-950/80 dark:to-brand-950">
            {/* Ambient background decoration */}
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(36,127,89,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.08)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-20" />
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-teal-400/20 blur-3xl" />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
                  <Sparkles
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400 animate-pulse"
                  />
                  {about.cta.eyebrow}
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl lg:text-[42px] lg:leading-[1.15] dark:text-brand-50">
                  {about.cta.title}
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-brand-900/75 sm:text-base dark:text-brand-100/75 font-medium">
                  {about.cta.text}
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-2xl bg-brand-500 px-6 font-black text-brand-950 shadow-soft hover:bg-brand-400 hover:shadow-raised"
                  >
                    <Link
                      href={localePath(locale, "tools")}
                      className="flex items-center gap-2"
                    >
                      <span>
                        {about.cta.primary} ({toolDefinitions.length})
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-2xl border-brand-300/80 bg-white/80 px-6 font-bold text-brand-950 hover:bg-white dark:border-brand-700 dark:bg-brand-900/50 dark:text-brand-50"
                  >
                    <Link href={localePath(locale, "request-a-tool")}>
                      {about.cta.secondary}
                    </Link>
                  </Button>
                </div>

                {/* Integrated Security & Privacy Architecture Links */}
                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-brand-200/70 pt-6 dark:border-brand-800/60">
                  <span className="text-xs font-black uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                    {locale === "vi"
                      ? "Kiến trúc an ninh:"
                      : "Architecture specs:"}
                  </span>
                  <Link
                    href={localePath(locale, "privacy")}
                    className="group inline-flex items-center gap-2 rounded-xl border border-emerald-300/90 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-emerald-950 shadow-2xs transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-700/60 dark:bg-brand-900/70 dark:text-emerald-200 dark:hover:bg-emerald-500 dark:hover:text-brand-950"
                  >
                    <ShieldCheck
                      size={14}
                      className="text-emerald-700 group-hover:text-white transition-colors dark:text-emerald-400 dark:group-hover:text-brand-950"
                    />
                    <span>{about.limits.privacyLink}</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>

                  <Link
                    href={localePath(locale, "security")}
                    className="group inline-flex items-center gap-2 rounded-xl border border-teal-300/90 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-teal-950 shadow-2xs transition-all hover:border-teal-600 hover:bg-teal-600 hover:text-white dark:border-teal-700/60 dark:bg-brand-900/70 dark:text-teal-200 dark:hover:bg-teal-400 dark:hover:text-brand-950"
                  >
                    <LockKeyhole
                      size={14}
                      className="text-teal-700 group-hover:text-white transition-colors dark:text-teal-400 dark:group-hover:text-brand-950"
                    />
                    <span>{about.limits.securityLink}</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>

              {/* Bento Feature Badges */}
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
                <div className="group/item flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-soft dark:border-brand-800/60 dark:bg-brand-900/50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20 transition-transform group-hover/item:scale-110 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-brand-950 group-hover/item:text-emerald-800 dark:text-brand-50 dark:group-hover/item:text-emerald-300 transition-colors">
                      {locale === "vi"
                        ? "100% Cục bộ & Bảo mật"
                        : "100% On-Device & Private"}
                    </h3>
                    <p className="text-xs text-brand-950/80 dark:text-brand-200/80 font-medium">
                      {locale === "vi"
                        ? "Không upload input nhạy cảm"
                        : "Zero sensitive data uploads"}
                    </p>
                  </div>
                </div>

                <div className="group/item flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-soft dark:border-brand-800/60 dark:bg-brand-900/50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-700 shadow-xs ring-1 ring-teal-500/20 transition-transform group-hover/item:scale-110 dark:bg-teal-400/15 dark:text-teal-300">
                    <Cpu size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-brand-950 group-hover/item:text-teal-800 dark:text-brand-50 dark:group-hover/item:text-teal-300 transition-colors">
                      {locale === "vi"
                        ? "Không cần tạo tài khoản"
                        : "No Registration Required"}
                    </h3>
                    <p className="text-xs text-brand-950/80 dark:text-brand-200/80 font-medium">
                      {locale === "vi"
                        ? "Mở web là sử dụng ngay lập tức"
                        : "Instant access directly in your browser"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ── ProblemCard — Signature Floating Bubble Arc Design ──────────── */

function ProblemCard({
  problem,
  index,
}: {
  problem: AboutCopy["why"]["problems"][number];
  index: number;
}) {
  const config = PROBLEM_STYLES[index] ?? PROBLEM_STYLES[0]!;
  const Icon = PROBLEM_ICONS[index] ?? Layers;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2 sm:p-7",
        config.border,
        config.glow,
        config.bg,
      )}
    >
      {/* Top glowing rim - sweeps across on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 transition-all duration-500 ease-out group-hover:inset-x-4 group-hover:opacity-100",
          config.topRim,
        )}
        aria-hidden="true"
      />

      {/* Header: Icon + Title & Index Pill Badge */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            config.iconBg,
          )}
        >
          <Icon size={22} />
        </span>

        <span
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:shadow-md",
            config.pill,
          )}
        >
          0{index + 1}
        </span>
      </div>

      <h3 className="relative mt-5 text-lg font-black uppercase tracking-tight text-brand-950 dark:text-brand-50 sm:text-xl">
        {problem.title}
      </h3>

      {/* Content */}
      <div className="relative z-10 mt-3 flex-1 text-sm leading-relaxed text-brand-900/75 dark:text-brand-100/75">
        {problem.text}
      </div>

      {/* Signature Floating Decorative Circular Arc Bubble ("bong bóng") */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-16 -right-16 size-44 rounded-full border-2 opacity-30 transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-110 group-hover:opacity-90",
          config.arc,
        )}
        aria-hidden="true"
      />
    </div>
  );
}

/* ── PrincipleCard — Signature Floating Bubble Arc Design ───────── */

function PrincipleCard({
  principle,
  index,
}: {
  principle: AboutCopy["manifesto"]["principles"][number];
  index: number;
}) {
  const config = PRINCIPLE_CONFIGS[index] ?? PRINCIPLE_CONFIGS[0]!;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[26px] border-2 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1.5",
        config.border,
        config.glow,
        config.bg,
      )}
    >
      {/* Top glowing rim - sweeps across on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 transition-all duration-500 ease-out group-hover:inset-x-4 group-hover:opacity-100",
          config.topRim,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            config.iconBg,
          )}
        >
          <Icon size={20} />
        </span>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider shadow-2xs transition-all duration-300 group-hover:shadow-md",
            config.pill,
          )}
        >
          <span
            className={cn("size-1.5 rounded-full animate-pulse", config.dot)}
          />
          {config.badge}
        </span>
      </div>

      <h3 className="relative mt-5 text-lg font-black text-brand-950 dark:text-brand-50">
        {principle.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-brand-900/75 dark:text-brand-100/75">
        {principle.text}
      </p>

      {/* Signature Floating Decorative Circular Arc Bubble ("bong bóng") */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-14 -right-14 size-40 rounded-full border-2 opacity-30 transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-110 group-hover:opacity-90",
          config.arc,
        )}
        aria-hidden="true"
      />
    </div>
  );
}

/* ── CapabilityCard — Signature Floating Bubble Arc Design ──────── */

function CapabilityCard({
  capability,
  index,
}: {
  capability: AboutCopy["technical"]["capabilities"][number];
  index: number;
}) {
  const config = CAPABILITY_CONFIGS[index] ?? CAPABILITY_CONFIGS[0]!;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2",
        config.border,
        config.glow,
        config.bg,
      )}
    >
      {/* Top glowing rim - sweeps across on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 transition-all duration-500 ease-out group-hover:inset-x-4 group-hover:opacity-100",
          config.topRim,
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            config.iconBg,
          )}
        >
          <Icon size={20} />
        </span>

        <span
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:shadow-md",
            config.pill,
          )}
        >
          0{index + 1}
        </span>
      </div>

      <h3 className="relative mt-5 text-base font-black uppercase tracking-tight text-brand-950 dark:text-brand-50 sm:text-lg">
        {capability.title}
      </h3>

      <p className="relative z-10 mt-2 flex-1 text-sm leading-relaxed text-brand-900/75 dark:text-brand-100/75">
        {capability.text}
      </p>

      {/* Signature Floating Decorative Circular Arc Bubble ("bong bóng") */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-16 -right-16 size-44 rounded-full border-2 opacity-30 transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-110 group-hover:opacity-90",
          config.arc,
        )}
        aria-hidden="true"
      />
    </div>
  );
}

/* ── LimitCard — Signature Floating Bubble Arc Design ───────────── */

function LimitCard({
  item,
  index,
}: {
  item: AboutCopy["limits"]["items"][number];
  index: number;
}) {
  const config = LIMIT_CONFIGS[index] ?? LIMIT_CONFIGS[0]!;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2 sm:p-7",
        config.border,
        config.glow,
        config.bg,
      )}
    >
      {/* Top glowing rim - sweeps across on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 transition-all duration-500 ease-out group-hover:inset-x-4 group-hover:opacity-100",
          config.topRim,
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            config.iconBg,
          )}
        >
          <AlertTriangle size={20} />
        </span>

        <span
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:shadow-md",
            config.pill,
          )}
        >
          0{index + 1}
        </span>
      </div>

      <h3 className="relative mt-5 text-base font-black uppercase tracking-tight text-brand-950 dark:text-brand-50 sm:text-lg">
        {item.title}
      </h3>

      <p className="relative z-10 mt-3 flex-1 text-sm leading-relaxed text-brand-900/75 dark:text-brand-100/75">
        {item.text}
      </p>

      {/* Signature Floating Decorative Circular Arc Bubble ("bong bóng") */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-16 -right-16 size-44 rounded-full border-2 opacity-30 transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-110 group-hover:opacity-90",
          config.arc,
        )}
        aria-hidden="true"
      />
    </div>
  );
}

/* ── Metric pill ─────────────────────────────────────────────────── */

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-16 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-card)] px-3.5 py-2.5 text-center shadow-soft">
      <p className="text-xl font-black text-brand-700 dark:text-brand-300">
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--ink-muted)]">
        {label}
      </p>
    </div>
  );
}

/* ── CategoryRowItem (Synchronized with Homepage design) ────────── */

function CategoryRowItem({
  locale,
  category,
  tools,
  index,
}: {
  locale: Locale;
  category: ToolCategory;
  tools: typeof toolDefinitions;
  index: number;
}) {
  const t = getDictionary(locale);
  const icon = tools[0]?.iconKey ?? "binary";
  const tone = getCategoryTone(category);
  const hover = categoryHoverStyles[category];
  const desc = categoryDescriptions[category]?.[locale] ?? "";
  const indexNumber = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={localePath(locale, `categories/${category}`)}
      className={cn(
        "group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-brand-200/70 bg-white/80 p-4 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 dark:border-brand-800/40 dark:bg-brand-950/50 sm:p-5",
        hover.border,
        hover.bg,
        hover.shadow,
      )}
    >
      {/* Decorative Faint Watermark Icon with dynamic hover tint */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-4 right-14 text-brand-900/[0.04] transition-all duration-500 group-hover:scale-110 dark:text-white/[0.03]",
          hover.watermark,
        )}
      >
        <ToolIcon iconKey={icon} size={88} />
      </div>

      <div className="relative z-10 flex items-center gap-3.5 min-w-0 sm:gap-4">
        {/* Monospace Index Number with dynamic hover color */}
        <span
          className={cn(
            "font-mono text-xs font-black tracking-wider text-brand-400/80 transition-colors duration-200",
            hover.text,
          )}
        >
          {indexNumber}
        </span>

        {/* Squircle Icon */}
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 dark:ring-white/10",
            tone.icon,
          )}
        >
          <ToolIcon iconKey={icon} size={22} />
        </span>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-base font-black text-brand-950 transition-colors duration-200 dark:text-brand-50",
                hover.text,
              )}
            >
              {t.categories[category]}
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-colors duration-200",
                hover.badge,
              )}
            >
              {tools.length} {t.ui.statsTools}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-brand-900/60 dark:text-brand-100/60">
            {desc}
          </p>
        </div>
      </div>

      {/* Right Action Arrow Button with dynamic hover color */}
      <div
        className={cn(
          "relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-700 transition-all duration-300 group-hover:translate-x-1 dark:bg-brand-400/10 dark:text-brand-300",
          hover.arrow,
        )}
      >
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
