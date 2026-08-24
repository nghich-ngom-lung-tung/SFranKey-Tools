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
import {
  Button,
  Card,
  CopyButton,
  Input,
  Label,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@sfrankey/ui";
import { FileDropzone } from "@/components/file-dropzone";
import { ResultPanel } from "@/components/result-panel";
import { downloadBlob, sanitizeDownloadName } from "@/lib/download";

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
  const t = getDictionary(locale).encodingSuite;
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

  const runText = () => {
    try {
      setError("");
      if (new TextEncoder().encode(input).byteLength > MAX_TEXT)
        throw new Error("TEXT_LIMIT");
      if (direction === "encode")
        setTextOutput(
          encodeBase64Alphabet(new TextEncoder().encode(input), alphabet),
        );
      else {
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

  return (
    <Card
      variant="workspace"
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="text">{t.shared.text}</TabsTrigger>
          <TabsTrigger value="file">{t.shared.file}</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="base64-direction">{t.base64.direction}</Label>
                <Select
                  id="base64-direction"
                  value={direction}
                  onChange={(event) =>
                    setDirection(event.target.value as Direction)
                  }
                >
                  <option value="encode">{t.shared.encode}</option>
                  <option value="decode">{t.shared.decode}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="base64-alphabet">{t.base64.alphabet}</Label>
                <Select
                  id="base64-alphabet"
                  value={alphabet}
                  onChange={(event) =>
                    setAlphabet(event.target.value as Base64Alphabet)
                  }
                >
                  <option value="standard">{t.shared.standard}</option>
                  <option value="url-safe">{t.shared.urlSafe}</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="base64-text-input">{t.shared.input}</Label>
              <Textarea
                id="base64-text-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={runText}>
                {direction === "encode" ? t.shared.encode : t.shared.decode}
              </Button>
              <Button type="button" variant="secondary" onClick={reset}>
                {t.shared.reset}
              </Button>
            </div>
            {textOutput !== null ? (
              <ResultPanel
                label={t.shared.output}
                status="success"
                mono
                actions={
                  <>
                    <CopyButton value={textOutput} label={t.shared.copy} />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        downloadBlob({
                          blob: new Blob([textOutput], {
                            type: "text/plain;charset=utf-8",
                          }),
                          fileName: "sfrankey-base64.txt",
                        })
                      }
                    >
                      {t.base64.downloadText}
                    </Button>
                  </>
                }
              >
                <pre className="max-h-96 whitespace-pre-wrap break-all">
                  {textOutput}
                </pre>
              </ResultPanel>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="file">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="base64-file-direction">
                  {t.base64.direction}
                </Label>
                <Select
                  id="base64-file-direction"
                  value={direction}
                  onChange={(event) =>
                    setDirection(event.target.value as Direction)
                  }
                >
                  <option value="encode">{t.shared.encode}</option>
                  <option value="decode">{t.shared.decode}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="base64-file-alphabet">
                  {t.base64.alphabet}
                </Label>
                <Select
                  id="base64-file-alphabet"
                  value={alphabet}
                  onChange={(event) =>
                    setAlphabet(event.target.value as Base64Alphabet)
                  }
                >
                  <option value="standard">{t.shared.standard}</option>
                  <option value="url-safe">{t.shared.urlSafe}</option>
                </Select>
              </div>
            </div>
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
                <div>
                  <Label htmlFor="base64-output-type">
                    {t.base64.fileEncoding}
                  </Label>
                  <Select
                    id="base64-output-type"
                    value={fileOutputType}
                    onChange={(event) =>
                      setFileOutputType(event.target.value as FileOutput)
                    }
                  >
                    <option value="raw">{t.base64.raw}</option>
                    <option value="data-url">{t.base64.dataUrl}</option>
                  </Select>
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
                <div>
                  <Label htmlFor="base64-file-input">{t.shared.input}</Label>
                  <Textarea
                    id="base64-file-input"
                    value={fileInput}
                    onChange={(event) => setFileInput(event.target.value)}
                  />
                  <p className="mt-2 text-xs text-brand-800/65 dark:text-brand-200/65">
                    {t.base64.dataUrlHint}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="base64-mime">{t.base64.mime}</Label>
                    <Input
                      id="base64-mime"
                      value={mimeType}
                      onChange={(event) => setMimeType(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base64-filename">{t.base64.filename}</Label>
                    <Input
                      id="base64-filename"
                      value={filename}
                      onChange={(event) => setFilename(event.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            {working ? (
              <div className="grid gap-2">
                <p role="status" aria-live="polite" className="text-sm">
                  {t.shared.processing}
                </p>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  className="h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900"
                >
                  <div
                    className="h-full origin-left rounded-full bg-brand-500 transition-transform"
                    style={{ transform: `scaleX(${progress / 100})` }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancel}
                >
                  {t.shared.cancel}
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={runFile} disabled={working}>
                {t.base64.run}
              </Button>
              <Button type="button" variant="secondary" onClick={reset}>
                {t.shared.reset}
              </Button>
            </div>
            {fileOutput !== null ? (
              <ResultPanel
                label={t.shared.output}
                status="success"
                mono
                actions={
                  <>
                    <CopyButton value={fileOutput} label={t.shared.copy} />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        downloadBlob({
                          blob: new Blob([fileOutput], {
                            type: "text/plain;charset=utf-8",
                          }),
                          fileName: "sfrankey-base64.b64.txt",
                        })
                      }
                    >
                      {t.base64.downloadText}
                    </Button>
                  </>
                }
              >
                <pre className="max-h-72 whitespace-pre-wrap break-all text-xs">
                  {preview}
                </pre>
                <p className="mt-2 text-xs font-sans text-brand-800/65 dark:text-brand-200/65">
                  {fileOutput.length.toLocaleString(locale)} {t.base64.characters}
                </p>
              </ResultPanel>
            ) : null}
            {decodedFile ? (
              <ResultPanel
                label={t.shared.output}
                status="success"
                actions={
                  <Button
                    type="button"
                    size="sm"
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
                  >
                    {t.base64.downloadFile}
                  </Button>
                }
              >
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-800/65 dark:text-brand-200/65">
                      <span>{t.base64.mime}</span>
                    </dt>
                    <dd>{decodedFile.mimeType}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-800/65 dark:text-brand-200/65">
                      {t.base64.decodedFilename}
                    </dt>
                    <dd className="break-all">
                      {sanitizeDownloadName(filename, "sfrankey-decoded.bin")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-800/65 dark:text-brand-200/65">
                      {t.base64.decodedSize}
                    </dt>
                    <dd>
                      {decodedFile.bytes.byteLength.toLocaleString(locale)} {t.base64.bytes}
                    </dd>
                  </div>
                </dl>
              </ResultPanel>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
      {error ? (
        <p
          role="alert"
          className="mt-4 text-sm text-rose-600 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
      <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">
        {t.shared.noEncryption} {t.shared.privacy}
      </p>
    </Card>
  );
}
