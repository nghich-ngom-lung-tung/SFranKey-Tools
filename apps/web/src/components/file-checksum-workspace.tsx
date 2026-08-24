"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import {
  compareDigest,
  type DigestFormat,
  type HashAlgorithm,
} from "@sfrankey/tool-core/hash";
import { getDictionary } from "@sfrankey/i18n";
import { Button, Card, CopyButton, Input, Label, Select } from "@sfrankey/ui";
import { FileDropzone } from "@/components/file-dropzone";
import { ResultPanel } from "@/components/result-panel";
import { downloadBlob } from "@/lib/download";

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
  const [file, setFile] = React.useState<File | null>(null);
  const [algorithm, setAlgorithm] = React.useState<HashAlgorithm>("SHA-256");
  const [format, setFormat] = React.useState<DigestFormat>("hex");
  const [expected, setExpected] = React.useState("");
  const [result, setResult] = React.useState("");
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
    terminate();
    setResult("");
    setProgress(0);
    setError("");
  }, [file, algorithm, format, terminate]);

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

  return (
    <Card
      variant="workspace"
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
        <section className="grid gap-4">
          <FileDropzone
            id="checksum-file"
            accept={["*/*"]}
            maxBytes={MAX_FILE}
            file={file}
            labels={{
              idle: t.dropFile,
              active: t.dropFile,
              browse: t.browse,
              remove: t.cancel,
            }}
            onFile={setFile}
            onRejected={(code) =>
              setError(code === "size" ? t.tooLarge : t.workerError)
            }
            onClear={() => setFile(null)}
          />
          {file ? (
            <dl className="grid gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--surface-card-tinted)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-brand-800/65 dark:text-brand-200/65">
                  {t.fileName}
                </dt>
                <dd className="break-all text-right">{file.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-brand-800/65 dark:text-brand-200/65">
                  {t.fileType}
                </dt>
                <dd className="text-right">{file.type || t.unknownType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-brand-800/65 dark:text-brand-200/65">
                  {t.fileSize}
                </dt>
                <dd className="text-right">
                  {file.size.toLocaleString(locale)} {t.bytes}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="checksum-algorithm">{t.algorithm}</Label>
              <Select
                id="checksum-algorithm"
                value={algorithm}
                onChange={(event) =>
                  setAlgorithm(event.target.value as HashAlgorithm)
                }
              >
                <option>SHA-256</option>
                <option>SHA-384</option>
                <option>SHA-512</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="checksum-format">{t.format}</Label>
              <Select
                id="checksum-format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as DigestFormat)
                }
              >
                <option value="hex">Hex</option>
                <option value="base64">Base64</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="checksum-expected">{t.expected}</Label>
            <Input
              id="checksum-expected"
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={!file || working} onClick={start}>
              {t.calculate}
            </Button>
            {working ? (
              <Button type="button" variant="secondary" onClick={cancel}>
                {t.cancel}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={reset}>
              {shared.reset}
            </Button>
          </div>
          {working ? (
            <div className="grid gap-2">
              <p role="status" aria-live="polite" className="text-sm">
                {t.progress}
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
            </div>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="text-sm text-rose-600 dark:text-rose-300"
            >
              {error}
            </p>
          ) : null}
        </section>
        <section>
          <ResultPanel
            label={t.result}
            status={result ? "success" : "idle"}
            mono
            actions={
              result ? (
                <>
                  <CopyButton value={result} label={shared.copy} />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadBlob({
                        blob: new Blob([result], {
                          type: "text/plain;charset=utf-8",
                        }),
                        fileName: `sfrankey-${algorithm.toLowerCase()}-checksum.txt`,
                      })
                    }
                  >
                    {shared.download}
                  </Button>
                </>
              ) : undefined
            }
          >
            {result ? (
              <>
                <p className="break-all text-sm">{result}</p>
                {comparison ? (
                  <p
                    role="status"
                    className={`mt-4 text-sm font-semibold ${comparison.valid && comparison.matches ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}
                  >
                    {comparison.valid
                      ? comparison.matches
                        ? t.match
                        : t.noMatch
                      : comparison.errorCode === "INVALID_LENGTH"
                        ? t.invalidLength
                        : t.invalidFormat}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-brand-800/65 dark:text-brand-200/65">
                {file?.name ?? t.chooseFile}
              </p>
            )}
          </ResultPanel>
        </section>
      </div>
      <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">
        {t.privacy}
      </p>
    </Card>
  );
}
