"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import {
  compareDigest,
  type DigestFormat,
  type HashAlgorithm,
} from "@sfrankey/tool-core/hash";
import { getDictionary } from "@sfrankey/i18n";
import { FileDropzone } from "@/components/file-dropzone";
import { downloadBlob } from "@/lib/download";
import { useToast } from "./toast-provider";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileCode,
  FileUp,
  Hash,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type WorkerResponse =
  | {
      type: "progress";
      jobId: string;
      processed: number;
      total: number;
      percent: number;
    }
  | { type: "result"; jobId: string; digest: string; durationMs: number }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

const MAX_FILE = 200 * 1024 * 1024;

export function FileChecksumWorkspace({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.encodingSuite.checksum;
  const shared = dictionary.encodingSuite.shared;
  const common = dictionary.common;
  const { toast } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [algorithm, setAlgorithm] = React.useState<HashAlgorithm>("SHA-256");
  const [format, setFormat] = React.useState<DigestFormat>("hex");
  const [expected, setExpected] = React.useState("");
  const [result, setResult] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const workerRef = React.useRef<Worker | null>(null);
  const jobRef = React.useRef("");

  const terminate = React.useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    jobRef.current = "";
    setWorking(false);
  }, []);

  React.useEffect(() => () => terminate(), [terminate]);

  React.useEffect(() => {
    terminate();
    setResult("");
    setProgress(0);
    setError("");
  }, [file, algorithm, format, terminate]);

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

  const start = () => {
    if (!file) return;
    if (file.size > MAX_FILE) {
      setError(t.tooLarge);
      return;
    }

    terminate();
    const jobId = crypto.randomUUID();
    jobRef.current = jobId;
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/file-hash.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      jobRef.current = "";
      setError(t.workerError);
      return;
    }
    workerRef.current = worker;
    setWorking(true);
    setProgress(0);
    setError("");

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.jobId !== jobRef.current) return;
      if (message.type === "progress") {
        setProgress(message.percent);
        return;
      }
      terminate();
      if (message.type === "result") setResult(message.digest);
      else if (message.type === "error") setError(t.workerError);
    };
    worker.onerror = () => {
      terminate();
      setError(t.workerError);
    };
    worker.postMessage({ type: "start", jobId, file, algorithm, format });
  };

  const comparison =
    result && expected
      ? compareDigest(result, expected, algorithm, format)
      : null;

  const cancel = () => {
    workerRef.current?.postMessage({ type: "cancel", jobId: jobRef.current });
    terminate();
    setProgress(0);
  };

  const reset = () => {
    terminate();
    setFile(null);
    setExpected("");
    setResult("");
    setProgress(0);
    setError("");
  };

  const bitLength =
    algorithm === "SHA-256" ? 256 : algorithm === "SHA-384" ? 384 : 512;

  return (
    <div className="w-full space-y-6">
      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Input & File Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <FileCode size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Tệp tin & Cấu hình" : "File & Configuration"}</span>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700/75 hover:text-brand-950 dark:text-brand-300/75 dark:hover:text-brand-50 transition"
              >
                <RotateCcw size={13} />
                <span>{common.reset}</span>
              </button>
            </div>

            {/* Algorithm & Format Selection Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Algorithm Pill Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.algorithm}
                </label>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                  {(["SHA-256", "SHA-384", "SHA-512"] as const).map((algo) => (
                    <button
                      key={algo}
                      type="button"
                      onClick={() => setAlgorithm(algo)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        algorithm === algo
                          ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                          : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                      }`}
                    >
                      {algo.replace("SHA-", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Digest Format Pill Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.format}
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                  <button
                    type="button"
                    onClick={() => setFormat("hex")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      format === "hex"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    Hex
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("base64")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      format === "base64"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    Base64
                  </button>
                </div>
              </div>
            </div>

            {/* File Dropzone Area */}
            <div className="space-y-2">
              <FileDropzone
                id="checksum-file"
                accept={["*/*"]}
                maxBytes={MAX_FILE}
                file={file}
                labels={{
                  idle: t.dropFile,
                  active: t.progress,
                  browse: t.browse,
                  remove: shared.reset,
                }}
                onFile={setFile}
                onRejected={(code) =>
                  setError(code === "size" ? t.tooLarge : t.workerError)
                }
                onClear={() => setFile(null)}
              />

              {/* File Info Details Badge */}
              {file ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/25 bg-white/95 p-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <FileUp size={14} />
                    </span>
                    <div className="min-w-0">
                      <strong className="truncate font-mono text-brand-950 dark:text-brand-50 block">
                        {file.name}
                      </strong>
                      <span className="text-[11px] text-brand-700/60 dark:text-brand-300/60">
                        {file.type || t.unknownType}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-800 dark:text-brand-200 shrink-0">
                    {(file.size / 1024 / 1024).toFixed(2)} MB ({file.size.toLocaleString(locale)} {t.bytes})
                  </span>
                </div>
              ) : null}
            </div>

            {/* Optional Expected Checksum for Verification */}
            <div className="space-y-1.5">
              <label
                htmlFor="checksum-expected"
                className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1.5"
              >
                <ShieldCheck size={13} className="text-brand-600 dark:text-brand-400" />
                <span>{t.expected}</span>
              </label>
              <input
                id="checksum-expected"
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                placeholder={
                  locale === "vi"
                    ? "Dán mã SHA-256 / SHA-512 do nhà phát hành cung cấp..."
                    : "Paste expected SHA checksum from publisher..."
                }
                className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3.5 py-2.5 font-mono text-xs text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
              />
            </div>

            {/* Error Alert Box */}
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={!file || working}
                onClick={start}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98 disabled:opacity-50"
              >
                <Zap size={16} className="stroke-[2.5]" />
                <span>{t.calculate}</span>
              </button>

              {working ? (
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition"
                >
                  {t.cancel}
                </button>
              ) : null}

              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-brand-200/80 bg-white/90 px-4 py-3 text-xs font-bold text-brand-800 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200 transition"
              >
                {shared.reset}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Output & Integrity Verification Stage */}
        <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-white/95 to-teal-100/50 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.12)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#093325] dark:via-[#06241a] dark:to-[#031c14] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

          {/* Stage Top Bar */}
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
              <span>{t.result}</span>
            </div>

            {result ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <Hash size={13} className="text-brand-600 dark:text-brand-300" />
                <span>{algorithm} · {format === "hex" ? "Hex" : "Base64"}</span>
              </span>
            ) : null}
          </div>

          {/* Main Stage Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 w-full">
            {working ? (
              /* Worker Progress View */
              <div className="w-full space-y-4 rounded-2xl border border-emerald-500/25 bg-white/95 p-6 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/90 text-center">
                <div className="flex items-center justify-center gap-2 font-bold text-sm text-brand-950 dark:text-brand-50">
                  <Sparkles size={16} className="text-brand-600 dark:text-brand-400 animate-spin" />
                  <span>{t.progress}</span>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/80 ring-1 ring-emerald-500/20"
                >
                  <div
                    className="h-full origin-left rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_#10b981]"
                    style={{ width: `${Math.round(progress)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-brand-700/70 dark:text-brand-300/70">
                  <span>{Math.round(progress)}%</span>
                  <button
                    type="button"
                    onClick={cancel}
                    className="font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : result ? (
              <div className="w-full space-y-4">
                {/* Integrity Comparison Result Card (if expected provided) */}
                {comparison ? (
                  <div
                    role="status"
                    className={`rounded-2xl border p-3.5 text-xs flex items-center gap-3 shadow-2xs ${
                      comparison.valid && comparison.matches
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100"
                        : "border-rose-500/40 bg-rose-500/15 text-rose-950 dark:text-rose-100"
                    }`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                        comparison.valid && comparison.matches
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {comparison.valid && comparison.matches ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-xs font-black block">
                        {comparison.valid
                          ? comparison.matches
                            ? locale === "vi"
                              ? "Khớp hoàn toàn (Match)"
                              : t.match
                            : locale === "vi"
                              ? "Không khớp (Does not match)"
                              : t.noMatch
                          : comparison.errorCode === "INVALID_LENGTH"
                            ? t.invalidLength
                            : t.invalidFormat}
                      </strong>
                      <p className="text-[11px] opacity-80">
                        {comparison.valid && comparison.matches
                          ? locale === "vi"
                            ? "File trùng khớp 100% với mã checksum của nhà phát hành."
                            : "File matches expected publisher checksum exactly."
                          : locale === "vi"
                            ? "Mã checksum tính toán khác với mã của nhà phát hành."
                            : "Computed checksum differs from expected string."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Checksum Digest Output Box */}
                <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-2 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center gap-1">
                      <Hash size={13} className="text-brand-600 dark:text-brand-400" />
                      <span>{algorithm} Checksum</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-brand-800/70 dark:text-brand-200/70">
                      {result.length} {locale === "vi" ? "ký tự" : "chars"}
                    </span>
                  </div>

                  <pre className="max-h-48 overflow-auto font-mono text-xs sm:text-sm font-bold text-brand-950 select-all dark:text-brand-50 break-all p-1 leading-relaxed">
                    {result}
                  </pre>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      {locale === "vi" ? "Thuật toán" : "Algorithm"}
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50 text-[11px]">
                      {algorithm}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      {locale === "vi" ? "Độ dài bit" : "Bit length"}
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50 text-[11px]">
                      {bitLength} bits
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      {locale === "vi" ? "Định dạng" : "Format"}
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50 text-[11px]">
                      {format.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <FileCheck size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {file?.name ?? (locale === "vi" ? "Đang chờ chọn file" : "Waiting for file")}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {locale === "vi"
                      ? "Kết quả tính toán checksum sẽ xuất hiện tại đây."
                      : "Computed file checksum will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {result ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(result, "checksum-copy")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                >
                  {copiedField === "checksum-copy" ? (
                    <Check size={16} className="stroke-[2.5]" />
                  ) : (
                    <Copy size={16} className="stroke-[2.5]" />
                  )}
                  <span>{shared.copy}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadBlob({
                      blob: new Blob([result], {
                        type: "text/plain;charset=utf-8",
                      }),
                      fileName: `sfrankey-${algorithm.toLowerCase()}-checksum.txt`,
                    })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/90 py-3 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 transition"
                >
                  <Download size={14} />
                  <span>{shared.download}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
