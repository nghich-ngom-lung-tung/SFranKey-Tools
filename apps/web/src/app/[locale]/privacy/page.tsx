import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { Badge, Globe, LockKeyhole, Radio, Search, ShieldCheck, Sparkles, Zap } from "@sfrankey/ui";
import { ClearLocalData } from "@/components/clear-local-data";
import { localizedMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return localizedMetadata(locale, "privacy", t.nav.privacy, t.ui.privacyPromiseText);
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const rows =
    locale === "vi"
      ? [
          { tool: "Check My IP", icon: <Globe size={15} className="text-emerald-700 dark:text-emerald-400" />, api: "Source IP tự nhiên", thirdParty: "IPinfo" },
          { tool: "IP Lookup / VPN", icon: <Search size={15} className="text-teal-700 dark:text-teal-400" />, api: "IP được nhập", thirdParty: "IPinfo" },
          { tool: "DNS Lookup", icon: <Zap size={15} className="text-amber-700 dark:text-amber-400" />, api: "Hostname", thirdParty: "Cloudflare DoH" },
          { tool: "SSL / Redirect / Header", icon: <LockKeyhole size={15} className="text-emerald-700 dark:text-emerald-400" />, api: "Hostname hoặc URL", thirdParty: "Website đích" },
          { tool: "DNS Leak", icon: <ShieldCheck size={15} className="text-indigo-700 dark:text-indigo-400" />, api: "Token phiên + resolver IP", thirdParty: "Probe tự host + IPinfo" },
          { tool: "WebRTC Leak", icon: <Radio size={15} className="text-sky-700 dark:text-sky-400" />, api: "Không gửi candidate tới API", thirdParty: "STUN tự host thấy source IP" },
        ]
      : [
          { tool: "Check My IP", icon: <Globe size={15} className="text-emerald-700 dark:text-emerald-400" />, api: "Natural source IP", thirdParty: "IPinfo" },
          { tool: "IP Lookup / VPN", icon: <Search size={15} className="text-teal-700 dark:text-teal-400" />, api: "Selected IP", thirdParty: "IPinfo" },
          { tool: "DNS Lookup", icon: <Zap size={15} className="text-amber-700 dark:text-amber-400" />, api: "Hostname", thirdParty: "Cloudflare DoH" },
          { tool: "SSL / Redirect / Header", icon: <LockKeyhole size={15} className="text-emerald-700 dark:text-emerald-400" />, api: "Hostname or URL", thirdParty: "Target website" },
          { tool: "DNS Leak", icon: <ShieldCheck size={15} className="text-indigo-700 dark:text-indigo-400" />, api: "Session token + resolver IP", thirdParty: "Self-hosted probe + IPinfo" },
          { tool: "WebRTC Leak", icon: <Radio size={15} className="text-sky-700 dark:text-sky-400" />, api: "Candidates are not sent to the API", thirdParty: "Self-hosted STUN sees source IP" },
        ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
          <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
          {t.nav.privacy}
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-[-.05em] text-brand-950 sm:text-5xl dark:text-brand-50">
          {t.nav.privacy}
        </h1>
        <p className="mt-5 text-lg leading-8 text-brand-900/75 dark:text-brand-100/75 font-medium">
          {t.ui.privacyPromiseText}
        </p>
      </div>

      {/* ── Top 2 Architecture Cards ── */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[28px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-raised dark:border-emerald-700/50 dark:from-emerald-950/40 dark:via-brand-950/80 dark:to-brand-950">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-800 shadow-2xs group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
              <LockKeyhole size={20} />
            </span>
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
              {locale === "vi" ? "Dữ liệu không rời trình duyệt" : "Data that stays in your browser"}
            </h2>
          </div>
          <p className="mt-4 text-sm font-medium leading-7 text-brand-900/75 dark:text-brand-100/75">
            {locale === "vi"
              ? "TOTP secret, mật khẩu, JWT, ảnh QR, file, input hash và JSON được xử lý cục bộ. Chúng không nằm trong URL, analytics hoặc local storage."
              : "TOTP secrets, passwords, JWTs, QR images, files, hash inputs and JSON are processed locally. They are not placed in URLs, analytics or local storage."}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-[28px] border-2 border-teal-300/80 bg-gradient-to-br from-teal-50/90 via-sky-50/40 to-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-raised dark:border-teal-700/50 dark:from-teal-950/40 dark:via-brand-950/80 dark:to-brand-950">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-teal-400/40 bg-teal-500/15 text-teal-800 shadow-2xs group-hover:scale-110 group-hover:bg-teal-500/25 transition-all dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300">
              <Radio size={20} />
            </span>
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
              {locale === "vi" ? "Chẩn đoán mạng có disclosure" : "Disclosed network diagnostics"}
            </h2>
          </div>
          <p className="mt-4 text-sm font-medium leading-7 text-brand-900/75 dark:text-brand-100/75">
            {locale === "vi"
              ? "10 công cụ mạng chỉ chạy sau khi bạn bấm kiểm tra. IP, hostname hoặc URL cần thiết có thể đi qua API SFranKey và nhà cung cấp ghi rõ trong bảng dưới."
              : "Ten network tools run only after you press Check. The required IP, hostname or URL may pass through the SFranKey API and the provider listed below."}
          </p>
        </div>
      </div>

      {/* ── Network Data Boundary Bento Table Card ── */}
      <div className="mt-12 sm:mt-14 overflow-hidden rounded-[32px] border-2 border-emerald-300/80 bg-white shadow-soft backdrop-blur-xl transition-all duration-300 hover:border-emerald-400 hover:shadow-raised dark:border-emerald-700/50 dark:bg-brand-950/80">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-emerald-50/90 px-8 py-6 dark:border-emerald-800/60 dark:bg-gradient-to-r dark:from-emerald-950/80 dark:via-brand-950 dark:to-teal-950/80">
          <div>
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
              {locale === "vi" ? "Ranh giới dữ liệu công cụ mạng" : "Network-tool data boundary"}
            </h2>
            <p className="mt-1 text-xs font-medium text-brand-800/75 dark:text-brand-200/75">
              {locale === "vi" ? "Minh bạch 100% từng trường dữ liệu được truyền tải" : "100% explicit transparency on data transmission"}
            </p>
          </div>
          <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-1.5 text-xs font-extrabold text-emerald-950 shadow-2xs dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-200">
            {locale === "vi" ? "Chỉ chạy theo yêu cầu" : "On-Demand Only"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-emerald-200/70 bg-emerald-50/50 text-[10px] font-black uppercase tracking-[.18em] text-emerald-900 dark:border-emerald-800/60 dark:bg-black/20 dark:text-emerald-300">
              <tr>
                <th className="px-8 py-4.5">{locale === "vi" ? "CÔNG CỤ" : "TOOL"}</th>
                <th className="px-8 py-4.5">{locale === "vi" ? "DỮ LIỆU TỚI API SFRANKEY" : "SENT TO SFRANKEY API"}</th>
                <th className="px-8 py-4.5">{locale === "vi" ? "NHÀ CUNG CẤP / BÊN THỨ 3" : "THIRD PARTY / TARGET"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100/80 text-brand-950 dark:divide-brand-800/50 dark:text-brand-100">
              {rows.map((row) => (
                <tr key={row.tool} className="group transition-colors hover:bg-emerald-50/70 dark:hover:bg-emerald-900/20">
                  <td className="px-8 py-5 font-bold">
                    <div className="flex items-center gap-3.5">
                      <span className="flex size-9 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-500/10 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-400/10 dark:text-emerald-300 shadow-2xs group-hover:scale-110 transition-transform">
                        {row.icon}
                      </span>
                      <span className="text-sm font-extrabold text-brand-950 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-300 transition-colors">{row.tool}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/20 bg-emerald-50/80 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-950/60 dark:text-emerald-200">
                      {row.api}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-1 rounded-xl border border-sky-500/20 bg-sky-50 px-3.5 py-1.5 text-xs font-bold text-sky-900 dark:border-sky-400/20 dark:bg-sky-950/60 dark:text-sky-200">
                      {row.thirdParty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Clear Local Data Card ── */}
      <div className="group mt-12 sm:mt-14 rounded-[28px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-8 sm:p-9 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-raised dark:border-emerald-700/50 dark:from-emerald-950/30 dark:via-brand-950 dark:to-brand-900/40">
        <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
          {locale === "vi" ? "Xóa dữ liệu cục bộ" : "Clear local data"}
        </h2>
        <p className="mt-3 text-sm font-medium leading-7 text-brand-900/75 dark:text-brand-100/75 max-w-2xl">
          {locale === "vi"
            ? "Xóa theme, ngôn ngữ, favorite, recent tools và splash marker trên thiết bị này. Input và kết quả mạng không được lưu vào đây."
            : "Clear theme, language, favorites, recent tools and the splash marker from this device. Network inputs and results are not stored here."}
        </p>
        <div className="mt-6">
          <ClearLocalData label={t.common.clear} locale={locale} />
        </div>
      </div>
    </div>
  );
}
