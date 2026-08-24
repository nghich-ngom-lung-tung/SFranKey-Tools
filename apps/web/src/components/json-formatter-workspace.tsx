"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import type { JsonDiagnostic, JsonIndent, JsonOperation, JsonTransformResult } from "@sfrankey/tool-core/json";
import { Button, Card, CopyButton, DiagnosticPanel, Label, Select, Textarea } from "@sfrankey/ui";
import { downloadText } from "@/lib/download";
import { ResultPanel } from "@/components/result-panel";

type WorkerResponse =
  | { type: "working"; jobId: string }
  | { type: "result"; jobId: string; result: JsonTransformResult }
  | { type: "diagnostic"; jobId: string; diagnostic: JsonDiagnostic }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

function makeWorker() { return new Worker(new URL("../workers/json.worker.ts", import.meta.url), { type: "module" }); }

export function JsonFormatterWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const [input, setInput] = React.useState("");
  const [operation, setOperation] = React.useState<JsonOperation>("format");
  const [indent, setIndent] = React.useState<JsonIndent>({ kind: "spaces", size: 2 });
  const [sortKeys, setSortKeys] = React.useState(false);
  const [result, setResult] = React.useState<JsonTransformResult | null>(null);
  const [diagnostic, setDiagnostic] = React.useState<JsonDiagnostic | null>(null);
  const [error, setError] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const jobRef = React.useRef("");

  const stopWorker = React.useCallback(() => { workerRef.current?.terminate(); workerRef.current = null; jobRef.current = ""; setWorking(false); }, []);
  React.useEffect(() => () => stopWorker(), [stopWorker]);
  React.useEffect(() => {
    stopWorker();
    setResult(null);
    setDiagnostic(null);
    setError("");
  }, [input, operation, indent, sortKeys, stopWorker]);

  const run = () => {
    stopWorker();
    const jobId = crypto.randomUUID?.() ?? `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
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
    setWorking(true); setError(""); setDiagnostic(null); setResult(null);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.jobId !== jobRef.current) return;
      if (response.type === "working") return;
      if (response.type === "result") { setResult(response.result); setWorking(false); worker.terminate(); workerRef.current = null; return; }
      if (response.type === "diagnostic") { setDiagnostic(response.diagnostic); setWorking(false); worker.terminate(); workerRef.current = null; return; }
      if (response.type === "error") { setError(t.json.errors[response.code as keyof typeof t.json.errors] ?? t.json.errors.PROCESSING_FAILED); setWorking(false); worker.terminate(); workerRef.current = null; return; }
      if (response.type === "canceled") { setWorking(false); worker.terminate(); workerRef.current = null; }
    };
    worker.onerror = () => { if (jobRef.current === jobId) { setError(t.json.errors.WORKER_UNAVAILABLE); setWorking(false); } worker.terminate(); workerRef.current = null; };
    worker.postMessage({ type: "process", jobId, input, options: { operation, indent, sortKeys } });
  };
  const cancel = () => { if (workerRef.current && jobRef.current) workerRef.current.postMessage({ type: "cancel", jobId: jobRef.current }); stopWorker(); };
  const reset = () => { cancel(); setInput(""); setResult(null); setDiagnostic(null); setError(""); setOperation("format"); setIndent({ kind: "spaces", size: 2 }); setSortKeys(false); };
  const output = result?.output ?? "";
  const jumpToError = () => { if (!diagnostic || !inputRef.current) return; inputRef.current.focus(); inputRef.current.setSelectionRange(diagnostic.offset, diagnostic.offset + diagnostic.length); };

  return <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
    <div className="grid gap-4">
      <h2 className="text-xl font-black tracking-tight text-brand-950 dark:text-brand-50">{t.json.workspaceTitle}</h2>
      <div><Label htmlFor="json-input">{t.json.input}</Label><Textarea ref={inputRef} id="json-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.json.placeholder} className="min-h-72 font-mono" spellCheck={false} aria-describedby="json-byte-count" /><p id="json-byte-count" className="mt-2 text-xs text-[var(--ink-muted)]">{new TextEncoder().encode(input).byteLength.toLocaleString()} / 5 MiB {t.json.bytes}</p></div>
      <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="json-operation">{t.json.output}</Label><Select id="json-operation" value={operation} onChange={(event) => setOperation(event.target.value as JsonOperation)}><option value="validate">{t.json.validate}</option><option value="format">{t.json.format}</option><option value="minify">{t.json.minify}</option></Select></div><div><Label htmlFor="json-indent">{t.json.indent}</Label><Select id="json-indent" value={indent.kind === "tab" ? "tab" : String(indent.size)} onChange={(event) => setIndent(event.target.value === "tab" ? { kind: "tab" } : { kind: "spaces", size: Number(event.target.value) as 2 | 4 })}><option value="2">{t.json.spaces2}</option><option value="4">{t.json.spaces4}</option><option value="tab">{t.json.tab}</option></Select></div><label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />{t.json.sortKeys}</label></div>
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={run} disabled={working}>{working ? t.shared.working : operation === "validate" ? t.json.validate : operation === "format" ? t.json.format : t.json.minify}</Button>{working ? <Button type="button" variant="secondary" onClick={cancel}>{t.json.cancel}</Button> : null}<Button type="button" variant="secondary" onClick={reset}>{t.shared.reset}</Button></div>
      {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {diagnostic ? <DiagnosticPanel status="error" title={t.json.diagnosticTitle} message={t.json.errors[diagnostic.code] ?? t.json.errors.INVALID_JSON} line={diagnostic.line} column={diagnostic.column} offset={diagnostic.offset} onJumpToError={jumpToError} jumpLabel={t.json.goToError} /> : null}
      {result ? <ResultPanel label={t.json.output} status="success" mono actions={output ? <><CopyButton value={output} label={t.json.copy} copiedLabel={t.shared.copied} /><Button type="button" size="sm" variant="secondary" onClick={() => downloadText({ value: output, fileName: operation === "minify" ? "sfrankey-minified.json" : "sfrankey-formatted.json", mimeType: "application/json;charset=utf-8" })}>{t.json.download}</Button></> : undefined}><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-xs">{output || t.json.valid}</pre><p className="mt-3 font-sans text-xs text-[var(--ink-muted)]">{result.inputBytes.toLocaleString()} {t.json.bytes}{result.outputBytes ? ` → ${result.outputBytes.toLocaleString()} ${t.json.bytes}` : ""}</p></ResultPanel> : <p className="text-sm text-[var(--ink-muted)]">{t.json.emptyResult}</p>}
      <p className="text-xs leading-6 text-[var(--ink-muted)]">{t.shared.privacy}</p>
    </div>
  </Card>;
}
