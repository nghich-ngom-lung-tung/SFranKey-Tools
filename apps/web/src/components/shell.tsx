"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary } from "@sfrankey/i18n";
import { categories, toolDefinitions, type Locale, type ToolCategory } from "@sfrankey/shared";
import {
  AlertTriangle,
  ArrowRight,
  BrandLogo,
  Button,
  ChevronDown,
  cn,
  Code2,
  Cpu,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DrawerContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FileCheck,
  Globe,
  Globe2,
  Heart,
  IconButton,
  KeyRound,
  Layers,
  Menu,
  Moon,
  Network,
  ScanQrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  ToolIcon,
  TooltipProvider,
  X
} from "@sfrankey/ui";
import { localePath } from "@/lib/locale";
import { readPreferences, writePreferences } from "@/lib/storage";
import { MotionProvider } from "./motion-provider";
import { ScrollToTop } from "./scroll-to-top";
import { SplashScreen } from "./splash-screen";
import { ThemeProvider, useTheme } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <TooltipProvider delayDuration={250}>
          <ToastProvider>
            <ShellInner locale={locale}>{children}</ShellInner>
          </ToastProvider>
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}

function ShellInner({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = getDictionary(locale);
  const pathname = usePathname() ?? `/${locale}`;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const otherLocale = locale === "vi" ? "en" : "vi";
  const switchedPath = pathname.replace(/^\/(vi|en)/, `/${otherLocale}`);

  React.useEffect(() => {
    const preferences = readPreferences();
    if (preferences.locale !== locale) writePreferences({ ...preferences, locale });
    document.cookie = `sfrankey-locale=${locale};path=/;max-age=31536000;samesite=lax`;
  }, [locale]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <div className="min-h-screen">
    <SplashScreen locale={locale} />
    <header className={headerClass(scrolled)}>
      <div className={`mx-auto flex max-w-7xl items-center gap-2 px-4 transition-[height] duration-normal sm:px-6 ${scrolled ? "h-16" : "h-[4.75rem]"}`}>
        <Link href={localePath(locale)} className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <BrandLogo locale={locale} descriptor={scrolled ? undefined : t.brandDescriptor} compact />
        </Link>
        <div className="hidden h-8 w-px bg-brand-700/15 dark:bg-brand-200/15 lg:block" />
        <nav className="hidden items-center gap-1 lg:flex" aria-label={t.nav.tools}>
          <HeaderLink href={localePath(locale, "tools")} active={pathname === `/${locale}/tools`}><ToolIcon iconKey="binary" size={15} />{t.nav.tools}</HeaderLink>
          <CategoryMenu locale={locale} active={pathname.includes("/categories/")} label={t.nav.categories} />
          <HeaderLink href={localePath(locale, "about")} active={pathname.includes("/about")}>{t.nav.about}</HeaderLink>
        </nav>
        <button type="button" onClick={() => setSearchOpen(true)} className="ml-auto flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-card)] bg-[var(--surface-header-control)] px-3 text-left text-sm text-[var(--ink-muted)] shadow-sm transition-[border-color,background-color,box-shadow] duration-normal hover:border-brand-400 hover:bg-[var(--surface-card)] hover:shadow-soft sm:ml-4 sm:max-w-[26rem]">
          <Search size={17} className="text-brand-700 dark:text-brand-300" />
          <span className="truncate">{t.common.search}</span>
          <kbd aria-hidden="true" className="ml-auto hidden rounded-md border border-[var(--border-card)] bg-[var(--surface-card-tinted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)] sm:block">{typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘ K" : "Ctrl K"}</kbd>
        </button>
        <div className="hidden items-center gap-1 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-header-control)] p-1 sm:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={t.ui.theme}>{theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <span className="text-sm">◐</span>}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setTheme("system")}>◐ {t.ui.system}</DropdownMenuItem><DropdownMenuItem onSelect={() => setTheme("light")}><Sun size={15} />{t.ui.light}</DropdownMenuItem><DropdownMenuItem onSelect={() => setTheme("dark")}><Moon size={15} />{t.ui.dark}</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Link href={switchedPath} className="grid min-h-11 place-items-center rounded-[var(--radius-md)] border border-[var(--border-card)] px-3 text-xs font-bold text-[var(--ink)] transition hover:border-brand-400 hover:bg-[var(--surface-card)]" aria-label={`${otherLocale.toUpperCase()} - ${t.ui.language}`}>{otherLocale.toUpperCase()}</Link>
        </div>
        <div className="flex items-center gap-1 sm:hidden"><IconButton label={t.ui.openSearch} onClick={() => setSearchOpen(true)}><Search size={18} /></IconButton><IconButton label={t.ui.menu} onClick={() => setMobileOpen(true)}><Menu size={19} /></IconButton></div>
      </div>
    </header>
    <main>{children}</main>
    <Footer locale={locale} switchedPath={switchedPath} />
    <ScrollToTop locale={locale} />
    <SearchDialog locale={locale} open={searchOpen} onOpenChange={setSearchOpen} onSelect={(slug) => { setSearchOpen(false); router.push(localePath(locale, `tools/${slug}`)); }} />
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
      <DrawerContent className="border-[var(--border-card)] bg-[var(--surface-dialog)] text-[var(--ink)]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-5"><BrandLogo locale={locale} descriptor={t.brandDescriptor} /><IconButton label={t.ui.close} onClick={() => setMobileOpen(false)}><X size={18} /></IconButton></div>
          <nav className="mt-6 grid gap-1" aria-label={t.nav.tools}><MobileLink href={localePath(locale, "tools")} label={t.nav.tools} icon="tools" close={() => setMobileOpen(false)} /><p className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[.18em] text-brand-700/65 dark:text-brand-300/70">{t.nav.categories}</p>{categories.map((category) => <MobileCategoryLink key={category} locale={locale} category={category} close={() => setMobileOpen(false)} />)}<MobileLink href={localePath(locale, "about")} label={t.nav.about} close={() => setMobileOpen(false)} /></nav>
          <div className="mt-8 border-t border-[var(--border-subtle)] pt-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700/70 dark:text-brand-300/70">{t.ui.theme}</p><div className="mt-3 grid grid-cols-3 gap-2"><Button size="sm" variant={theme === "system" ? "primary" : "secondary"} onClick={() => setTheme("system")}>◐</Button><Button size="sm" variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}><Sun size={15} /></Button><Button size="sm" variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}><Moon size={15} /></Button></div></div>
          <div className="mt-auto border-t border-[var(--border-subtle)] pt-6"><p className="text-xs text-[var(--ink-muted)]">{t.ui.footerLocal}</p><Link href={switchedPath} onClick={() => setMobileOpen(false)} className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--border-card)] px-3 text-xs font-bold text-[var(--ink)]">{otherLocale.toUpperCase()} · {t.ui.language}</Link></div>
        </div>
      </DrawerContent>
    </Dialog>
  </div>;
}

