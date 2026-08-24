"use client";

import * as React from "react";
import { getDictionary } from "@sfrankey/i18n";
import type { Locale } from "@sfrankey/shared";
import {
  DEFAULT_CHARACTER_OPTIONS,
  DEFAULT_PASSPHRASE_OPTIONS,
  PasswordGenerationError,
  generatePasswordBatch,
  type CharacterPasswordOptions,
  type GeneratedPassword,
  type PasswordGeneratorMode,
  type PassphraseOptions,
} from "@sfrankey/tool-core/password";
import { MAX_PASSWORD_LENGTH, type PasswordStrengthResult } from "@sfrankey/tool-core/password-strength";
import { Button, Card, CopyButton, Input, Label, Select } from "@sfrankey/ui";
import { trackToolUsed } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download";
import { useToast } from "./toast-provider";

function Workspace({ children }: { children: React.ReactNode }) {
  return <Card variant="workspace" className="w-full border-0 bg-transparent p-0 shadow-none">{children}</Card>;
}

function ToolHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-lg font-bold">{children}</h2>;
}

function ErrorText({ message }: { message: string }) {
  return message ? <p role="alert" className="mt-3 text-sm text-rose-600">{message}</p> : null;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function getGenerationErrorMessage(error: unknown, errors: ReturnType<typeof getDictionary>["password"]["generator"]["errors"]) {
  if (!(error instanceof PasswordGenerationError)) return errors.fallback;
  return {
    INVALID_LENGTH: errors.invalidLength,
    NO_CHARACTER_SET: errors.noCharacterSet,
    IMPOSSIBLE_NO_REPEAT: errors.impossibleNoRepeat,
    INVALID_BATCH: errors.invalidBatch,
    INVALID_WORD_COUNT: errors.invalidWordCount,
    INVALID_SEPARATOR: errors.invalidSeparator
  }[error.code] ?? errors.fallback;
}

function downloadResults(values: string[], mode: PasswordGeneratorMode, warning: string, onDownloaded?: () => void) {
  if (!values.length || !window.confirm(warning)) return;
  const fileName = mode === "passphrase" ? "sfrankey-passphrases.txt" : "sfrankey-passwords.txt";
  const blob = new Blob([`${values.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
  downloadBlob({ blob, fileName });
  onDownloaded?.();
}

const characterKeys: Array<keyof Pick<CharacterPasswordOptions, "uppercase" | "lowercase" | "numbers" | "symbols" | "excludeAmbiguous" | "noRepeat">> = [
  "uppercase",
  "lowercase",
  "numbers",
  "symbols",
  "excludeAmbiguous",
  "noRepeat"
];

export function PasswordGeneratorTool({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).password.generator;
  const { toast } = useToast();
  const [mode, setMode] = React.useState<PasswordGeneratorMode>("characters");
  const [characterOptions, setCharacterOptions] = React.useState<CharacterPasswordOptions>(DEFAULT_CHARACTER_OPTIONS);
  const [passphraseOptions, setPassphraseOptions] = React.useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [count, setCount] = React.useState(1);
  const [results, setResults] = React.useState<GeneratedPassword[]>([]);
  const [revealed, setRevealed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const generate = React.useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const request = mode === "characters"
        ? { mode, count, options: characterOptions }
        : { mode, count, options: passphraseOptions };
      setResults(await generatePasswordBatch(request));
      setRevealed(false);
    } catch (generationError) {
      setResults([]);
      setError(getGenerationErrorMessage(generationError, t.errors));
    } finally {
      setBusy(false);
    }
  }, [characterOptions, count, mode, passphraseOptions, t.errors]);

  React.useEffect(() => {
    void generate();
    // Generate one initial value only. Configuration changes wait for the explicit Generate action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCharacterOption = (key: keyof CharacterPasswordOptions) => {
    setCharacterOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const reset = () => {
    setMode("characters");
    setCharacterOptions(DEFAULT_CHARACTER_OPTIONS);
    setPassphraseOptions(DEFAULT_PASSPHRASE_OPTIONS);
    setCount(1);
    setResults([]);
    setError("");
    setRevealed(false);
  };

  const rawValues = results.map((item) => item.value);
  const entropy = results[0]?.estimatedEntropyBits;

  return <Workspace>
    <ToolHeading>{t.title}</ToolHeading>
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t.title}>
      <button type="button" role="tab" aria-selected={mode === "characters"} className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition ${mode === "characters" ? "bg-brand-500 text-brand-950 shadow-soft" : "border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink)] hover:bg-brand-100/60 dark:hover:bg-brand-900/60"}`} onClick={() => setMode("characters")}>{t.modes.characters}</button>
      <button type="button" role="tab" aria-selected={mode === "passphrase"} className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition ${mode === "passphrase" ? "bg-brand-500 text-brand-950 shadow-soft" : "border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink)] hover:bg-brand-100/60 dark:hover:bg-brand-900/60"}`} onClick={() => setMode("passphrase")}>{t.modes.passphrase}</button>
    </div>

    {mode === "characters" ? <div className="grid gap-5">
      <div>
        <Label htmlFor="password-length">{t.length}: {characterOptions.length}</Label>
        <input id="password-length" aria-label={t.length} type="range" min="4" max="128" value={characterOptions.length} onChange={(event) => setCharacterOptions((previous) => ({ ...previous, length: Number(event.target.value) }))} className="w-full accent-brand-500" />
      </div>
      <fieldset className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <legend className="sr-only">{t.title}</legend>
        {characterKeys.map((key) => {
          const labels = { uppercase: t.uppercase, lowercase: t.lowercase, numbers: t.numbers, symbols: t.symbols, excludeAmbiguous: t.excludeAmbiguous, noRepeat: t.noRepeat };
          return <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={characterOptions[key]} onChange={() => updateCharacterOption(key)} />
            {labels[key]}
          </label>;
        })}
      </fieldset>
      {characterOptions.length < 12 ? <p className="text-sm text-amber-700 dark:text-amber-300">{t.shortLengthWarning}</p> : null}
    </div> : <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <Label htmlFor="passphrase-word-count">{t.wordCount}: {passphraseOptions.wordCount}</Label>
        <input id="passphrase-word-count" aria-label={t.wordCount} type="range" min="4" max="10" value={passphraseOptions.wordCount} onChange={(event) => setPassphraseOptions((previous) => ({ ...previous, wordCount: Number(event.target.value) }))} className="w-full accent-brand-500" />
      </div>
      <div>
        <Label htmlFor="passphrase-separator">{t.separator}</Label>
        <Select id="passphrase-separator" value={passphraseOptions.separator} onChange={(event) => setPassphraseOptions((previous) => ({ ...previous, separator: event.target.value as PassphraseOptions["separator"] }))}>
          <option value=" ">{t.separatorSpace}</option>
          <option value="-">{t.separatorDash}</option>
          <option value="_">{t.separatorUnderscore}</option>
          <option value=".">{t.separatorDot}</option>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={passphraseOptions.capitalizeWords} onChange={(event) => setPassphraseOptions((previous) => ({ ...previous, capitalizeWords: event.target.checked }))} />
        {t.capitalizeWords}
      </label>
      {passphraseOptions.wordCount < 6 ? <p className="text-sm text-amber-700 dark:text-amber-300 sm:col-span-2">{t.belowRecommended}</p> : null}
    </div>}

    <div className="mt-5 grid gap-2 sm:max-w-xs">
      <Label htmlFor="password-batch-count">{t.batchCount}</Label>
      <Input id="password-batch-count" type="number" min="1" max="50" value={count} onChange={(event) => setCount(Number(event.target.value))} />
    </div>

    <Row>
      <Button type="button" onClick={() => void generate()} disabled={busy}>{busy ? t.generate : t.generate}</Button>
      <Button type="button" variant="secondary" onClick={reset}>{getDictionary(locale).common.reset}</Button>
      {rawValues.length ? <>
        <CopyButton value={rawValues.join("\n")} label={t.copyAll} copiedLabel={getDictionary(locale).common.copied} onCopied={() => toast({ title: getDictionary(locale).common.copied, description: `${rawValues.length} ${mode === "passphrase" ? "passphrases" : "passwords"}`, variant: "success" })} />
        <Button type="button" variant="secondary" onClick={() => downloadResults(rawValues, mode, t.downloadWarning, () => toast({ title: getDictionary(locale).common.download, description: mode === "passphrase" ? "sfrankey-passphrases.txt" : "sfrankey-passwords.txt", variant: "success" }))}>{t.download}</Button>
        <Button type="button" variant="ghost" onClick={() => setRevealed((value) => !value)}>{revealed ? t.hide : t.reveal}</Button>
      </> : null}
    </Row>
    <ErrorText message={error} />

    {results.length ? <div className="mt-5 space-y-2.5" aria-live="polite">
      {results.map((result, index) => <div key={`${result.value}-${index}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--surface-result)] p-3 text-[var(--result-ink)] transition-all hover:border-brand-400 hover:shadow-soft">
        <div className="flex min-w-0 items-center gap-2.5 flex-1">
          {results.length > 1 ? <span className="select-none font-mono text-xs font-bold text-[var(--ink-muted)]">{index + 1}.</span> : null}
          <code className="min-w-0 flex-1 break-all text-sm font-mono" data-password-result={revealed ? "visible" : "masked"}>{revealed ? result.value : "•".repeat(Math.min(result.value.length, 64))}</code>
        </div>
        <CopyButton value={result.value} label={getDictionary(locale).common.copy} copiedLabel={getDictionary(locale).common.copied} onCopied={() => toast({ title: getDictionary(locale).common.copied, variant: "success" })} />
      </div>)}
      {entropy !== undefined ? <p className="text-xs text-[var(--ink-muted)]">{t.entropy}: <strong className="text-brand-700 dark:text-brand-300">{entropy.toFixed(1)}</strong> {t.bits}</p> : null}
    </div> : <p className="mt-5 text-sm text-[var(--ink-muted)]">{t.noResults}</p>}
    <p className="mt-5 text-xs text-[var(--ink-muted)]">{t.privacy}</p>
  </Workspace>;
}

