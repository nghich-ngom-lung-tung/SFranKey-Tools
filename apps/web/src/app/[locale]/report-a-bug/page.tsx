import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { AlertTriangle, Sparkles, Bug } from "@sfrankey/ui";
import { FeedbackForm } from "@/components/shared/feedback-form";
import { localizedMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return localizedMetadata(locale, "report-a-bug", t.feedback.bugTitle, t.feedback.message);
}

export default async function ReportBugPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ── Page Header ── */}
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/80 bg-white/90 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-rose-950 shadow-xs dark:border-rose-700 dark:bg-rose-950/90 dark:text-rose-200">
          <Bug size={13} className="text-rose-600 dark:text-rose-400" />
          {t.ui.footerFeedback}
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-[-.05em] text-brand-950 sm:text-4xl lg:text-5xl dark:text-brand-50">
          {t.feedback.bugTitle}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-brand-900/75 sm:text-lg dark:text-brand-100/75">
          {locale === "vi"
            ? "Gặp sự cố hoặc lỗi hiển thị? Hãy mô tả chi tiết để đội ngũ SFranKey có thể tái hiện và khắc phục ngay."
            : "Encountered an issue or glitch? Describe it below so we can reproduce and patch it immediately."}
        </p>
      </div>

      {/* ── Main Form Bento Card ── */}
      <div className="mt-10 overflow-hidden rounded-[32px] border-2 border-rose-300/80 bg-gradient-to-br from-rose-50/70 via-orange-50/20 to-white p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:border-rose-400 hover:shadow-raised sm:p-10 dark:border-rose-700/50 dark:from-rose-950/30 dark:via-brand-950/80 dark:to-brand-950">
        <div className="flex items-center gap-3.5 border-b border-rose-200/70 pb-6 dark:border-rose-800/60">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/15 text-rose-800 shadow-2xs dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-brand-950 dark:text-brand-50">
              {locale === "vi" ? "Chi Tiết Sự Cố" : "Bug Report Details"}
            </h2>
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
              {locale === "vi" ? "Thông tin chẩn đoán sẽ được gửi trực tiếp tới đội ngũ kỹ thuật" : "Diagnostic details are reviewed by engineers"}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <FeedbackForm locale={locale} kind="bug_report" />
        </div>
      </div>
    </div>
  );
}