function headerClass(scrolled: boolean) {
  return `sticky top-0 z-40 border-b bg-[var(--surface-header)] text-[var(--ink)] backdrop-blur-2xl transition-[box-shadow,border-color] duration-normal ${scrolled ? "border-brand-400/35 shadow-[0_12px_35px_rgba(27,96,71,.12)] dark:shadow-[0_12px_35px_rgba(0,0,0,.28)]" : "border-[var(--border-subtle)] shadow-[0_6px_24px_rgba(27,96,71,.06)] dark:shadow-[0_6px_24px_rgba(0,0,0,.16)]"}`;
}

function HeaderLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return <Link href={href} className={active ? "relative inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-brand-200/65 px-3 text-sm font-semibold text-brand-900 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-600 dark:bg-brand-300/10 dark:text-brand-100 dark:after:bg-brand-300" : "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--ink-muted)] transition-colors duration-fast hover:bg-brand-100/70 hover:text-[var(--ink)] dark:hover:bg-white/[.06]"}>{children}</Link>;
}

function CategoryMenu({ locale, active, label }: { locale: Locale; active?: boolean; label: string }) {
  const t = getDictionary(locale);
  const triggerClass = active ? "relative inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-brand-200/65 px-3 text-sm font-semibold text-brand-900 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-600 dark:bg-brand-300/10 dark:text-brand-100 dark:after:bg-brand-300" : "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--ink-muted)] transition-colors hover:bg-brand-100/70 hover:text-[var(--ink)] dark:hover:bg-white/[.06]";
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={triggerClass}><ToolIcon iconKey="qr-code" size={15} />{label}<ChevronDown size={14} /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-[min(90vw,26rem)] p-2"><div className="grid gap-1 sm:grid-cols-2">{categories.map((category) => { const count = toolDefinitions.filter((tool) => tool.category === category).length; return <DropdownMenuItem key={category} asChild className="h-auto min-h-16 items-start p-2"><Link href={localePath(locale, `categories/${category}`)}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-300/10 dark:text-brand-300"><ToolIcon iconKey={toolDefinitions.find((tool) => tool.category === category)?.iconKey ?? "binary"} size={17} /></span><span className="min-w-0"><strong className="block text-sm">{t.categories[category]}</strong><span className="mt-0.5 block text-[10px] text-[var(--ink-muted)]">{count} {t.ui.statsTools}</span></span></Link></DropdownMenuItem>; })}</div></DropdownMenuContent></DropdownMenu>;
}