export function PasswordCheckerTool({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).password.checker;
  const [value, setValue] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PasswordStrengthResult | null>(null);
  const tracked = React.useRef(false);

  React.useEffect(() => {
    if (!value) {
      setResult(null);
      setLoading(false);
      setError("");
      return;
    }
    if (value.length > MAX_PASSWORD_LENGTH) {
      setResult(null);
      setLoading(false);
      setError(t.tooLong);
      return;
    }
    if (!tracked.current) {
      tracked.current = true;
      trackToolUsed("password-strength-checker");
    }
    let active = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      void import("@sfrankey/tool-core/password-strength").then(({ assessPassword }) => assessPassword(value, locale)).then((nextResult) => {
        if (!active) return;
        setResult(nextResult);
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setResult(null);
        setLoading(false);
        setError(t.fallback);
      });
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locale, t.fallback, t.tooLong, value]);

  const clear = () => {
    setValue("");
    setVisible(false);
    setResult(null);
    setError("");
    tracked.current = false;
  };

  return <Workspace>
    <ToolHeading>{t.title}</ToolHeading>
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor="password-check">{t.passwordLabel}</Label>
        <Input id="password-check" type={visible ? "text" : "password"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={t.placeholder} autoComplete="off" maxLength={MAX_PASSWORD_LENGTH} />
      </div>
      <Button type="button" variant="secondary" onClick={() => setVisible((current) => !current)} aria-label={visible ? t.hidePassword : t.showPassword}>{visible ? t.hidePassword : t.showPassword}</Button>
    </div>
    <Row>
      <Button type="button" variant="ghost" onClick={clear} disabled={!value}>{t.clear}</Button>
    </Row>
    {loading ? <p className="mt-4 text-sm text-slate-500" role="status">{t.loading}</p> : null}
    <ErrorText message={error} />
    {result ? <section className="mt-5 rounded-xl border border-[var(--border-card)] bg-[var(--surface-result)] p-4 text-[var(--result-ink)]" aria-label={t.scoreLabel}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{t.scoreNames[result.score]}</strong>
        <span className="text-sm text-[var(--ink-muted)]">{t.guesses}: {new Intl.NumberFormat(locale).format(result.guesses)}</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1" role="progressbar" aria-label={t.scoreLabel} aria-valuemin={0} aria-valuemax={4} aria-valuenow={result.score}>
        {[0, 1, 2, 3, 4].map((score) => <span key={score} className={`h-2 rounded-full ${score <= result.score ? result.score < 2 ? "bg-rose-500" : result.score < 4 ? "bg-amber-500" : "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />)}
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-[var(--ink-muted)]">{t.onlineThrottled}</dt><dd className="font-semibold">{result.onlineThrottled}</dd></div>
        <div><dt className="text-[var(--ink-muted)]">{t.offlineSlowHashing}</dt><dd className="font-semibold">{result.offlineSlowHashing}</dd></div>
      </dl>
      {result.warning ? <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">{result.warning}</p> : null}
      {result.suggestions.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--ink-muted)]">{result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul> : null}
    </section> : <p className="mt-5 text-sm text-slate-500">{t.empty}</p>}
    {result ? <p className="mt-4 text-xs text-slate-500">{t.estimateNote}</p> : null}
    <p className="mt-5 text-xs text-slate-500">{t.privacy}</p>
  </Workspace>;
}
