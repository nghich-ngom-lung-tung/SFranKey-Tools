import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Cpu,
  Globe,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "@sfrankey/ui";
import { localizedMetadata } from "@/lib/metadata";
import Link from "next/link";
import { localePath } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return localizedMetadata(
    locale,
    "security",
    t.nav.security,
    locale === "vi"
      ? "Mô hình bảo mật, SSRF guard và giới hạn kỹ thuật của SFranKey."
      : "SFranKey security model, SSRF guard and technical limitations."
  );
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const invariants =
    locale === "vi"
      ? [
          {
            title: "Xử lý Local-First 100%",
            desc: "Secret, mật khẩu, JWT, mã QR, file hash và JSON chỉ xử lý trong bộ nhớ RAM trình duyệt, không bao giờ gửi về máy chủ.",
          },
          {
            title: "Bảo vệ SSRF & Pin IP Công Khai",
            desc: "Network checker chỉ cho phép HTTP/HTTPS mặc định, tự động resolve và ghim IP công khai trước khi gửi gói tin, revalidate từng redirect.",
          },
          {
            title: "Chặn hoàn toàn Private & Loopback",
            desc: "Private IP, 127.0.0.1, link-local, cloud metadata endpoint (169.254.169.254) và mixed DNS đều bị từ chối trước kết nối.",
          },
          {
            title: "Đồng bộ Envelope & Rate Limiting",
            desc: "Mọi request mạng đều được cấp Request ID, kiểm soát CORS nghiêm ngặt và giới hạn tần suất request minh bạch.",
          },
        ]
      : [
          {
            title: "100% Local-First Execution",
            desc: "Secrets, passwords, JWTs, QR codes, file hashes and JSON are computed purely in local browser RAM and never sent to our servers.",
          },
          {
            title: "SSRF Protection & Public IP Pinning",
            desc: "Network checkers restrict ports to default HTTP/HTTPS, resolve and pin public IPs before socket connections, and revalidate on every redirect.",
          },
          {
            title: "Zero Private & Loopback Access",
            desc: "Private IPs, 127.0.0.1, link-local, cloud metadata endpoints (169.254.169.254) and mixed DNS targets are blocked prior to connection.",
          },
          {
            title: "Uniform Envelope & Strict Rate Limits",
            desc: "All network diagnostic requests carry a traceable Request ID, enforce tight CORS, and apply uniform rate-limiting envelopes.",
          },
        ];

  const limitations =
    locale === "vi"
      ? [
          {
            title: "JWT Decoder chỉ giải mã cấu trúc",
            desc: "Công cụ phân tích cấu trúc Header và Payload của token, không tự động xác minh tính hợp lệ của chữ ký cryptographic phía server.",
          },
          {
            title: "Tín hiệu chẩn đoán mạng mang tính heuristic",
            desc: "VPN, Proxy, DNS leak và kiểm tra cổng cung cấp thông tin tham khảo kỹ thuật, có thể xuất hiện sai số (false positive/negative).",
          },
          {
            title: "Không thay thế kiểm toán bảo mật chuyên nghiệp",
            desc: "SFranKey là bộ công cụ hỗ trợ quy trình làm việc hằng ngày, không thể thay thế cho hệ thống quản lý mật khẩu doanh nghiệp hay audit an ninh.",
          },
        ]
      : [
          {
            title: "JWT Decoder parses structure only",
            desc: "The tool decodes and formats Header and Payload claims for inspection; it does not cryptographic-verify the backend signature.",
          },
          {
            title: "Network signals are diagnostic heuristics",
            desc: "VPN, Proxy, DNS leak and header checks provide diagnostic insights with potential false positives or negatives.",
          },
          {
            title: "Not an enterprise security audit substitute",
            desc: "SFranKey aids daily developer & security workflows but does not replace dedicated enterprise password vaults or professional penetration audits.",
          },
        ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ── Page Header ── */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
          <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
          {t.nav.security}
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-[-.05em] text-brand-950 sm:text-5xl dark:text-brand-50">
          {locale === "vi" ? "Tiêu Chuẩn Kỹ Thuật Bảo Mật" : "Security Baseline & Model"}
        </h1>
        <p className="mt-5 text-lg font-medium leading-8 text-brand-900/75 dark:text-brand-100/75">
          {locale === "vi"
            ? "Bảo mật là một phần của thiết kế: secret không bao giờ vào URL, log, analytics hoặc localStorage; target mạng được kiểm tra nghiêm ngặt trước khi kết nối."
            : "Security is baked into the architecture: secrets never enter URLs, logs, analytics, or localStorage; network targets are strictly validated before connection."}
        </p>
      </div>

      {/* ── 2 Main Security Baseline Pillars ── */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* Pillar 1: Invariants Bảo Mật */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/95 via-teal-50/40 to-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-raised dark:border-emerald-700/50 dark:from-emerald-950/40 dark:via-brand-950/80 dark:to-brand-950">
          <div>
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-800 shadow-2xs group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
                  {locale === "vi" ? "Invariant Bảo Mật Cốt Lõi" : "Core Security Invariants"}
                </h2>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  {locale === "vi" ? "Cam kết kỹ thuật bất biến" : "Guaranteed technical baselines"}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {invariants.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 shadow-2xs transition-all duration-200 hover:bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-brand-900/60 dark:hover:bg-emerald-950/30"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-brand-950 dark:text-brand-50">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-brand-900/75 dark:text-brand-100/75 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 2: Giới Hạn Cần Nhớ */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-raised dark:border-amber-700/50 dark:from-amber-950/30 dark:via-brand-950/80 dark:to-brand-950">
          <div>
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-800 shadow-2xs group-hover:scale-110 group-hover:bg-amber-500/25 transition-all dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">
                  {locale === "vi" ? "Giới Hạn Cần Nhớ" : "Important Limitations"}
                </h2>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {locale === "vi" ? "Minh bạch về phạm vi công cụ" : "Explicit operational boundaries"}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {limitations.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-amber-200/80 bg-white/90 p-5 shadow-2xs transition-all duration-200 hover:bg-amber-50/50 dark:border-amber-800/60 dark:bg-brand-900/60 dark:hover:bg-amber-950/30"
                >
                  <h3 className="text-sm font-black text-brand-950 dark:text-brand-50">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-brand-900/75 dark:text-brand-100/75 font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 text-xs font-medium text-amber-950 dark:text-amber-200">
            {locale === "vi"
              ? "SFranKey luôn đặt tiêu chí minh bạch lên hàng đầu để bạn an tâm sử dụng trong mọi môi trường lập trình."
              : "SFranKey puts radical transparency first so you can operate with peace of mind in any development workflow."}
          </div>
        </div>
      </div>

      {/* ── Cryptographic Foundation Bento Banner ── */}
      <div className="mt-12 sm:mt-14 overflow-hidden rounded-[32px] border-2 border-emerald-300/80 bg-white p-8 shadow-soft backdrop-blur-xl transition-all duration-300 hover:border-emerald-400 hover:shadow-raised dark:border-emerald-700/50 dark:bg-brand-950/80 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
                <LockKeyhole size={15} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[.18em] text-emerald-800 dark:text-emerald-300">
                {locale === "vi" ? "Tiêu chuẩn Mật mã" : "Cryptographic Standards"}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-brand-950 dark:text-brand-50">
              {locale === "vi"
                ? "CSPRNG, Web Crypto API & WebAssembly"
                : "CSPRNG, Web Crypto API & WebAssembly"}
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-brand-900/75 dark:text-brand-100/75">
              {locale === "vi"
                ? "Mọi số ngẫu nhiên cho TOTP và mật khẩu được sinh từ hệ thống ngẫu nhiên mật mã chuẩn `window.crypto.getRandomValues`. Các thuật toán băm SHA/MD5 được biên dịch qua WebAssembly cho tốc độ vượt trội và độ an toàn tuyệt đối."
                : "All randomness for TOTP and passwords derives from cryptographically secure `window.crypto.getRandomValues`. SHA/MD5 hashes compile via WebAssembly for blistering speed and absolute isolation."}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={localePath(locale, "privacy")}
              className="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-emerald-300/90 bg-emerald-50/80 px-6 py-4 text-xs font-black text-emerald-950 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-soft dark:border-emerald-700/60 dark:bg-brand-900/80 dark:text-emerald-200 dark:hover:bg-emerald-500 dark:hover:text-brand-950"
            >
              <ShieldCheck size={16} className="text-emerald-700 group-hover:text-white transition-colors dark:text-emerald-400 dark:group-hover:text-brand-950" />
              <span>{locale === "vi" ? "Xem Mô Hình Quyền Riêng Tư" : "View Privacy Model"}</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
