import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { FeedbackForm } from "@/components/feedback-form";
export default async function ReportBugPage({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; const t = getDictionary(locale); return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="text-4xl font-black">{t.feedback.bugTitle}</h1><p className="mt-4 mb-8 text-slate-500">{locale === "vi" ? "Mô tả lỗi mà không bao gồm secret, mật khẩu hoặc token thật." : "Describe the issue without including real secrets, passwords or tokens."}</p><FeedbackForm locale={locale} kind="bug_report" /></div>; }
