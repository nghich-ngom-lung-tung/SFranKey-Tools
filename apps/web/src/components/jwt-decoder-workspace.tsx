"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { getDictionary } from "@sfrankey/i18n";
import {
  decodeJwt,
  type DecodedJwtResult,
  type JwtDecodeErrorCode,
  type JwtWarningCode,
} from "@sfrankey/tool-core/jwt";
import { Button, Card, CopyButton, Label, PasswordInput, StatusBadge } from "@sfrankey/ui";
import { ResultPanel } from "@/components/result-panel";

function errorText(locale: Locale, code: JwtDecodeErrorCode) {
  const errors = getDictionary(locale).developerSuite.jwt.errors;
  return errors[code] ?? errors.fallback;
}

function claimDate(value: DecodedJwtResult["expiresAt"], locale: Locale) {
  if (!value) return null;
  const formatted = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(new Date(value.unixMs));
  const relative = new Intl.RelativeTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { numeric: "auto" }).format(Math.round((value.unixMs - Date.now()) / 86_400_000), "day");
  return `${formatted} · ${value.iso} · ${relative}`;
}

export function JwtDecoderWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).developerSuite;
  const [token, setToken] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [decoded, setDecoded] = React.useState<DecodedJwtResult | null>(null);
  const [error, setError] = React.useState("");

  const decode = () => {
    try {
      setDecoded(decodeJwt(token));
      setError("");
    } catch (caught) {
      setDecoded(null);
      setError(errorText(locale, caught && typeof caught === "object" && "code" in caught ? String(caught.code) as JwtDecodeErrorCode : "INVALID_UTF8"));
    }
  };
  const reset = () => { setToken(""); setVisible(false); setDecoded(null); setError(""); };
  const headerText = decoded ? JSON.stringify(decoded.header, null, 2) : "";
  const payloadText = decoded ? JSON.stringify(decoded.payload, null, 2) : "";
  const decodedText = decoded ? JSON.stringify({ header: decoded.header, payload: decoded.payload, signature: decoded.signature }, null, 2) : "";
  const warningText = decoded?.warnings.map((warning) => t.jwt.warningLabels[warning as JwtWarningCode]).filter(Boolean) ?? [];

  return <Card variant="workspace" className="border-0 bg-transparent p-0 shadow-none">
    <div className="grid gap-4">
      <div>
        <Label htmlFor="jwt-token">{t.jwt.token}</Label>
        <PasswordInput id="jwt-token" value={token} visible={visible} onVisibilityChange={setVisible} onChange={(event) => { setToken(event.target.value); setDecoded(null); setError(""); }} placeholder={t.jwt.placeholder} spellCheck={false} autoCapitalize="none" autoComplete="off" aria-label={visible ? t.jwt.hide : t.jwt.show} />
      </div>
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={decode}>{t.jwt.decode}</Button><Button type="button" variant="secondary" onClick={reset}>{t.shared.reset}</Button></div>
      {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {decoded ? <>
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-semibold">{t.jwt.warning}</p>{warningText.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{warningText.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[[t.jwt.header, headerText], [t.jwt.payload, payloadText], [t.jwt.signature, decoded.signature]].map(([label, value]) => <ResultPanel key={label} label={label} mono status="success" actions={<CopyButton value={value} label={t.shared.copy} copiedLabel={t.shared.copied} />}><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">{value}</pre></ResultPanel>)}
        </div>
        <ResultPanel label={t.jwt.claims} status="success"><div className="grid gap-3 sm:grid-cols-3">
          {([["exp", decoded.expiresAt], ["nbf", decoded.notBefore], ["iat", decoded.issuedAt]] as const).map(([name, value]) => <div key={name} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-tinted)] p-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold">{name}</span><StatusBadge status={decoded.warnings.includes(name === "exp" ? "EXPIRED" : name === "nbf" ? "NOT_ACTIVE" : "INVALID_IAT_CLAIM") ? "warning" : "success"}>{value ? name === "exp" && decoded.warnings.includes("EXPIRED") ? t.jwt.expired : name === "nbf" && decoded.warnings.includes("NOT_ACTIVE") ? t.jwt.notActive : t.jwt.valid : "—"}</StatusBadge></div><p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">{claimDate(value, locale) ?? "—"}</p></div>)}
        </div></ResultPanel>
        <div className="flex flex-wrap gap-3"><CopyButton value={decodedText} label={t.jwt.copyDecoded} copiedLabel={t.shared.copied} /></div>
      </> : <p className="text-sm text-[var(--ink-muted)]">{t.jwt.empty}</p>}
      <p className="text-xs leading-6 text-[var(--ink-muted)]">{t.shared.privacy}</p>
    </div>
  </Card>;
}
