"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { classifyQrValue, type QrScanResult } from "@sfrankey/tool-core/qr";
import { getDictionary } from "@sfrankey/i18n";
import { Button, Card, CopyButton, Dialog, DialogContent, DialogDescription, DialogTitle, Textarea } from "@sfrankey/ui";
import { QrScannerSurface, type ScannerErrorCode } from "@/components/qr-scanner-surface";
import { ResultPanel } from "@/components/result-panel";

export function QrReaderWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).qrSuite.reader;
  const shared = getDictionary(locale).qrSuite.shared;
  const [result, setResult] = React.useState<QrScanResult | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  const handleDecoded = React.useCallback((value: string) => setResult(classifyQrValue(value)), []);
  const labels = React.useMemo(() => ({ drop: t.drop, browse: t.browse, active: t.processing, remove: t.reset, camera: t.camera, stopCamera: t.stopCamera, pasteHint: t.pasteHint, processing: t.processing, errors: { type: t.errors.imageType, size: t.errors.imageTooLarge, noQr: t.errors.noQr, camera: t.errors.camera, invalid: t.errors.invalid } }), [t]);
  const reset = () => { setResult(null); setDialogOpen(false); setResetKey((key) => key + 1); };
  const kindLabel = result ? ({ url: shared.url, email: shared.email, phone: shared.phone, sms: shared.sms, wifi: shared.wifi, vcard: shared.vcard, otpauth: shared.otpauth, text: shared.text }[result.kind]) : "";
  return <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
      <section><QrScannerSurface labels={labels} onDecoded={handleDecoded} resetKey={resetKey} onError={(_code: ScannerErrorCode) => undefined} /></section>
      <section><ResultPanel label={t.result} status={result ? "success" : "idle"} actions={result ? <><CopyButton value={result.value} label={shared.copy} />{result.safeHttpUrl ? <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>{t.open}</Button> : null}</> : undefined}>{result ? <div className="grid gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-200">{t.kind}: {kindLabel}</p><Textarea value={result.value} readOnly className="min-h-40 font-mono text-sm" /></div> : <p className="text-sm text-brand-800/65 dark:text-brand-200/65">{t.description}</p>}</ResultPanel><Button type="button" variant="secondary" className="mt-4" onClick={reset}>{t.reset}</Button></section>
    </div>
    <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">{t.privacy}</p>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent closeLabel={t.cancel}><DialogTitle>{t.openDialogTitle}</DialogTitle><DialogDescription>{t.openDialogDescription}</DialogDescription>{result?.safeHttpUrl ? <div className="mt-4 grid gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm dark:border-brand-800 dark:bg-brand-950/50"><span className="break-all font-mono text-xs">{new URL(result.safeHttpUrl).protocol}</span><strong className="break-all">{new URL(result.safeHttpUrl).host}</strong><span className="break-all text-brand-800/70 dark:text-brand-200/70">{result.safeHttpUrl}</span></div> : null}<div className="mt-5 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>{t.cancel}</Button><Button type="button" onClick={() => { if (result?.safeHttpUrl) window.open(result.safeHttpUrl, "_blank", "noopener,noreferrer"); setDialogOpen(false); }}>{t.openNewTab}</Button></div></DialogContent></Dialog>
  </Card>;
}
