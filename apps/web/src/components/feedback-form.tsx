"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { Button, Input, Label, Textarea, Check, AlertTriangle, Send } from "@sfrankey/ui";

export function FeedbackForm({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "bug_report" | "tool_request";
}) {
  const t = getDictionary(locale);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = React.useState({ subject: "", message: "", email: "", website: "" });
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const turnstileRef = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  React.useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;
    const render = () => {
      if (window.turnstile && turnstileRef.current && !widgetId.current) {
        widgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: setTurnstileToken,
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
        });
      }
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (siteKey && !turnstileToken) {
          setStatus("error");
          return;
        }
        setStatus("loading");
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/feedback`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                ...form,
                kind,
                locale,
                pageUrl: window.location.href,
                turnstileToken,
              }),
            }
          );
          if (!response.ok) throw new Error("Request failed");
          setStatus("success");
          setForm({ subject: "", message: "", email: "", website: "" });
          setTurnstileToken("");
        } catch {
          setStatus("error");
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-xs font-black uppercase tracking-wider text-brand-950 dark:text-brand-100">
          {t.feedback.subject}
        </Label>
        <Input
          id="subject"
          required
          minLength={3}
          maxLength={160}
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder={locale === "vi" ? "Nhập tiêu đề hoặc tên công cụ..." : "Brief title or tool name..."}
          className="rounded-2xl border-brand-300/80 bg-white/90 p-3.5 text-sm font-medium shadow-2xs dark:border-brand-700/60 dark:bg-brand-900/60"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-xs font-black uppercase tracking-wider text-brand-950 dark:text-brand-100">
          {t.feedback.message}
        </Label>
        <Textarea
          id="message"
          required
          rows={5}
          minLength={10}
          maxLength={5000}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder={locale === "vi" ? "Mô tả chi tiết yêu cầu, cách tái hiện lỗi, hoặc tính năng mong muốn..." : "Describe the tool, steps to reproduce, or desired features..."}
          className="rounded-2xl border-brand-300/80 bg-white/90 p-3.5 text-sm font-medium shadow-2xs dark:border-brand-700/60 dark:bg-brand-900/60"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-brand-950 dark:text-brand-100">
          {t.feedback.email} <span className="text-[11px] font-normal text-brand-800/60 dark:text-brand-200/60">({locale === "vi" ? "không bắt buộc" : "optional"})</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="your@email.com"
          className="rounded-2xl border-brand-300/80 bg-white/90 p-3.5 text-sm font-medium shadow-2xs dark:border-brand-700/60 dark:bg-brand-900/60"
        />
      </div>

      {/* Honeypot for spam prevention */}
      <input
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
      />

      {siteKey ? <div ref={turnstileRef} className="min-h-16" /> : null}

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="w-full sm:w-auto rounded-2xl bg-brand-500 px-8 font-black text-brand-950 shadow-soft hover:bg-brand-400 hover:shadow-raised"
        >
          {status === "loading" ? (
            <span>{t.common.loading}...</span>
          ) : (
            <span className="flex items-center gap-2">
              <span>{t.feedback.submit}</span>
              <Send size={15} />
            </span>
          )}
        </Button>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-950 dark:text-emerald-200">
          <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
          <p role="status">{t.feedback.success}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-4 text-xs font-bold text-rose-950 dark:text-rose-200">
          <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
          <p role="alert">{t.feedback.failure}</p>
        </div>
      )}
    </form>
  );
}
