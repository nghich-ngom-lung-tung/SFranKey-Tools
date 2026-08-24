import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { Sparkles, MessageSquarePlus, ShieldCheck } from "@sfrankey/ui";
import { FeedbackForm } from "@/components/feedback-form";
import { localizedMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return localizedMetadata(locale, "request-a-tool", t.feedback.requestTitle, t.ui.requestCtaText);
}

export default async function RequestToolPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ── Page Header ── */}
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-200">
          <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
          {t.ui.footerFeedback}
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-[-.05em] text-brand-950 sm:text-4xl lg:text-5xl dark:text-brand-50">
          {t.feedback.requestTitle}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-brand-900/75 sm:text-lg dark:text-brand-100/75">
          {locale === "vi"
            ? "Gợi ý một công cụ hữu ích mà bạn muốn có trên SFranKey. Chúng tôi luôn ưu tiên phát triển các công cụ Local-first an toàn và tiện lợi."
            : "Suggest a useful tool you'd like to see on SFranKey. We prioritize building fast, local-first developer & privacy utilities."}
        </p>
      </div>

      {/* ── Main Form Bento Card ── */}
      <div className="mt-10 overflow-hidden rounded-[32px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:border-emerald-400 hover:shadow-raised sm:p-10 dark:border-emerald-700/50 dark:from-emerald-950/40 dark:via-brand-950/80 dark:to-brand-950">
        <div className="flex items-center gap-3.5 border-b border-emerald-200/70 pb-6 dark:border-emerald-800/60">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-800 shadow-2xs dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
            <MessageSquarePlus size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-brand-950 dark:text-brand-50">
              {locale === "vi" ? "Thông Tin Đề Xuất" : "Suggestion Details"}
            </h2>
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {locale === "vi" ? "Chúng tôi sẽ phản hồi sớm nhất có thể" : "We review all community suggestions"}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <FeedbackForm locale={locale} kind="tool_request" />
        </div>
      </div>
    </div>
  );
}
