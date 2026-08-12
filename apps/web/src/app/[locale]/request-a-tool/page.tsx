import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { FeedbackForm } from "@/components/feedback-form";
export default async function RequestToolPage({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; const t = getDictionary(locale); return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="text-4xl font-black">{t.feedback.requestTitle}</h1><p className="mt-4 mb-8 text-slate-500">{locale === "vi" ? "Gợi ý một công cụ hữu ích cho hệ sinh thái SFranKey." : "Suggest a useful addition to the SFranKey toolbox."}</p><FeedbackForm locale={locale} kind="tool_request" /></div>; }
