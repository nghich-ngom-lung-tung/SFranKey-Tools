"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import {
  decodeBase64Alphabet,
  encodeBase64Alphabet,
  estimateBase64DecodedSize,
  parseBase64DataUrlParts,
  type Base64Alphabet,
} from "@sfrankey/tool-core/encoding";
import { getDictionary } from "@sfrankey/i18n";
import { FileDropzone } from "@/components/file-dropzone";
import { downloadBlob, sanitizeDownloadName } from "@/lib/download";
import { useToast } from "./toast-provider";
import {
  ArrowLeftRight,
  Binary,
  Check,
  Clipboard,
  Copy,
  Download,
  FileCode,
  FileText,
  FileUp,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  WrapText,
  Zap,
} from "lucide-react";

type Direction = "encode" | "decode";
type FileOutput = "raw" | "data-url";
type WorkerResponse =
  | { type: "progress"; jobId: string; processed: number; total: number }
  | { type: "encoded"; jobId: string; value: string }
  | { type: "decoded"; jobId: string; bytes: ArrayBuffer; mimeType: string }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

const MAX_FILE = 10 * 1024 * 1024;
const MAX_TEXT = 5 * 1024 * 1024;
const MAX_ENCODED = 14 * 1024 * 1024;

export function Base64Workspace({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.encodingSuite;
  const common = dictionary.common;
  const { toast } = useToast();

  const [tab, setTab] = React.useState<"text" | "file">("text");
  const [direction, setDirection] = React.useState<Direction>("encode");
  const [alphabet, setAlphabet] = React.useState<Base64Alphabet>("standard");
  const [input, setInput] = React.useState("");
  const [textOutput, setTextOutput] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [fileInput, setFileInput] = React.useState("");
  const [fileOutput, setFileOutput] = React.useState<string | null>(null);
  const [decodedFile, setDecodedFile] = React.useState<{
    bytes: ArrayBuffer;
    mimeType: string;
  } | null>(null);
  const [fileOutputType, setFileOutputType] = React.useState<FileOutput>("raw");
  const [mimeType, setMimeType] = React.useState("application/octet-stream");
  const [filename, setFilename] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [wrapOutput, setWrapOutput] = React.useState(true);

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
    setTextOutput(null);
    setError("");
  }, [input, direction, alphabet, tab]);

  React.useEffect(() => {
    terminate();
    setFileOutput(null);
    setDecodedFile(null);
    setError("");
    setProgress(0);
  }, [
    file,
    fileInput,
    fileOutputType,
    direction,
    alphabet,
    mimeType,
    tab,
    terminate,
  ]);

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

  const handlePasteInput = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (tab === "text") {
            setInput(text);
          } else {
            setFileInput(text);
          }
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
    if (direction === "encode") {
      setInput("SFranKey Security & Developer Tools — Nhanh chóng, chuẩn xác và bảo mật.");
    } else {
      setInput("U0ZyYW5LZXkgU2VjdXJpdHkgJiBEZXZlbG9wZXIgVG9vbHMg4oCUIE5oYW5oIGNow7NuZywgY2h14bqpbiB4w6FjIHbDoCBi4bqjbyBt4bqtdC4=");
    }
    setError("");
  };

  const handleSwap = () => {
    if (tab === "text" && textOutput) {
      const nextInput = textOutput;
      const nextDir = direction === "encode" ? "decode" : "encode";
      setInput(nextInput);
      setDirection(nextDir);
      setTextOutput(null);
      setError("");
    } else {
      setDirection((prev) => (prev === "encode" ? "decode" : "encode"));
    }
  };

  const runText = () => {
    try {
      setError("");
      if (!input) return;
      if (new TextEncoder().encode(input).byteLength > MAX_TEXT) {
        throw new Error("TEXT_LIMIT");
      }
      if (direction === "encode") {
        setTextOutput(
          encodeBase64Alphabet(new TextEncoder().encode(input), alphabet),
        );
      } else {
        const decoded = decodeBase64Alphabet(input, alphabet);
        if (decoded.byteLength > MAX_TEXT) throw new Error("TEXT_LIMIT");
        try {
          setTextOutput(
            new TextDecoder("utf-8", { fatal: true }).decode(decoded),
          );
        } catch {
          throw new Error("INVALID_UTF8");
        }
      }
    } catch (caught) {
      setTextOutput(null);
      const code = caught instanceof Error ? caught.message : "INVALID_BASE64";
      setError(
        code === "TEXT_LIMIT"
          ? t.base64.textLimit
          : code === "INVALID_UTF8"
            ? t.base64.invalidUtf8
            : t.base64.invalidBase64,
      );
    }
  };

  const runFile = () => {
    setError("");
    terminate();
    const jobId = crypto.randomUUID();
    jobRef.current = jobId;
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/base64.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      jobRef.current = "";
      setError(t.base64.workerError);
      return;
    }
    workerRef.current = worker;
    setWorking(true);
    setProgress(0);
    setFileOutput(null);
    setDecodedFile(null);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.jobId !== jobRef.current) return;
      if (message.type === "progress") {
        setProgress(
          message.total ? (message.processed / message.total) * 100 : 100,
        );
        return;
      }
      terminate();
      if (message.type === "encoded") setFileOutput(message.value);
      else if (message.type === "decoded")
        setDecodedFile({ bytes: message.bytes, mimeType: message.mimeType });
      else if (message.type === "error")
        setError(
          message.code === "INVALID_UTF8"
            ? t.base64.invalidUtf8
            : message.code === "INVALID_MIME"
              ? t.base64.invalidMime
              : message.code === "DECODED_SIZE_LIMIT"
                ? direction === "encode"
                  ? t.base64.fileLimit
                  : t.base64.decodedLimit
                : t.base64.invalidBase64,
        );
    };
    worker.onerror = () => {
      terminate();
      setError(t.base64.workerError);
    };
    if (direction === "encode") {
      if (!file) {
        terminate();
        setError(t.base64.fileLimit);
        return;
      }
      worker.postMessage({
        type: "encode-file",
        jobId,
        file,
        alphabet,
        output: fileOutputType,
      });
    } else {
      const value = fileInput.trim();
      if (!value || value.length > MAX_ENCODED) {
        terminate();
        setError(t.base64.invalidBase64);
        return;
      }
      try {
        const encodedValue = /^data:/i.test(value)
          ? parseBase64DataUrlParts(value).payload
          : value;
        if (estimateBase64DecodedSize(encodedValue, alphabet) > MAX_FILE)
          throw new Error("DECODED_LIMIT");
      } catch (caught) {
        terminate();
        setError(
          caught instanceof Error && caught.message === "DECODED_LIMIT"
            ? t.base64.decodedLimit
            : t.base64.invalidBase64,
        );
        return;
      }
      worker.postMessage({
        type: "decode-file",
        jobId,
        value,
        alphabet,
        mimeType: mimeType || "application/octet-stream",
      });
    }
  };

  const onFile = async (selected: File) => {
    const maxBytes = direction === "decode" ? MAX_ENCODED : MAX_FILE;
    if (selected.size > maxBytes) {
      setError(
        direction === "decode" ? t.base64.encodedLimit : t.base64.fileLimit,
      );
      return;
    }
    setFile(selected);
    setError("");
    if (direction === "decode") {
      try {
        setFileInput(await selected.text());
      } catch {
        setError(t.base64.invalidBase64);
      }
    }
  };

  const preview =
    fileOutput !== null && fileOutput.length > 200 * 1024
      ? `${fileOutput.slice(0, 160 * 1024)}\n…\n${fileOutput.slice(-40 * 1024)}`
      : (fileOutput ?? "");

  const cancel = () => {
    workerRef.current?.postMessage({ type: "cancel", jobId: jobRef.current });
    terminate();
    setProgress(0);
  };

  const reset = () => {
    terminate();
    setInput("");
    setTextOutput(null);
    setFile(null);
    setFileInput("");
    setFileOutput(null);
    setDecodedFile(null);
    setMimeType("application/octet-stream");
    setFilename("");
    setError("");
    setProgress(0);
    setFileOutputType("raw");
  };

  // Calculations for metrics
  const inputByteLength = React.useMemo(() => {
    if (tab === "text") {
      return new TextEncoder().encode(input).byteLength;
    }
    if (file) return file.size;
    return new TextEncoder().encode(fileInput).byteLength;
  }, [tab, input, file, fileInput]);

  const outputByteLength = React.useMemo(() => {
    if (tab === "text" && textOutput !== null) {
      return new TextEncoder().encode(textOutput).byteLength;
    }
    if (fileOutput !== null) {
      return new TextEncoder().encode(fileOutput).byteLength;
    }
    if (decodedFile !== null) {
      return decodedFile.bytes.byteLength;
    }
    return 0;
  }, [tab, textOutput, fileOutput, decodedFile]);

  const hasOutput =
    (tab === "text" && textOutput !== null) ||
    (tab === "file" && (fileOutput !== null || decodedFile !== null));

  return (
    <div className="w-full space-y-6">
      {/* Centered Segmented Mode Switcher */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t.base64.title}
          className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-1.5 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/50"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "text"}
            onClick={() => setTab("text")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              tab === "text"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <FileText size={16} className="text-brand-600 dark:text-brand-300" />
            <span>{t.shared.text}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "file"}
            onClick={() => setTab("file")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              tab === "file"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <FileUp size={16} className="text-brand-600 dark:text-brand-300" />
            <span>{t.shared.file}</span>
          </button>
        </div>
      </div>

      {/* Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Input & Configuration Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <FileCode size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Cấu hình & Nhập liệu" : "Configuration & Input"}</span>
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

            {/* Direction & Alphabet Configuration Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Direction Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 flex items-center justify-between">
                  <span>{t.base64.direction}</span>
                  {tab === "text" ? (
                    <button
                      type="button"
                      onClick={handleSwap}
                      title={locale === "vi" ? "Đảo chiều dữ liệu" : "Swap Input/Output"}
                      className="text-[11px] text-brand-600 hover:text-brand-950 dark:text-brand-400 dark:hover:text-brand-50 inline-flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeftRight size={12} />
                      <span>{locale === "vi" ? "Đảo" : "Swap"}</span>
                    </button>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                  <button
                    type="button"
                    onClick={() => setDirection("encode")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      direction === "encode"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.shared.encode}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("decode")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      direction === "decode"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.shared.decode}
                  </button>
                </div>
              </div>

              {/* Alphabet Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.base64.alphabet}
                </label>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                  <button
                    type="button"
                    onClick={() => setAlphabet("standard")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      alphabet === "standard"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.shared.standard}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlphabet("url-safe")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      alphabet === "url-safe"
                        ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                        : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                    }`}
                  >
                    {t.shared.urlSafe}
                  </button>
                </div>
              </div>
            </div>

            {/* TEXT MODE INPUT */}
            {tab === "text" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="base64-text-input"
                    className="text-xs font-bold text-brand-950 dark:text-brand-50"
                  >
                    {t.shared.input}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteInput}
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

                <div className="relative">
                  <textarea
                    id="base64-text-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={7}
                    placeholder={
                      direction === "encode"
                        ? locale === "vi"
                          ? "Nhập văn bản Unicode để mã hóa sang Base64..."
                          : "Type or paste Unicode text to encode into Base64..."
                        : locale === "vi"
                          ? "Dán chuỗi Base64 để giải mã sang văn bản UTF-8..."
                          : "Paste Base64 string to decode into UTF-8 text..."
                    }
                    className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-xs text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60">
                  <span>
                    {input.length.toLocaleString(locale)} {t.base64.characters}
                  </span>
                  <span>
                    {inputByteLength.toLocaleString(locale)} {t.base64.bytes}
                  </span>
                </div>
              </div>
            ) : (
              /* FILE MODE INPUT */
              <div className="space-y-4">
                {direction === "encode" ? (
                  <>
                    <FileDropzone
                      id="base64-file"
                      accept={["*/*"]}
                      maxBytes={MAX_FILE}
                      file={file}
                      labels={{
                        idle: t.base64.dropFile,
                        active: t.shared.processing,
                        browse: t.base64.browse,
                        remove: t.shared.reset,
                      }}
                      onFile={(selected) => void onFile(selected)}
                      onRejected={(code) =>
                        setError(
                          code === "size"
                            ? t.base64.fileLimit
                            : t.base64.invalidBase64,
                        )
                      }
                      onClear={() => setFile(null)}
                    />

                    {/* Output Type Switcher for Encoded File */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                        {t.base64.fileEncoding}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-1 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                        <button
                          type="button"
                          onClick={() => setFileOutputType("raw")}
                          className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                            fileOutputType === "raw"
                              ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                              : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                          }`}
                        >
                          {t.base64.raw}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileOutputType("data-url")}
                          className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                            fileOutputType === "data-url"
                              ? "bg-white text-brand-950 shadow-2xs dark:bg-emerald-900/90 dark:text-brand-50"
                              : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
                          }`}
                        >
                          {t.base64.dataUrl}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FileDropzone
                      id="base64-input-file"
                      accept={[
                        ".txt",
                        ".b64",
                        ".base64",
                        "text/plain",
                        "application/base64",
                        "application/x-base64",
                      ]}
                      maxBytes={MAX_ENCODED}
                      file={file}
                      labels={{
                        idle: t.base64.dropFile,
                        active: t.shared.processing,
                        browse: t.base64.browse,
                        remove: t.shared.reset,
                      }}
                      onFile={(selected) => void onFile(selected)}
                      onRejected={(code) =>
                        setError(
                          code === "size"
                            ? t.base64.encodedLimit
                            : t.base64.invalidBase64,
                        )
                      }
                      onClear={() => {
                        setFile(null);
                        setFileInput("");
                      }}
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="base64-file-input"
                          className="text-xs font-bold text-brand-950 dark:text-brand-50"
                        >
                          {t.shared.input}
                        </label>
                        <button
                          type="button"
                          onClick={handlePasteInput}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 dark:hover:bg-emerald-900/60 transition"
                        >
                          <Clipboard size={12} />
                          <span>{locale === "vi" ? "Dán" : "Paste"}</span>
                        </button>
                      </div>
                      <textarea
                        id="base64-file-input"
                        value={fileInput}
                        onChange={(event) => setFileInput(event.target.value)}
                        rows={4}
                        placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                        className="w-full rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 font-mono text-xs text-brand-950 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                      />
                      <p className="text-[11px] text-brand-700/60 dark:text-brand-300/60">
                        {t.base64.dataUrlHint}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="base64-mime"
                          className="text-[11px] font-bold text-brand-800/70 dark:text-brand-200/70"
                        >
                          {t.base64.mime}
                        </label>
                        <input
                          id="base64-mime"
                          value={mimeType}
                          onChange={(event) => setMimeType(event.target.value)}
                          className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-mono text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="base64-filename"
                          className="text-[11px] font-bold text-brand-800/70 dark:text-brand-200/70"
                        >
                          {t.base64.filename}
                        </label>
                        <input
                          id="base64-filename"
                          value={filename}
                          placeholder="decoded-file.bin"
                          onChange={(event) => setFilename(event.target.value)}
                          className="w-full rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-2 text-xs font-mono text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error Message Box */}
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
              {tab === "text" ? (
                <button
                  type="button"
                  onClick={runText}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                >
                  <Zap size={16} className="stroke-[2.5]" />
                  <span>{direction === "encode" ? t.shared.encode : t.shared.decode}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={runFile}
                  disabled={working}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98 disabled:opacity-50"
                >
                  <Zap size={16} className="stroke-[2.5]" />
                  <span>{t.base64.run}</span>
                </button>
              )}

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
            {t.shared.noEncryption} {t.shared.privacy}
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
              <span>{t.shared.output}</span>
            </div>

            {hasOutput ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                <Binary size={13} className="text-brand-600 dark:text-brand-300" />
                <span>Base64 {alphabet === "url-safe" ? "URL-safe" : "Standard"}</span>
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
                  <span>{t.shared.processing}</span>
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
                    {t.shared.cancel}
                  </button>
                </div>
              </div>
            ) : textOutput !== null ? (
              /* TEXT OUTPUT VIEW */
              <div className="w-full space-y-3">
                {/* Metric breakdown badge */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Input Size
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {inputByteLength.toLocaleString(locale)} bytes
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Output Size
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {outputByteLength.toLocaleString(locale)} bytes
                    </strong>
                  </div>
                </div>

                {/* Output code viewer */}
                <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 shadow-sm space-y-2 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                      {t.base64.preview}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWrapOutput((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-50"
                    >
                      <WrapText size={13} />
                      <span>{wrapOutput ? "No Wrap" : "Wrap"}</span>
                    </button>
                  </div>

                  <pre
                    className={`max-h-64 sm:max-h-72 overflow-auto font-mono text-xs text-brand-950 select-all dark:text-brand-50 p-1 ${
                      wrapOutput ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                    }`}
                  >
                    {textOutput}
                  </pre>
                </div>
              </div>
            ) : fileOutput !== null ? (
              /* FILE ENCODED OUTPUT VIEW */
              <div className="w-full space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Original File
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {inputByteLength.toLocaleString(locale)} bytes
                    </strong>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-white/90 p-2.5 dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800/65 dark:text-brand-200/65 block">
                      Base64 Size
                    </span>
                    <strong className="font-mono text-brand-950 dark:text-brand-50">
                      {fileOutput.length.toLocaleString(locale)} {t.base64.characters}
                    </strong>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-3.5 shadow-sm space-y-2 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                      {t.base64.preview}
                    </span>
                    <span className="text-[11px] font-mono text-brand-700/60 dark:text-brand-300/60">
                      {fileOutputType === "data-url" ? "Data URL" : "Raw Base64"}
                    </span>
                  </div>

                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-brand-950 select-all dark:text-brand-50 p-1">
                    {preview}
                  </pre>
                </div>
              </div>
            ) : decodedFile !== null ? (
              /* DECODED FILE VIEW */
              <div className="w-full space-y-3">
                <div className="rounded-2xl border border-emerald-500/25 bg-white/95 p-4 shadow-sm space-y-3 dark:border-emerald-500/20 dark:bg-[#07241a]/90">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/15">
                    <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <FileUp size={16} />
                    </span>
                    <div>
                      <strong className="text-sm text-brand-950 dark:text-brand-50 break-all">
                        {sanitizeDownloadName(filename, "sfrankey-decoded.bin")}
                      </strong>
                      <p className="font-mono text-xs text-brand-800/70 dark:text-brand-200/70">
                        {decodedFile.mimeType}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2 dark:border-brand-800 dark:bg-brand-900/40">
                      <dt className="text-brand-800/65 dark:text-brand-200/65">{t.base64.decodedSize}</dt>
                      <dd className="font-bold font-mono text-brand-950 dark:text-brand-50">
                        {decodedFile.bytes.byteLength.toLocaleString(locale)} {t.base64.bytes}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2 dark:border-brand-800 dark:bg-brand-900/40">
                      <dt className="text-brand-800/65 dark:text-brand-200/65">{t.base64.mime}</dt>
                      <dd className="font-bold font-mono text-brand-950 dark:text-brand-50 truncate">
                        {decodedFile.mimeType}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              /* EMPTY STAGE PLACEHOLDER */
              <div className="grid size-64 sm:size-72 place-items-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 p-6 text-center">
                <div className="space-y-2.5">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Binary size={24} />
                  </span>
                  <p className="text-xs font-bold text-brand-950 dark:text-brand-50">
                    {locale === "vi" ? "Đang chờ nhập dữ liệu" : "Waiting for input"}
                  </p>
                  <p className="text-[11px] text-brand-700/65 dark:text-brand-300/65">
                    {direction === "encode"
                      ? locale === "vi"
                        ? "Kết quả mã hóa Base64 sẽ hiển thị tại đây."
                        : "Encoded Base64 result will appear here."
                      : locale === "vi"
                        ? "Kết quả giải mã sẽ hiển thị tại đây."
                        : "Decoded output will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Bottom Actions Toolbar */}
          <div className="relative z-10 w-full space-y-3 pt-4 border-t border-emerald-500/15">
            {hasOutput ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {textOutput !== null ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(textOutput, "text-output-copy")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                      >
                        {copiedField === "text-output-copy" ? (
                          <Check size={15} className="stroke-[2.5]" />
                        ) : (
                          <Copy size={15} className="stroke-[2.5]" />
                        )}
                        <span>{t.shared.copy}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadBlob({
                            blob: new Blob([textOutput], {
                              type: "text/plain;charset=utf-8",
                            }),
                            fileName: "sfrankey-base64.txt",
                          })
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/90 py-2.5 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 transition"
                      >
                        <Download size={14} />
                        <span>{t.base64.downloadText}</span>
                      </button>
                    </>
                  ) : fileOutput !== null ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fileOutput, "file-output-copy")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                      >
                        {copiedField === "file-output-copy" ? (
                          <Check size={15} className="stroke-[2.5]" />
                        ) : (
                          <Copy size={15} className="stroke-[2.5]" />
                        )}
                        <span>{t.shared.copy}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadBlob({
                            blob: new Blob([fileOutput], {
                              type: "text/plain;charset=utf-8",
                            }),
                            fileName: "sfrankey-base64.b64.txt",
                          })
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/90 py-2.5 text-xs font-bold text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 transition"
                      >
                        <Download size={14} />
                        <span>{t.base64.downloadText}</span>
                      </button>
                    </>
                  ) : decodedFile !== null ? (
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob({
                          blob: new Blob([decodedFile.bytes], {
                            type: decodedFile.mimeType,
                          }),
                          fileName: sanitizeDownloadName(
                            filename,
                            "sfrankey-decoded.bin",
                          ),
                        })
                      }
                      className="col-span-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs sm:text-sm font-black text-brand-950 shadow-md shadow-brand-500/20 transition hover:bg-brand-400 active:scale-98"
                    >
                      <Download size={16} className="stroke-[2.5]" />
                      <span>{t.base64.downloadFile}</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-brand-700/60 dark:text-brand-300/60 pt-1">
                  <span>
                    {locale === "vi" ? "Định dạng:" : "Format:"}{" "}
                    <strong className="text-brand-950 dark:text-brand-50">
                      {alphabet === "url-safe" ? "Base64 URL-safe" : "Base64 RFC 4648"}
                    </strong>
                  </span>
                  <span>
                    {locale === "vi" ? "Kích thước:" : "Size:"}{" "}
                    <strong className="text-brand-950 dark:text-brand-50">
                      {outputByteLength.toLocaleString(locale)} bytes
                    </strong>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
