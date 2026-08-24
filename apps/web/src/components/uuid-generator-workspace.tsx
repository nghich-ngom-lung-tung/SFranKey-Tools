"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import { generateUuidBatch, type GeneratedUuidBatch, type UuidCase, type UuidErrorCode } from "@sfrankey/tool-core/uuid";
import { Button, Card, CopyButton, Input, Label, StatusBadge } from "@sfrankey/ui";
import { downloadText } from "@/lib/download";
import { ResultPanel } from "@/components/result-panel";

function configKey(count: number, casing: UuidCase, hyphens: boolean) { return `${count}:${casing}:${hyphens}`; }

export function UuidGeneratorWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const [count, setCount] = React.useState(5);
  const [casing, setCasing] = React.useState<UuidCase>("lowercase");
  const [hyphens, setHyphens] = React.useState(true);
  const [batch, setBatch] = React.useState<GeneratedUuidBatch | null>(null);
  const [generatedConfig, setGeneratedConfig] = React.useState("");
  const [error, setError] = React.useState("");
  const currentConfig = configKey(count, casing, hyphens);
  const generate = () => {
    try { const next = generateUuidBatch({ count, casing, hyphens }); setBatch(next); setGeneratedConfig(currentConfig); setError(""); }
    catch (caught) { const code = caught && typeof caught === "object" && "code" in caught ? String(caught.code) as UuidErrorCode : "CRYPTO_UNAVAILABLE"; setError(t.uuid.errors[code] ?? t.uuid.errors.fallback); setBatch(null); }
  };
  const reset = () => { setCount(5); setCasing("lowercase"); setHyphens(true); setBatch(null); setGeneratedConfig(""); setError(""); };
  const values = batch?.values ?? [];
  const changed = Boolean(batch && generatedConfig !== currentConfig);
  return <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="uuid-count">{t.uuid.count}</Label><Input id="uuid-count" type="number" min={1} max={1000} step={1} value={count} onChange={(event) => setCount(event.target.value === "" ? Number.NaN : Number(event.target.value))} /></div><div><Label htmlFor="uuid-casing">{t.uuid.casing}</Label><select id="uuid-casing" className="sfr-input w-full" value={casing} onChange={(event) => setCasing(event.target.value as UuidCase)}><option value="lowercase">{t.uuid.lowercase}</option><option value="uppercase">{t.uuid.uppercase}</option></select></div><label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" checked={hyphens} onChange={(event) => setHyphens(event.target.checked)} />{t.uuid.hyphens}</label></div>
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={generate}>{t.uuid.generate}</Button><Button type="button" variant="secondary" onClick={reset}>{t.shared.reset}</Button></div>
      {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {changed ? <StatusBadge status="warning">{t.uuid.changed}</StatusBadge> : null}
      {values.length ? <ResultPanel label={t.uuid.title} mono status="success" actions={<><CopyButton value={values.join("\n")} label={t.uuid.copyAll} copiedLabel={t.shared.copied} /><Button type="button" size="sm" variant="secondary" onClick={() => downloadText({ value: values.join("\n"), fileName: "sfrankey-uuid-v4.txt" })}>{t.uuid.download}</Button></>}><ol className="grid max-h-[28rem] gap-2 overflow-auto text-sm">{values.map((value, index) => <li key={`${value}-${index}`} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 break-all"><span className="mr-3 select-none text-[var(--ink-muted)]">{index + 1}.</span>{value}</li>)}</ol></ResultPanel> : <p className="text-sm text-[var(--ink-muted)]">{t.uuid.empty}</p>}
      <p className="text-xs leading-6 text-[var(--ink-muted)]">{t.uuid.privacy}</p>
    </div>
  </Card>;
}
