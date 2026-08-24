import Link from "next/link";
import { getDictionary } from "@sfrankey/i18n";
import { categories, toolDefinitions, type Locale, type ToolCategory } from "@sfrankey/shared";
import { ArrowRight, Badge, BrandMark, Button, Card, cn, Cpu, getCategoryTone, Globe, Layers, ShieldCheck, Sparkles, ToolCard, ToolIcon } from "@sfrankey/ui";
import { AnimatedPrivacyPipeline } from "@/components/animated-privacy-pipeline";
import { HeroWorkspacePreview } from "@/components/hero-workspace-preview";
import { PersonalTools } from "@/components/personal-tools";
import { TypingHeadline } from "@/components/typing-headline";
import { localePath } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return { title: locale === "vi" ? "Công cụ bảo mật và lập trình miễn phí" : "Free Security & Developer Tools", description: t.home.description, alternates: { canonical: `/${locale}`, languages: { vi: "/vi", en: "/en", "x-default": "/vi" } }, openGraph: { title: t.home.title, description: t.home.description, url: `/${locale}` } };
}

const featuredIds = ["totp-generator", "password-generator", "qr-2fa-scanner", "qr-generator", "file-checksum", "json-formatter"];

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const featured = featuredIds.map((id) => toolDefinitions.find((tool) => tool.id === id)).filter((tool): tool is (typeof toolDefinitions)[number] => Boolean(tool));
  const categorySamples = categories.map((category) => ({ category, tools: toolDefinitions.filter((tool) => tool.category === category) }));
  const localTools = toolDefinitions.filter((tool) => tool.privacyMode === "on-device").length;
  const networkTools = toolDefinitions.filter((tool) => tool.privacyMode === "network-required").length;

  return <div>
    <section className="relative isolate overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--surface-hero)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(36,127,89,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.06)_1px,transparent_1px)] [background-size:36px_36px] dark:opacity-25" />
      <div className="pointer-events-none absolute -left-20 top-10 size-96 rounded-full bg-brand-300/30 blur-3xl motion-safe:animate-ambient dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -right-28 -top-28 size-[34rem] rounded-full bg-white/70 blur-3xl motion-safe:animate-ambient dark:bg-brand-400/5" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/50 bg-white/85 px-4 py-1.5 shadow-[0_4px_20px_rgba(16,185,129,0.14)] backdrop-blur-md transition-all duration-300 hover:border-emerald-500 hover:shadow-[0_6px_24px_rgba(16,185,129,0.22)] dark:border-emerald-500/30 dark:bg-brand-950/80">
            <BrandMark className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-[.16em] text-emerald-950 dark:text-emerald-100">
              {t.home.eyebrow}
            </span>
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-[-.06em] text-[var(--hero-ink)] sm:text-6xl lg:text-7xl dark:text-brand-50"><span className="hero-word-letters block">{t.home.titlePrefix}</span><TypingHeadline texts={t.home.typing} /></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">{t.home.description}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href={localePath(locale, "tools")}>{t.home.cta}<span aria-hidden="true">→</span></Link></Button><Button asChild variant="secondary" size="lg"><Link href={localePath(locale, "privacy")}>{t.nav.privacy}</Link></Button></div>
          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[.1em]"><TrustChip label={t.ui.localOnly} /><TrustChip label={t.ui.noAccount} /><TrustChip label="VI · EN" /></div>
        </div>
        <div className="relative">
          <HeroWorkspacePreview copy={t.home.preview} headline={t.home.why} body={t.home.whyText} />
        </div>
      </div>
    </section>

    {/* Clean Seamless Metric Strip */}
    <section className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/50 py-5 backdrop-blur-sm sm:py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-[var(--border-subtle)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <TrustStat value={String(toolDefinitions.length)} label={t.ui.statsTools} highlight="brand" />
        <TrustStat value={String(localTools)} label={t.ui.onDeviceTools} highlight="emerald" />
        <TrustStat value={String(networkTools)} label={t.ui.networkTools} highlight="sky" />
        <TrustStat value="0" label={t.ui.statsAccount} highlight="amber" />
      </div>
    </section>

    {/* Symmetrical 6-Card Featured Tools Grid */}
    <section className="bg-[var(--surface-section-soft)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em] text-brand-600 dark:text-brand-400">
              <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
              {locale === "vi" ? "Được dùng nhiều nhất" : "Most popular"}
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
              {t.home.featured}
            </h2>
          </div>
          <Link
            className="group inline-flex items-center gap-2 rounded-full border border-brand-300/70 bg-white/80 px-4 py-2 text-xs font-bold text-brand-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:text-brand-950 hover:shadow-soft dark:border-brand-700/60 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-400 dark:hover:text-brand-950"
            href={localePath(locale, "tools")}
          >
            <span>{t.ui.viewAll}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              locale={locale}
              variant="standard"
              href={localePath(locale, `tools/${tool.slug}`)}
              privacyLabel={tool.privacyMode === "network-required" ? t.common.networkRequired : t.common.onDevice}
              categoryLabel={t.categories[tool.category]}
              favoriteLabel={t.ui.addFavorite}
              unfavoriteLabel={t.ui.removeFavorite}
              openLabel={t.ui.openTool}
            />
          ))}
        </div>
      </div>
    </section>

    {/* Sleek Category Directory List (Non-Card Layout) */}
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-section-strong)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em] text-brand-600 dark:text-brand-400">
              <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
              {locale === "vi" ? "Hệ sinh thái tiện ích" : "Tool Directory"}
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
              {t.ui.categoryExplore}
            </h2>
          </div>
          <Link
            className="group inline-flex items-center gap-2 rounded-full border border-brand-300/70 bg-white/80 px-4 py-2 text-xs font-bold text-brand-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:text-brand-950 hover:shadow-soft dark:border-brand-700/60 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-400 dark:hover:text-brand-950"
            href={localePath(locale, "tools")}
          >
            <span>{t.ui.viewAll} ({toolDefinitions.length})</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {categorySamples.map(({ category, tools }, index) => (
            <CategoryRowItem
              key={category}
              index={index}
              locale={locale}
              category={category}
              tools={tools}
            />
          ))}
        </div>
      </div>
    </section>

    {/* Animated Privacy & Security Architecture */}
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-privacy)] px-4 py-16 text-[var(--ink)] sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        {/* Left Editorial Column (Clean, Breathable & Distinct) */}
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-white/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/80 dark:text-emerald-200">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {locale === "vi" ? "Kiến trúc bảo mật cục bộ" : "Zero-Knowledge Architecture"}
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl lg:text-[40px] lg:leading-[1.15] dark:text-brand-50">
              {locale === "vi"
                ? "Dữ liệu nhạy cảm của bạn không bao giờ rời khỏi thiết bị."
                : "Your sensitive data never leaves your device."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-brand-900/75 sm:text-base dark:text-brand-100/75">
              {t.ui.privacyPromiseText}
            </p>
          </div>

          {/* 3 Core Security Pillars (Clean List without Enclosed Boxes) */}
          <div className="space-y-5 pt-1">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-700 ring-1 ring-teal-500/20 dark:bg-teal-400/15 dark:text-teal-300">
                <Cpu size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-brand-950 dark:text-brand-50">
                  {locale === "vi" ? "Xử lý 100% trong RAM trình duyệt" : "100% In-Memory Browser Execution"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-brand-900/65 dark:text-brand-100/65">
                  {locale === "vi"
                    ? "Mật khẩu, mã OTP, khóa bí mật, chuỗi JSON và file băm được tính toán qua Web Crypto API cục bộ trên máy bạn."
                    : "Passwords, OTP tokens, private keys, JSON strings and hash digests execute locally via Web Crypto API in browser memory."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-brand-950 dark:text-brand-50">
                  {locale === "vi" ? "Minh bạch ranh giới mạng (Explicit Boundary)" : "Transparent Network Boundary"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-brand-900/65 dark:text-brand-100/65">
                  {locale === "vi"
                    ? "Tuyệt đối không upload ngầm. Chỉ các công cụ chẩn đoán mạng mới gửi gói tin khi bạn chủ động nhấn và luôn công khai đích đến."
                    : "Zero hidden telemetry or background uploads. Network diagnostic tools only send requests upon explicit user action."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-500/20 dark:bg-cyan-400/15 dark:text-cyan-300">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-brand-950 dark:text-brand-50">
                  {locale === "vi" ? "Không lưu trữ rác (Zero Persistence & Tracking)" : "Zero Persistence & No Tracking"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-brand-900/65 dark:text-brand-100/65">
                  {locale === "vi"
                    ? "Không cookie, không tracking dữ liệu nhạy cảm. Đóng tab hoặc tải lại trang là toàn bộ dữ liệu tạm biến mất hoàn toàn."
                    : "No cookies or tracking on sensitive inputs. Closing the tab immediately purges all temporary workspace state."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <div className="pt-2">
            <Link
              href={localePath(locale, "about")}
              className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-950 transition-colors hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              <span>{locale === "vi" ? "Tìm hiểu chi tiết mô hình bảo mật" : "Read our full security model"}</span>
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Animated Pipeline Visualizer */}
        <AnimatedPrivacyPipeline locale={locale} />
      </div>
    </section>

    <PersonalTools locale={locale} />

    {/* Master Community & Tool Request CTA Banner */}
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-[32px] border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.18)] backdrop-blur-xl sm:p-10 lg:p-14 dark:border-emerald-700/50 dark:from-emerald-950/60 dark:via-brand-950/80 dark:to-brand-950">
          {/* Ambient Background Decorative Grid and Orbs */}
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(36,127,89,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(36,127,89,.08)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-20" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-teal-400/20 blur-3xl" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            {/* Left Content */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
                <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                {locale === "vi" ? "Đóng góp & Đề xuất công cụ" : "Community & Feature Requests"}
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl lg:text-[42px] lg:leading-[1.15] dark:text-brand-50">
                {locale === "vi"
                  ? "Bạn cần thêm công cụ mới phục vụ công việc?"
                  : "Need a new tool to speed up your workflow?"}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-900/75 sm:text-base dark:text-brand-100/75">
                {locale === "vi"
                  ? "SFranKey liên tục xây dựng các công cụ lập trình và bảo mật miễn phí 100% chạy cục bộ. Hãy gửi ý tưởng để chúng tôi cùng bạn biến nó thành hiện thực!"
                  : "SFranKey continuously builds 100% free, on-device developer & security utilities. Tell us what tool you need next and we'll build it!"}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="rounded-2xl bg-brand-500 px-6 font-black text-brand-950 shadow-soft hover:bg-brand-400 hover:shadow-raised">
                  <Link href={localePath(locale, "request-a-tool")} className="flex items-center gap-2">
                    <span>{locale === "vi" ? "Gửi đề xuất công cụ mới" : "Request a new tool"}</span>
                    <ArrowRight size={16} />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="rounded-2xl border-brand-300/80 bg-white/80 px-6 font-bold text-brand-950 hover:bg-white dark:border-brand-700 dark:bg-brand-900/50 dark:text-brand-50">
                  <Link href={localePath(locale, "tools")}>
                    {locale === "vi" ? "Xem tất cả công cụ" : "Browse all tools"}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Bento Feature Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-soft dark:border-brand-800/60 dark:bg-brand-900/50">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "100% Cục bộ & Bảo mật" : "100% On-Device & Private"}
                  </h4>
                  <p className="text-xs text-brand-800/65 dark:text-brand-200/65">
                    {locale === "vi" ? "Không server trung gian, không thu thập dữ liệu" : "Zero intermediary servers or data logging"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-soft dark:border-brand-800/60 dark:bg-brand-900/50">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-700 shadow-xs ring-1 ring-teal-500/20 dark:bg-teal-400/15 dark:text-teal-300">
                  <Cpu size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "Mã nguồn mở & Miễn phí" : "Open Source & Free Forever"}
                  </h4>
                  <p className="text-xs text-brand-800/65 dark:text-brand-200/65">
                    {locale === "vi" ? "Được xây dựng cho cộng đồng developer" : "Built transparently for the developer community"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-brand-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-soft dark:border-brand-800/60 dark:bg-brand-900/50 sm:col-span-2 lg:col-span-1">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-700 shadow-xs ring-1 ring-cyan-500/20 dark:bg-cyan-400/15 dark:text-cyan-300">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "Triển khai nhanh theo yêu cầu" : "Fast Turnaround on Requests"}
                  </h4>
                  <p className="text-xs text-brand-800/65 dark:text-brand-200/65">
                    {locale === "vi" ? "Đề xuất được xét duyệt & phát triển liên tục" : "Reviewed & developed continuously with community"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>;
}

function TrustChip({ label }: { label: string }) { return <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/45 bg-[var(--surface-card)] px-3.5 py-2 text-brand-800 shadow-soft transition-[transform,box-shadow,border-color] duration-normal hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-card dark:border-brand-300/30 dark:bg-brand-900/70 dark:text-brand-100"><span className="grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-black leading-none text-brand-950 dark:bg-brand-300">✓</span>{label}</span>; }

function TrustStat({
  value,
  label,
  highlight = "brand"
}: {
  value: string;
  label: string;
  highlight?: "brand" | "emerald" | "sky" | "amber";
}) {
  const color =
    highlight === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : highlight === "sky"
      ? "text-sky-600 dark:text-sky-400"
      : highlight === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-brand-600 dark:text-brand-400";

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center transition-transform duration-200 hover:-translate-y-0.5 sm:p-5">
      <span className={cn("text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl", color)}>
        {value}
      </span>
      <span className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-brand-800/70 dark:text-brand-200/70">
        {label}
      </span>
    </div>
  );
}



const categoryDescriptions: Record<ToolCategory, { vi: string; en: string }> = {
  "2fa": { vi: "Xác thực hai yếu tố, bảo mật mã OTP theo thời gian thực", en: "Two-factor authentication & real-time time-based OTP codes" },
  password: { vi: "Trình tạo mật khẩu ngẫu nhiên CSPRNG & phân tích độ mạnh", en: "CSPRNG random password generator & offline entropy audit" },
  qr: { vi: "Tạo & quét mã QR đa năng, trích xuất dữ liệu, xuất file SVG/PNG", en: "Vector QR generator & camera scanner with SVG/PNG exports" },
  encoding: { vi: "Mã hóa Base64, tính mã băm SHA/MD5 & xác thực toàn vẹn file", en: "Base64 codecs, SHA/MD5 cryptographic hashes & file digests" },
  developer: { vi: "Định dạng JSON, giải mã JWT, chuyển đổi UUID & tiện ích code", en: "JSON formatter, JWT decoder, UUID generator & developer suite" },
  network: { vi: "Chẩn đoán IP, ping, tra cứu DNS & kiểm tra kết nối mạng", en: "IP diagnostics, network ping, DNS lookup & connectivity checks" }
};

const categoryHoverStyles: Record<ToolCategory, {
  border: string;
  bg: string;
  text: string;
  badge: string;
  arrow: string;
  watermark: string;
  shadow: string;
}> = {
  "2fa": {
    border: "hover:border-teal-400/90 dark:hover:border-teal-500",
    bg: "hover:bg-teal-50/50 dark:hover:bg-teal-950/40",
    text: "group-hover:text-teal-700 dark:group-hover:text-teal-300",
    badge: "bg-teal-500/15 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    arrow: "group-hover:bg-teal-500 group-hover:text-white dark:group-hover:bg-teal-400 dark:group-hover:text-teal-950",
    watermark: "group-hover:text-teal-500/15 dark:group-hover:text-teal-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(20,184,166,0.16)]"
  },
  password: {
    border: "hover:border-emerald-400/90 dark:hover:border-emerald-500",
    bg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40",
    text: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
    badge: "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    arrow: "group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-400 dark:group-hover:text-emerald-950",
    watermark: "group-hover:text-emerald-500/15 dark:group-hover:text-emerald-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(16,185,129,0.16)]"
  },
  qr: {
    border: "hover:border-cyan-400/90 dark:hover:border-cyan-500",
    bg: "hover:bg-cyan-50/50 dark:hover:bg-cyan-950/40",
    text: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
    badge: "bg-cyan-500/15 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300",
    arrow: "group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:bg-cyan-400 dark:group-hover:text-cyan-950",
    watermark: "group-hover:text-cyan-500/15 dark:group-hover:text-cyan-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(6,182,212,0.16)]"
  },
  encoding: {
    border: "hover:border-lime-400/90 dark:hover:border-lime-500",
    bg: "hover:bg-lime-50/50 dark:hover:bg-lime-950/40",
    text: "group-hover:text-lime-800 dark:group-hover:text-lime-300",
    badge: "bg-lime-500/15 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300",
    arrow: "group-hover:bg-lime-500 group-hover:text-lime-950 dark:group-hover:bg-lime-400 dark:group-hover:text-lime-950",
    watermark: "group-hover:text-lime-500/15 dark:group-hover:text-lime-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(132,204,22,0.16)]"
  },
  developer: {
    border: "hover:border-violet-400/90 dark:hover:border-violet-500",
    bg: "hover:bg-violet-50/50 dark:hover:bg-violet-950/40",
    text: "group-hover:text-violet-700 dark:group-hover:text-violet-300",
    badge: "bg-violet-500/15 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
    arrow: "group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-400 dark:group-hover:text-violet-950",
    watermark: "group-hover:text-violet-500/15 dark:group-hover:text-violet-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(139,92,246,0.16)]"
  },
  network: {
    border: "hover:border-sky-400/90 dark:hover:border-sky-500",
    bg: "hover:bg-sky-50/50 dark:hover:bg-sky-950/40",
    text: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
    badge: "bg-sky-500/15 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    arrow: "group-hover:bg-sky-500 group-hover:text-white dark:group-hover:bg-sky-400 dark:group-hover:text-sky-950",
    watermark: "group-hover:text-sky-500/15 dark:group-hover:text-sky-400/12",
    shadow: "hover:shadow-[0_12px_32px_rgba(14,165,233,0.16)]"
  }
};

function CategoryRowItem({
  locale,
  category,
  tools,
  index
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
        "group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-brand-200/70 bg-white/80 p-4.5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 dark:border-brand-800/40 dark:bg-brand-950/50 sm:p-5",
        hover.border,
        hover.bg,
        hover.shadow
      )}
    >
      {/* Decorative Faint Watermark Icon with dynamic hover tint */}
      <div className={cn("pointer-events-none absolute -bottom-4 right-14 text-brand-900/[0.04] transition-all duration-500 group-hover:scale-110 dark:text-white/[0.03]", hover.watermark)}>
        <ToolIcon iconKey={icon} size={88} />
      </div>

      <div className="relative z-10 flex items-center gap-3.5 min-w-0 sm:gap-4">
        {/* Monospace Index Number with dynamic hover color */}
        <span className={cn("font-mono text-xs font-black tracking-wider text-brand-400/80 transition-colors duration-200", hover.text)}>
          {indexNumber}
        </span>

        {/* Squircle Icon */}
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 dark:ring-white/10", tone.icon)}>
          <ToolIcon iconKey={icon} size={22} />
        </span>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("text-base font-black text-brand-950 transition-colors duration-200 dark:text-brand-50", hover.text)}>
              {t.categories[category]}
            </h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-colors duration-200", hover.badge)}>
              {tools.length} {t.ui.statsTools}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-brand-900/60 dark:text-brand-100/60">
            {desc}
          </p>
        </div>
      </div>

      {/* Right Action Arrow Button with dynamic hover color */}
      <div className={cn("relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-700 transition-all duration-300 group-hover:translate-x-1 dark:bg-brand-400/10 dark:text-brand-300", hover.arrow)}>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