function MobileLink({ href, label, icon, close }: { href: string; label: string; icon?: "tools"; close: () => void }) {
  return <Link href={href} onClick={close} className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-3 text-base font-semibold text-[var(--ink)] transition hover:bg-brand-100/70 dark:hover:bg-white/[.06]">{icon ? <ToolIcon iconKey="binary" size={18} className="text-brand-700 dark:text-brand-300" /> : null}{label}</Link>;
}

function MobileCategoryLink({ locale, category, close }: { locale: Locale; category: ToolCategory; close: () => void }) {
  const t = getDictionary(locale);
  const icon = toolDefinitions.find((tool) => tool.category === category)?.iconKey ?? "binary";
  return <Link href={localePath(locale, `categories/${category}`)} onClick={close} className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--ink-muted)] transition hover:bg-brand-100/70 hover:text-[var(--ink)] dark:hover:bg-white/[.06]"><span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-300/10 dark:text-brand-300"><ToolIcon iconKey={icon} size={15} /></span>{t.categories[category]}</Link>;
}

function Footer({ locale, switchedPath }: { locale: Locale; switchedPath: string }) {
  const t = getDictionary(locale);
  const otherLocale = locale === "vi" ? "en" : "vi";
  const localTools = toolDefinitions.filter((tool) => tool.privacyMode === "on-device").length;
  const networkTools = toolDefinitions.length - localTools;

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-card)] bg-[var(--surface-footer)] text-[var(--ink)]">
      {/* Top Gradient Laser Light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Security & System Status HUD Bar */}
        <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-[var(--border-card)] bg-white/70 p-4 shadow-xs backdrop-blur-md dark:bg-white/[.04] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
              {locale === "vi" ? "Hệ thống hoạt động bình thường" : "All Systems Nominal"}
            </span>
            <span className="hidden text-brand-300 dark:text-brand-700 sm:inline">·</span>
            <span className="hidden font-mono text-[11px] text-brand-700 dark:text-brand-300 sm:inline">
              WebCrypto CSPRNG Sandbox
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-brand-950/90 dark:text-brand-100/90 font-medium">
            <span>
              <strong className="font-black text-brand-950 dark:text-brand-50">{toolDefinitions.length}</strong> {t.ui.statsTools}
            </span>
            <span className="size-1 rounded-full bg-brand-400" />
            <span>
              <strong className="font-black text-emerald-700 dark:text-emerald-400">{localTools}</strong> {locale === "vi" ? "cục bộ (RAM)" : "on-device"}
            </span>
            <span className="size-1 rounded-full bg-brand-400" />
            <span>
              <strong className="font-black text-sky-700 dark:text-sky-400">{networkTools}</strong> {locale === "vi" ? "cần mạng" : "network"}
            </span>
          </div>
        </div>

        {/* 4 Main Footer Navigation Columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand & Trust Column */}
          <div className="col-span-2 sm:col-span-1">
            <BrandLogo locale={locale} descriptor={t.brandDescriptor} />
            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--ink-muted)]">
              {t.tagline}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/80 bg-emerald-100/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck size={13} className="text-emerald-700 dark:text-emerald-400" />
                Zero Telemetry
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-300/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-950 shadow-xs dark:border-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                MIT License
              </span>
            </div>

            <div className="mt-5">
              <Link
                href={switchedPath}
                className="group inline-flex items-center gap-2 rounded-xl border border-[var(--border-card)] bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-950 shadow-xs transition hover:border-brand-400 hover:bg-white dark:bg-white/[0.04] dark:text-brand-100 dark:hover:bg-white/[0.08]"
              >
                <Globe size={14} className="text-brand-700 dark:text-brand-300" />
                <span>{otherLocale.toUpperCase()} · {locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}</span>
                <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Popular Tools */}
          <FooterGroup
            title={locale === "vi" ? "Công cụ phổ biến" : "Featured Tools"}
            icon={<Cpu size={14} className="text-emerald-600 dark:text-emerald-400" />}
          >
            <FooterLink
              href={localePath(locale, "tools/totp-generator")}
              label="TOTP 2FA Generator"
              icon={<Timer size={14} />}
            />
            <FooterLink
              href={localePath(locale, "tools/password-generator")}
              label={locale === "vi" ? "Tạo mật khẩu CSPRNG" : "Password Generator"}
              icon={<KeyRound size={14} />}
            />
            <FooterLink
              href={localePath(locale, "tools/qr-2fa-scanner")}
              label={locale === "vi" ? "Quét mã QR 2FA" : "QR 2FA Scanner"}
              icon={<ScanQrCode size={14} />}
            />
            <FooterLink
              href={localePath(locale, "tools/file-checksum")}
              label={locale === "vi" ? "Băm & Checksum file" : "File Checksum"}
              icon={<FileCheck size={14} />}
            />
            <FooterLink
              href={localePath(locale, "tools/ip-lookup")}
              label={locale === "vi" ? "Tra cứu địa chỉ IP" : "IP Lookup"}
              icon={<Globe size={14} />}
            />
            <FooterLink
              href={localePath(locale, "tools")}
              label={locale === "vi" ? "Xem tất cả công cụ →" : "View all tools →"}
              icon={<Layers size={14} />}
              highlight
            />
          </FooterGroup>

          {/* Column 3: Security & Architecture */}
          <FooterGroup
            title={locale === "vi" ? "Bảo mật & Kiến trúc" : "Security & Design"}
            icon={<ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />}
          >
            <FooterLink
              href={localePath(locale, "about")}
              label={locale === "vi" ? "Giới thiệu SFranKey" : "About SFranKey"}
              icon={<Sparkles size={14} />}
            />
            <FooterLink
              href={localePath(locale, "privacy")}
              label={locale === "vi" ? "Cam kết quyền riêng tư" : "Privacy Policy"}
              icon={<ShieldCheck size={14} />}
            />
            <FooterLink
              href={localePath(locale, "security")}
              label={locale === "vi" ? "Mô hình RAM Sandbox" : "Security Model"}
              icon={<Cpu size={14} />}
            />
            <FooterLink
              href={localePath(locale, "categories/network")}
              label={locale === "vi" ? "Ranh giới mạng minh bạch" : "Network Boundary"}
              icon={<Network size={14} />}
            />
          </FooterGroup>

          {/* Column 4: Community & Feedback */}
          <FooterGroup
            title={locale === "vi" ? "Đóng góp & Hỗ trợ" : "Community & Support"}
            icon={<Heart size={14} className="text-rose-500" />}
          >
            <FooterLink
              href={localePath(locale, "request-a-tool")}
              label={locale === "vi" ? "Đề xuất công cụ mới" : "Request a tool"}
              icon={<Sparkles size={14} />}
            />
            <FooterLink
              href={localePath(locale, "report-a-bug")}
              label={locale === "vi" ? "Báo cáo lỗi / Bug" : "Report a bug"}
              icon={<AlertTriangle size={14} />}
            />
            <FooterLink
              href="https://github.com"
              label="GitHub Repository ↗"
              icon={<Code2 size={14} />}
              external
            />
            <span className="inline-flex items-center gap-2 pt-1 font-mono text-[11px] text-[var(--ink-muted)]">
              <Globe2 size={13} className="text-brand-500/70" />
              sfrankey.com
            </span>
          </FooterGroup>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} SFranKey. {locale === "vi" ? "Bộ công cụ mã nguồn mở vì quyền riêng tư." : "Open-source privacy developer suite."}
          </span>

          <span className="text-[11px] text-[var(--ink-muted)]">
            {t.ui.noAccount} · {t.ui.networkBoundary}
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  icon,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-[.18em] text-brand-950 dark:text-brand-100">
          {title}
        </p>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[var(--ink-muted)]">
        {children}
      </div>
    </div>
  );
}

