"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { compareDigest, hashText, type DigestFormat, type HashAlgorithm } from "@sfrankey/tool-core/hash";
import { getDictionary } from "@sfrankey/i18n";
import { Button, Card, CopyButton, Input, Label, Select, Textarea } from "@sfrankey/ui";
import { downloadBlob } from "@/lib/download";
import { ResultPanel } from "@/components/result-panel";

const MAX_TEXT_BYTES = 5 * 1024 * 1024;

export function HashWorkspace({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.encodingSuite.hash;
  const shared = dictionary.encodingSuite.shared;
  const [input, setInput] = React.useState("");
  const [algorithm, setAlgorithm] = React.useState<HashAlgorithm>("SHA-256");
  const [format, setFormat] = React.useState<DigestFormat>("hex");
  const [expected, setExpected] = React.useState("");
  const [result, setResult] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => { setResult(""); setError(""); }, [input, algorithm, format]);

  const run = async () => {
    if (new TextEncoder().encode(input).byteLength > MAX_TEXT_BYTES) { setError(t.textLimit); return; }
    try { setResult(await hashText(input, algorithm, format)); setError(""); }
    catch { setResult(""); setError(t.invalidFormat); }
  };
  const comparison = result && expected ? compareDigest(result, expected, algorithm, format) : null;
  const reset = () => { setInput(""); setExpected(""); setResult(""); setError(""); };

  return <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
    <div className="grid gap-4">
      <div><Label htmlFor="hash-input">{t.textLabel}</Label><Textarea id="hash-input" value={input} onChange={(event) => setInput(event.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="hash-algorithm">{t.algorithm}</Label><Select id="hash-algorithm" value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></Select></div>
        <div><Label htmlFor="hash-format">{t.format}</Label><Select id="hash-format" value={format} onChange={(event) => setFormat(event.target.value as DigestFormat)}><option value="hex">Hex</option><option value="base64">Base64</option></Select></div>
      </div>
      <div><Label htmlFor="hash-expected">{t.expected}</Label><Input id="hash-expected" value={expected} onChange={(event) => setExpected(event.target.value)} /></div>
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => void run()}>{t.run}</Button><Button type="button" variant="secondary" onClick={reset}>{shared.reset}</Button></div>
      {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        {result ? <ResultPanel label={t.hash} status="success" mono actions={<><CopyButton value={result} label={shared.copy} /><Button type="button" size="sm" variant="secondary" onClick={() => downloadBlob({ blob: new Blob([result], { type: "text/plain;charset=utf-8" }), fileName: `sfrankey-${algorithm.toLowerCase()}-hash.txt` })}>{t.download}</Button></>}><p className="break-all text-sm">{result}</p>{comparison ? <p role="status" className={`mt-4 text-sm font-semibold ${comparison.valid && comparison.matches ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>{comparison.valid ? comparison.matches ? t.match : t.noMatch : comparison.errorCode === "INVALID_LENGTH" ? t.invalidLength : t.invalidFormat}</p> : null}</ResultPanel> : null}
    </div>
    <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">{t.note} {t.privacy}</p>
  </Card>;
}
