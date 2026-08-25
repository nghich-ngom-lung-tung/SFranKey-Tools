"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import type {
  JsonDiagnostic,
  JsonIndent,
  JsonOperation,
  JsonTransformResult,
} from "@sfrankey/tool-core/json";
import { downloadText } from "@/lib/download";
import { useToast } from "./toast-provider";
import {
  AlertTriangle,
  ArrowDownUp,
  Braces,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileCode,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  WrapText,
  Zap,
} from "lucide-react";

type WorkerResponse =
  | { type: "working"; jobId: string }
  | { type: "result"; jobId: string; result: JsonTransformResult }
  | { type: "diagnostic"; jobId: string; diagnostic: JsonDiagnostic }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

function makeWorker() {
  return new Worker(new URL("../workers/json.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function JsonFormatterWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [input, setInput] = React.useState("");
  const [operation, setOperation] = React.useState<JsonOperation>("format");
  const [indent, setIndent] = React.useState<JsonIndent>({
    kind: "spaces",
    size: 2,
  });
  const [sortKeys, setSortKeys] = React.useState(false);
  const [result, setResult] = React.useState<JsonTransformResult | null>(null);
  const [diagnostic, setDiagnostic] = React.useState<JsonDiagnostic | null>(null);
  const [error, setError] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [wrapOutput, setWrapOutput] = React.useState(true);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const jobRef = React.useRef("");

  const stopWorker = React.useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    jobRef.current = "";
    setWorking(false);
  }, []);

  React.useEffect(() => () => stopWorker(), [stopWorker]);

  React.useEffect(() => {
    stopWorker();
    setResult(null);
    setDiagnostic(null);
    setError("");
  }, [input, operation, indent, sortKeys, stopWorker]);

  const copyToClipboard = async (textToCopy: string, fieldId = "main") => {
    if (!textToCopy) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedField(fieldId);
      toast({
        title: common.copied,
        variant: "success",
      });
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput(text);
          toast({
            title: locale === "vi" ? "Đã dán từ clipboard" : "Pasted from clipboard",
            variant: "success",
          });
        }
      }
    } catch {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  const handleLoadSample = () => {
    setInput(
      JSON.stringify(
        {
          name: "SFranKey",
          version: "1.0.0",
          private: true,
          tools: ["2fa", "password", "qr", "base64", "hash", "json"],
          features: {
            localFirst: true,
            telemetry: false,
            workers: true,
          },
        },
        null,
        2,
      ),
    );
    setError("");
    setDiagnostic(null);
  };

  const run = () => {
    stopWorker();
    const jobId =
      crypto.randomUUID?.() ??
      `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
    let worker: Worker;
    try {
      worker = makeWorker();
    } catch {
      setWorking(false);
      setError(t.json.errors.WORKER_UNAVAILABLE);
      return;
    }
    workerRef.current = worker;
    jobRef.current = jobId;
    setWorking(true);
    setError("");
    setDiagnostic(null);
    setResult(null);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.jobId !== jobRef.current) return;
      if (response.type === "working") return;
      if (response.type === "result") {
        setResult(response.result);
        setWorking(false);
        worker.terminate();
        workerRef.current = null;
        return;
      }
      if (response.type === "diagnostic") {
        setDiagnostic(response.diagnostic);
        setWorking(false);
        worker.terminate();
        workerRef.current = null;
        return;
      }
      if (response.type === "error") {
        setError(
          t.json.errors[response.code as keyof typeof t.json.errors] ??
            t.json.errors.PROCESSING_FAILED,
        );
        setWorking(false);
        worker.terminate();
        workerRef.current = null;
        return;
      }
      if (response.type === "canceled") {
        setWorking(false);
        worker.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = () => {
      if (jobRef.current === jobId) {
        setError(t.json.errors.WORKER_UNAVAILABLE);
        setWorking(false);
      }
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage({
      type: "process",
      jobId,
      input,
      options: { operation, indent, sortKeys },
    });
  };

  const cancel = () => {
    if (workerRef.current && jobRef.current) {
      workerRef.current.postMessage({ type: "cancel", jobId: jobRef.current });
    }
    stopWorker();
  };

  const reset = () => {
    cancel();
    setInput("");
    setResult(null);
    setDiagnostic(null);
    setError("");
    setOperation("format");
    setIndent({ kind: "spaces", size: 2 });
    setSortKeys(false);
  };

  const output = result?.output ?? "";

  const jumpToError = () => {
    if (!diagnostic || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(
      diagnostic.offset,
      diagnostic.offset + diagnostic.length,
    );
  };

  const inputBytes = new TextEncoder().encode(input).byteLength;

  return (
    <div className="w-full space-y-6">
      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Input & Options Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <FileCode size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "JSON Đầu vào & Tùy chọn" : "JSON Input & Options"}</span>
              </div>
            </div>

            {/* Operation & Indent Pills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Operation Mode Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.json.output}
                </label>
                <div
                  role="tablist"
                  aria-label={t.json.output}
                  className="grid grid-cols-3 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40"
                >
                  {(["format", "minify", "validate"] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      role="tab"
                      aria-selected={operation === op}
                      onClick={() => setOperation(op)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        operation === op
                          ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                          : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                      }`}
                    >
                      {op === "format"
                        ? t.json.format
                        : op === "minify"
                          ? t.json.minify
                          : t.json.validate}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indentation Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.json.indent}
                </label>
                <div
                  role="tablist"
                  aria-label={t.json.indent}
                  className="grid grid-cols-3 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={indent.kind === "spaces" && indent.size === 2}
                    onClick={() => setIndent({ kind: "spaces", size: 2 })}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                      indent.kind === "spaces" && indent.size === 2
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    2 Sp
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={indent.kind === "spaces" && indent.size === 4}
                    onClick={() => setIndent({ kind: "spaces", size: 4 })}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                      indent.kind === "spaces" && indent.size === 4
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    4 Sp
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={indent.kind === "tab"}
                    onClick={() => setIndent({ kind: "tab" })}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                      indent.kind === "tab"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    Tab
                  </button>
                </div>
              </div>
            </div>

            {/* Sort Keys Switch */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-900 dark:text-brand-100">
              <input
                type="checkbox"
                checked={sortKeys}
                onChange={(event) => setSortKeys(event.target.checked)}
                className="size-4 rounded-md border-emerald-500/30 text-brand-600 focus:ring-brand-500/30 dark:bg-emerald-950/60"
              />
              <ArrowDownUp size={14} className="text-brand-600 dark:text-brand-400" />
              <span>{t.json.sortKeys}</span>
            </label>

            {/* Input Textarea Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="json-input"
                  className="text-xs font-bold text-brand-950 dark:text-brand-50"
                >
                  {t.json.input}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                  >
                    <Clipboard size={12} />
                    <span>{locale === "vi" ? "Dán" : "Paste"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                  >
                    <Sparkles size={12} />
                    <span>{locale === "vi" ? "Mẫu" : "Sample"}</span>
                  </button>
                  {input ? (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 size={12} />
                      <span>{common.clear}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <textarea
                ref={inputRef}
                id="json-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.json.placeholder}
                rows={9}
                spellCheck={false}
                className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-xs text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
              />

              <div className="flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60">
                <span>
                  {input.length.toLocaleString(locale)} {locale === "vi" ? "ký tự" : "characters"}
                </span>
                <span>
                  {inputBytes.toLocaleString(locale)} / 5,242,880 bytes
                </span>
              </div>
            </div>

            {/* Error Message Box */}
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </div>
            ) : null}

            {/* Diagnostic Alert Box */}
            {diagnostic ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs space-y-2 text-rose-950 dark:text-rose-100"
              >
                <div className="flex items-center justify-between">
                  <strong className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" />
                    <span>{t.json.diagnosticTitle}</span>
                  </strong>
                  <button
                    type="button"
                    onClick={jumpToError}
                    className="rounded-lg bg-rose-600 px-2 py-1 font-bold text-white shadow-2xs hover:bg-rose-700 transition"
                  >
                    {t.json.goToError}
                  </button>
                </div>
                <p className="font-medium opacity-90">
                  {t.json.errors[diagnostic.code] ?? t.json.errors.INVALID_JSON}
                </p>
                <div className="flex items-center gap-3 font-mono text-[11px] opacity-75">
                  <span>Dòng (Line): {diagnostic.line}</span>
                  <span>Cột (Column): {diagnostic.column}</span>
                  <span>Offset: {diagnostic.offset}</span>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={run}
                disabled={working}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98 disabled:opacity-50"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>
                  {working
                    ? t.shared.working
                    : operation === "validate"
                      ? t.json.validate
                      : operation === "format"
                        ? t.json.format
                        : t.json.minify}
                </span>
              </button>

              {working ? (
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition"
                >
                  {t.json.cancel}
                </button>
              ) : null}

              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-brand-200/80 bg-white/90 px-4 py-3 text-xs font-bold text-brand-800 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200 transition"
              >
                {t.shared.reset}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.shared.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Output & Inspector Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.json.output}</span>
            </div>

            {result ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <CheckCircle2 size={13} className="text-brand-600 dark:text-brand-300" />
                <span>{operation === "minify" ? "Minified JSON" : "Formatted JSON"}</span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 w-full">
            {result ? (
              <div className="w-full space-y-3">
                {/* Metric breakdown badge */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Input Size
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {result.inputBytes.toLocaleString(locale)} bytes
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Output Size
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {(result.outputBytes ?? 0).toLocaleString(locale)} bytes
                    </strong>
                  </div>
                </div>

                {/* Output code viewer */}
                <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 shadow-sm space-y-2 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                      {output ? "JSON Output" : t.json.valid}
                    </span>
                    {output ? (
                      <button
                        type="button"
                        onClick={() => setWrapOutput((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-50"
                      >
                        <WrapText size={13} />
                        <span>{wrapOutput ? "No Wrap" : "Wrap"}</span>
                      </button>
                    ) : null}
                  </div>

                  <pre
                    className={`max-h-72 sm:max-h-80 overflow-auto font-mono text-xs text-brand-950 select-all dark:text-brand-50 p-1 ${
                      wrapOutput ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                    }`}
                  >
                    {output || t.json.valid}
                  </pre>
                </div>
              </div>
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Braces size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {t.json.emptyResult}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Kết quả JSON được định dạng hoặc rút gọn sẽ hiển thị tại đây."
                      : "Formatted or minified JSON will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {output ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(output, "json-copy")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                >
                  {copiedField === "json-copy" ? (
                    <Check size={16} className="stroke-[2.5]" />
                  ) : (
                    <Copy size={16} className="stroke-[2.5]" />
                  )}
                  <span>{t.json.copy}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadText({
                      value: output,
                      fileName:
                        operation === "minify"
                          ? "sfrankey-minified.json"
                          : "sfrankey-formatted.json",
                      mimeType: "application/json;charset=utf-8",
                    })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/90 py-3 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 transition"
                >
                  <Download size={14} />
                  <span>{t.json.download}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