function FooterLink({
  href,
  label,
  icon,
  highlight = false,
  external = false
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  external?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <span className="text-brand-500/80 transition-transform duration-200 group-hover:scale-110 group-hover:text-brand-700 dark:text-brand-400/80 dark:group-hover:text-brand-300">
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 text-sm text-[var(--ink-muted)] transition-colors duration-fast hover:text-brand-700 dark:hover:text-brand-300"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 transition-colors duration-fast",
        highlight
          ? "font-bold text-brand-950 underline underline-offset-4 hover:text-brand-700 dark:text-brand-200 dark:hover:text-brand-100"
          : "hover:text-brand-700 dark:hover:text-brand-300"
      )}
    >
      {content}
    </Link>
  );
}

function SearchDialog({ locale, open, onOpenChange, onSelect }: { locale: Locale; open: boolean; onOpenChange: (open: boolean) => void; onSelect: (slug: string) => void }) {
  const t = getDictionary(locale);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(0);
  const [preferences, setPreferences] = React.useState(readPreferences);
  const normalized = normalizeSearch(query);
  const results = toolDefinitions.filter((tool) => normalizeSearch([tool.title[locale], tool.description[locale], tool.keywords.join(" "), t.categories[tool.category]].join(" ")).includes(normalized)).slice(0, 8);
  const visibleResults = query ? results : toolDefinitions.filter((tool) => preferences.favoriteToolIds.includes(tool.id) || preferences.recentTools.some((item) => item.toolId === tool.id)).sort((a, b) => Number(preferences.favoriteToolIds.includes(b.id)) - Number(preferences.favoriteToolIds.includes(a.id))).slice(0, 8);

  React.useEffect(() => { if (open) { setPreferences(readPreferences()); setQuery(""); setSelected(0); } }, [open]);
  React.useEffect(() => setSelected(0), [query]);
  const choose = (index: number) => { const item = visibleResults[index]; if (item) onSelect(item.slug); };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent showClose={false} closeLabel={t.ui.close} className="max-w-2xl p-3 sm:p-4"><DialogTitle className="sr-only">{t.common.search}</DialogTitle><DialogDescription className="sr-only">{t.ui.searchHint}</DialogDescription><div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-card)] bg-[var(--surface-card-tinted)] px-3"><Search size={18} className="text-brand-700 dark:text-brand-300" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setSelected((value) => Math.min(value + 1, visibleResults.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setSelected((value) => Math.max(value - 1, 0)); } if (event.key === "Enter") { event.preventDefault(); choose(selected); } }} placeholder={t.ui.searchHint} className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]" /><kbd className="hidden rounded border border-[var(--border-card)] px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)] sm:block">ESC</kbd></div><div className="mt-3 max-h-[55vh] overflow-y-auto">{!query && visibleResults.length ? <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-brand-700/70 dark:text-brand-300/70">{preferences.favoriteToolIds.some((id) => visibleResults.some((tool) => tool.id === id)) ? t.ui.searchFavorites : t.ui.searchRecent}</p> : null}{visibleResults.map((tool, index) => <button type="button" key={tool.id} onClick={() => choose(index)} className={`group flex min-h-16 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-left transition ${selected === index ? "bg-brand-100/80 dark:bg-brand-300/10" : "hover:bg-brand-50 dark:hover:bg-white/[.04]"}`}><span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-brand-100 text-brand-700 dark:bg-brand-300/10 dark:text-brand-300"><ToolIcon iconKey={tool.iconKey} size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[var(--ink)]">{tool.title[locale]}</strong><span className="block truncate text-xs text-[var(--ink-muted)]">{tool.description[locale]}</span></span><ArrowRight size={16} className="text-brand-600 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100 dark:text-brand-300" /></button>)}{!visibleResults.length ? <p className="p-6 text-center text-sm text-[var(--ink-muted)]">{query ? t.common.noResults : t.ui.noFavorites}</p> : null}</div></DialogContent></Dialog>;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
