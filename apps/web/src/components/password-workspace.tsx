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
import {
  MAX_PASSWORD_LENGTH,
  assessPassword,
  type PasswordStrengthResult,
} from "@sfrankey/tool-core/password-strength";
import { ConfirmDialog } from "@sfrankey/ui";
import { trackToolUsed } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download";
import { useToast } from "./toast-provider";
import {
  AlertTriangle,
  Binary,
  CaseLower,
  CaseUpper,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Dices,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Info,
  KeyRound,
  Layers,
  Lock,
  RepeatOff,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

function getGenerationErrorMessage(
  error: unknown,
  errors: ReturnType<typeof getDictionary>["password"]["generator"]["errors"]
) {
  if (!(error instanceof PasswordGenerationError)) return errors.fallback;
  return (
    {
      INVALID_LENGTH: errors.invalidLength,
      NO_CHARACTER_SET: errors.noCharacterSet,
      IMPOSSIBLE_NO_REPEAT: errors.impossibleNoRepeat,
      INVALID_BATCH: errors.invalidBatch,
      INVALID_WORD_COUNT: errors.invalidWordCount,
      INVALID_SEPARATOR: errors.invalidSeparator,
    }[error.code] ?? errors.fallback
  );
}

function triggerDownload(values: string[], mode: PasswordGeneratorMode) {
  if (!values.length) return;
  const fileName =
    mode === "passphrase" ? "sfrankey-passphrases.txt" : "sfrankey-passwords.txt";
  const blob = new Blob([`${values.join("\n")}\n`], {
    type: "text/plain;charset=utf-8",
  });
  downloadBlob({ blob, fileName });
}

function HighlightedPasswordText({
  value,
  revealed,
  mode,
  separator,
}: {
  value: string;
  revealed: boolean;
  mode: PasswordGeneratorMode;
  separator?: string;
}) {
  if (!revealed) {
    return (
      <span className="tracking-[0.3em] text-brand-700/60 dark:text-brand-300/60 select-none">
        {"•".repeat(Math.min(value.length, 48))}
      </span>
    );
  }

  if (mode === "passphrase" && separator) {
    const parts = value.split(separator);
    return (
      <span>
        {parts.map((word, idx) => (
          <React.Fragment key={idx}>
            <span className="font-semibold text-brand-950 dark:text-brand-50">
              {word}
            </span>
            {idx < parts.length - 1 ? (
              <span className="px-0.5 font-black text-brand-600 dark:text-brand-400 opacity-70">
                {separator === " " ? "␣" : separator}
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </span>
    );
  }

  return (
    <span>
      {Array.from(value).map((char, index) => {
        if (/[0-9]/.test(char)) {
          return (
            <span
              key={index}
              className="font-bold text-sky-600 dark:text-sky-400"
              title="Number (0-9)"
            >
              {char}
            </span>
          );
        }
        if (/[^a-zA-Z0-9]/.test(char)) {
          return (
            <span
              key={index}
              className="font-black text-amber-600 dark:text-amber-400"
              title="Symbol"
            >
              {char}
            </span>
          );
        }
        if (/[A-Z]/.test(char)) {
          return (
            <span
              key={index}
              className="font-extrabold text-brand-950 dark:text-brand-50"
              title="Uppercase (A-Z)"
            >
              {char}
            </span>
          );
        }
        return (
          <span
            key={index}
            className="font-medium text-brand-800/90 dark:text-brand-200/90"
            title="Lowercase (a-z)"
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

const LENGTH_PRESETS = [12, 16, 20, 24, 32, 64];
const WORD_PRESETS = [4, 5, 6, 7, 8];

export function PasswordGeneratorTool({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).password.generator;
  const common = getDictionary(locale).common;
  const { toast } = useToast();

  const [mode, setMode] = React.useState<PasswordGeneratorMode>("characters");
  const [characterOptions, setCharacterOptions] =
    React.useState<CharacterPasswordOptions>(DEFAULT_CHARACTER_OPTIONS);
  const [passphraseOptions, setPassphraseOptions] =
    React.useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [count, setCount] = React.useState(1);
  const [results, setResults] = React.useState<GeneratedPassword[]>([]);
  const [revealed, setRevealed] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [confirmDownloadOpen, setConfirmDownloadOpen] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(true);

  const generate = React.useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const request =
        mode === "characters"
          ? { mode, count, options: characterOptions }
          : { mode, count, options: passphraseOptions };
      const generated = await generatePasswordBatch(request);
      setResults(generated);
    } catch (generationError) {
      setResults([]);
      setError(getGenerationErrorMessage(generationError, t.errors));
    } finally {
      setBusy(false);
    }
  }, [characterOptions, count, mode, passphraseOptions, t.errors]);

  // Live Auto-Generation when settings change
  React.useEffect(() => {
    void generate();
  }, [generate]);

  const handleRoll = async () => {
    setIsRotating(true);
    await generate();
    setTimeout(() => setIsRotating(false), 350);
  };

  const updateCharacterOption = (key: CharacterToggleKey) => {
    setCharacterOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const reset = () => {
    setMode("characters");
    setCharacterOptions(DEFAULT_CHARACTER_OPTIONS);
    setPassphraseOptions(DEFAULT_PASSPHRASE_OPTIONS);
    setCount(1);
    setError("");
    setRevealed(true);
  };

  const primaryResult = results[0]?.value ?? "";
  const rawValues = results.map((item) => item.value);
  const entropy = results[0]?.estimatedEntropyBits ?? 0;

  // Entropy Strength Meter calculation
  const getStrengthInfo = (bits: number) => {
    if (bits < 45) {
      return {
        label: locale === "vi" ? "Rất yếu" : "Very Weak",
        color: "bg-rose-500",
        textColor: "text-rose-600 dark:text-rose-400",
        percent: 25,
      };
    }
    if (bits < 65) {
      return {
        label: locale === "vi" ? "Tạm được" : "Fair",
        color: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
        percent: 50,
      };
    }
    if (bits < 85) {
      return {
        label: locale === "vi" ? "Mạnh" : "Strong",
        color: "bg-emerald-500",
        textColor: "text-emerald-600 dark:text-emerald-400",
        percent: 75,
      };
    }
    return {
      label: locale === "vi" ? "Cực kỳ an toàn" : "Very Strong",
      color: "bg-brand-500",
      textColor: "text-brand-700 dark:text-brand-300",
      percent: 100,
    };
  };

  const strength = getStrengthInfo(entropy);

  const copyToClipboard = async (text: string, index = 0) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {
      // fall through to execCommand
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        textArea.remove();
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiedIndex(index);
      toast({
        title: common.copied,
        description:
          count > 1 && index === -1
            ? `${rawValues.length} ${mode === "passphrase" ? "passphrases" : "passwords"}`
            : undefined,
        variant: "success",
      });
      setTimeout(() => setCopiedIndex(null), 1800);
    } else {
      toast({
        title: common.error,
        variant: "destructive",
      });
    }
  };

  type CharacterToggleKey = keyof Omit<CharacterPasswordOptions, "length">;

  const optionCards: Array<{
    key: CharacterToggleKey;
    label: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "uppercase",
      label: t.uppercase,
      badge: "A-Z",
      icon: <CaseUpper size={18} className="text-brand-700 dark:text-brand-300" />,
    },
    {
      key: "lowercase",
      label: t.lowercase,
      badge: "a-z",
      icon: <CaseLower size={18} className="text-brand-700 dark:text-brand-300" />,
    },
    {
      key: "numbers",
      label: t.numbers,
      badge: "0-9",
      icon: <Binary size={18} className="text-sky-600 dark:text-sky-400" />,
    },
    {
      key: "symbols",
      label: t.symbols,
      badge: "!@#$",
      icon: <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />,
    },
    {
      key: "excludeAmbiguous",
      label: t.excludeAmbiguous,
      badge: "no 0, O, 1, l",
      icon: <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />,
    },
    {
      key: "noRepeat",
      label: t.noRepeat,
      badge: "unique",
      icon: <RepeatOff size={18} className="text-rose-600 dark:text-rose-400" />,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. Segmented Control Mode Switcher */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label={t.title}
          className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-1.5 shadow-2xs backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/40"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "characters"}
            onClick={() => setMode("characters")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              mode === "characters"
                ? "bg-white text-brand-950 shadow-md shadow-emerald-900/10 dark:bg-emerald-900/80 dark:text-brand-50"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <Dices size={17} className={mode === "characters" ? "text-brand-600 dark:text-brand-300" : ""} />
            <span>{t.modes.characters}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "passphrase"}
            onClick={() => setMode("passphrase")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              mode === "passphrase"
                ? "bg-white text-brand-950 shadow-md shadow-emerald-900/10 dark:bg-emerald-900/80 dark:text-brand-50"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <FileText size={17} className={mode === "passphrase" ? "text-brand-600 dark:text-brand-300" : ""} />
            <span>{t.modes.passphrase}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700/75 hover:text-brand-950 dark:text-brand-300/75 dark:hover:text-brand-50 transition"
        >
          <RotateCw size={13} />
          <span>{common.reset}</span>
        </button>
      </div>

      {/* 2. Hero Password Output Card (Top Prominent Studio Card) */}
      <div className="relative overflow-hidden rounded-[26px] border border-emerald-500/25 bg-gradient-to-b from-white via-white to-emerald-50/30 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.09)] dark:border-emerald-500/20 dark:from-[#08291e] dark:via-[#06241a] dark:to-[#041a13] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />

        <div className="relative z-10">
          {/* Main Password Display & Quick Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xl sm:text-2xl md:text-3xl break-all tracking-wider select-all">
                {primaryResult ? (
                  <HighlightedPasswordText
                    value={primaryResult}
                    revealed={revealed}
                    mode={mode}
                    separator={passphraseOptions.separator}
                  />
                ) : (
                  <span className="text-brand-700/50 dark:text-brand-300/50">
                    {t.noResults}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Cluster */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                title={revealed ? t.hide : t.reveal}
                aria-label={revealed ? t.hide : t.reveal}
                className="grid size-11 place-items-center rounded-xl border border-emerald-500/20 bg-white/80 text-brand-900 shadow-xs transition hover:scale-105 hover:border-brand-400 hover:bg-white active:scale-95 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:text-brand-100 dark:hover:bg-emerald-900/60"
              >
                {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              <button
                type="button"
                onClick={() => void handleRoll()}
                disabled={busy}
                title={t.generate}
                aria-label={t.generate}
                className="grid size-11 place-items-center rounded-xl border border-emerald-500/20 bg-white/80 text-brand-900 shadow-xs transition hover:scale-105 hover:border-brand-400 hover:bg-white active:scale-95 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:text-brand-100 dark:hover:bg-emerald-900/60 disabled:opacity-50"
              >
                <RotateCw
                  size={18}
                  className={`transition-transform duration-300 ${
                    isRotating ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => void copyToClipboard(primaryResult, 0)}
                disabled={!primaryResult}
                title={common.copy}
                aria-label={common.copy}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-black text-brand-950 shadow-md shadow-brand-500/25 transition hover:scale-105 hover:bg-brand-400 active:scale-95 disabled:opacity-50"
              >
                {copiedIndex === 0 ? (
                  <>
                    <Check size={16} className="stroke-[3]" />
                    <span>{common.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="stroke-[2.5]" />
                    <span>{common.copy}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Entropy & Strength Progress Meter */}
          {primaryResult && entropy > 0 ? (
            <div className="mt-6 pt-5 border-t border-emerald-500/15">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <div className="flex items-center gap-1.5 text-brand-900/80 dark:text-brand-100/80">
                  <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
                  <span>
                    {t.entropy}:{" "}
                    <strong className="text-brand-950 dark:text-brand-50">
                      {entropy.toFixed(1)} {t.bits}
                    </strong>
                  </span>
                </div>
                <span className={strength.textColor}>{strength.label}</span>
              </div>

              {/* Progress Bar with 4 Segments */}
              <div className="grid grid-cols-4 gap-1.5 h-2 rounded-full overflow-hidden bg-emerald-950/10 dark:bg-emerald-950/60 p-0.5">
                {[25, 50, 75, 100].map((step, idx) => (
                  <div
                    key={idx}
                    className={`h-full rounded-full transition-all duration-300 ${
                      strength.percent >= step
                        ? strength.color
                        : "bg-transparent opacity-20"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-700 dark:text-rose-300"
        >
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* 3. Interactive Configuration Card */}
      <div className="overflow-hidden rounded-[26px] border border-emerald-500/20 bg-white/90 shadow-soft dark:border-emerald-500/20 dark:bg-[#07241a]/90">
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={() => setConfigOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 sm:px-7 text-left transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30"
        >
          <div className="flex items-center gap-2.5 text-sm font-bold text-brand-950 dark:text-brand-50">
            <KeyRound size={17} className="text-brand-600 dark:text-brand-400" />
            <span>{locale === "vi" ? "Tùy chỉnh nâng cao" : "Advanced settings"}</span>
          </div>
          <ChevronDown
            size={18}
            className={`text-brand-600/60 dark:text-brand-400/60 transition-transform duration-200 ${
              configOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Collapsible Content */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            configOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-6 pb-6 sm:px-7 sm:pb-7">
        {mode === "characters" ? (
          /* --- RANDOM CHARACTERS CONTROLS --- */
          <div className="space-y-6">
            {/* Length Control with Quick Presets */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <label
                  htmlFor="password-length-slider"
                  className="flex items-center gap-2 text-sm font-bold text-brand-950 dark:text-brand-50"
                >
                  <KeyRound size={16} className="text-brand-600 dark:text-brand-400" />
                  <span>{t.length}:</span>
                  <span className="rounded-lg bg-brand-500/15 px-2.5 py-0.5 font-mono text-sm font-black text-brand-800 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                    {characterOptions.length}
                  </span>
                </label>

                {/* Length Preset Chips */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-brand-700/60 dark:text-brand-300/60 mr-1 hidden sm:inline">
                    Presets:
                  </span>
                  {LENGTH_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setCharacterOptions((prev) => ({ ...prev, length: val }))
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                        characterOptions.length === val
                          ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                          : "bg-emerald-50 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200 dark:hover:bg-emerald-900/60"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider */}
              <input
                id="password-length-slider"
                type="range"
                min="4"
                max="128"
                value={characterOptions.length}
                onChange={(e) =>
                  setCharacterOptions((prev) => ({
                    ...prev,
                    length: Number(e.target.value),
                  }))
                }
                className="w-full accent-brand-500 cursor-pointer h-2 bg-emerald-100 rounded-lg appearance-none dark:bg-emerald-950"
              />

              {characterOptions.length < 12 ? (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{t.shortLengthWarning}</span>
                </p>
              ) : null}
            </div>

            {/* Character Set Configuration: Switch List + Live Pool */}
            <div>
              {/* Live Character Pool Preview */}
              {(() => {
                const GROUPS = {
                  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                  lowercase: "abcdefghijklmnopqrstuvwxyz",
                  numbers: "0123456789",
                  symbols: "!@#$%^&*()-_=+[]{}:,.?",
                };
                const AMBIGUOUS = new Set(["O", "0", "I", "l", "1"]);
                const activeKeys = (["uppercase", "lowercase", "numbers", "symbols"] as const).filter(
                  (k) => characterOptions[k]
                );
                const pool = activeKeys
                  .flatMap((k) =>
                    [...GROUPS[k]].filter(
                      (ch) => !(characterOptions.excludeAmbiguous && AMBIGUOUS.has(ch))
                    )
                  );
                const poolSize = characterOptions.noRepeat
                  ? Math.min(pool.length, characterOptions.length)
                  : pool.length;

                return (
                  <div className="mb-4 rounded-2xl border border-emerald-500/15 bg-gradient-to-r from-emerald-50/40 via-white/60 to-emerald-50/40 p-4 dark:border-emerald-500/15 dark:from-emerald-950/30 dark:via-[#07241a]/60 dark:to-emerald-950/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                        <Layers size={14} className="text-brand-600 dark:text-brand-400" />
                        <span>{locale === "vi" ? "Ký tự khả dụng" : "Character pool"}</span>
                      </div>
                      <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-black text-brand-800 ring-1 ring-brand-500/25 dark:bg-brand-400/15 dark:text-brand-200">
                        {poolSize} {locale === "vi" ? "ký tự" : "chars"}
                      </span>
                    </div>
                    {pool.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pool.map((ch, i) => {
                          const isNumber = /[0-9]/.test(ch);
                          const isSymbol = /[^a-zA-Z0-9]/.test(ch);
                          const isUpper = /[A-Z]/.test(ch);
                          return (
                            <span
                              key={`${ch}-${i}`}
                              className={`inline-flex size-7 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all duration-200 ${
                                isSymbol
                                  ? "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300"
                                  : isNumber
                                    ? "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300"
                                    : isUpper
                                      ? "bg-brand-500/12 text-brand-900 ring-1 ring-brand-500/20 dark:bg-brand-400/10 dark:text-brand-100 font-black"
                                      : "bg-brand-500/8 text-brand-800/80 ring-1 ring-brand-500/15 dark:bg-brand-400/8 dark:text-brand-200/80"
                              }`}
                            >
                              {ch}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        {locale === "vi" ? "Chưa chọn nhóm ký tự nào" : "No character sets selected"}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Compact Switch List */}
              <div className="divide-y divide-emerald-500/10 dark:divide-emerald-500/10">
                {optionCards.map((opt) => {
                  const isChecked = characterOptions[opt.key];
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="switch"
                      aria-checked={Boolean(isChecked)}
                      onClick={() => updateCharacterOption(opt.key)}
                      className="group flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 px-1 -mx-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                            isChecked
                              ? "bg-brand-500/15 ring-1 ring-brand-500/30 dark:bg-brand-400/15"
                              : "bg-brand-100/60 dark:bg-brand-900/40 opacity-50"
                          }`}
                        >
                          {opt.icon}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-bold truncate transition-colors ${
                              isChecked
                                ? "text-brand-950 dark:text-brand-50"
                                : "text-brand-900/50 dark:text-brand-200/50"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <div
                            className={`font-mono text-[11px] transition-colors ${
                              isChecked
                                ? "text-brand-700/60 dark:text-brand-300/60"
                                : "text-brand-600/30 dark:text-brand-400/30"
                            }`}
                          >
                            {opt.badge}
                          </div>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                          isChecked
                            ? "bg-brand-500 shadow-inner shadow-brand-600/30"
                            : "bg-brand-200 dark:bg-brand-800"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all duration-200 ${
                            isChecked ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* --- PASSPHRASE CONTROLS --- */
          <div className="space-y-6">
            {/* Word Count Control with Quick Presets */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <label
                  htmlFor="passphrase-word-slider"
                  className="flex items-center gap-2 text-sm font-bold text-brand-950 dark:text-brand-50"
                >
                  <FileText size={16} className="text-brand-600 dark:text-brand-400" />
                  <span>{t.wordCount}:</span>
                  <span className="rounded-lg bg-brand-500/15 px-2.5 py-0.5 font-mono text-sm font-black text-brand-800 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                    {passphraseOptions.wordCount}
                  </span>
                </label>

                {/* Word Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-brand-700/60 dark:text-brand-300/60 mr-1 hidden sm:inline">
                    Presets:
                  </span>
                  {WORD_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setPassphraseOptions((prev) => ({ ...prev, wordCount: val }))
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                        passphraseOptions.wordCount === val
                          ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                          : "bg-emerald-50 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200 dark:hover:bg-emerald-900/60"
                      }`}
                    >
                      {val} {locale === "vi" ? "từ" : "words"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider */}
              <input
                id="passphrase-word-slider"
                type="range"
                min="4"
                max="10"
                value={passphraseOptions.wordCount}
                onChange={(e) =>
                  setPassphraseOptions((prev) => ({
                    ...prev,
                    wordCount: Number(e.target.value),
                  }))
                }
                className="w-full accent-brand-500 cursor-pointer h-2 bg-emerald-100 rounded-lg appearance-none dark:bg-emerald-950"
              />

              {passphraseOptions.wordCount < 6 ? (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{t.belowRecommended}</span>
                </p>
              ) : null}
            </div>

            {/* Separator Chips Selection */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 mb-3">
                {t.separator}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: " ", label: t.separatorSpace, icon: "␣" },
                  { value: "-", label: t.separatorDash, icon: "-" },
                  { value: "_", label: t.separatorUnderscore, icon: "_" },
                  { value: ".", label: t.separatorDot, icon: "." },
                ].map((sep) => {
                  const isSelected = passphraseOptions.separator === sep.value;
                  return (
                    <button
                      key={sep.value}
                      type="button"
                      onClick={() =>
                        setPassphraseOptions((prev) => ({
                          ...prev,
                          separator: sep.value as PassphraseOptions["separator"],
                        }))
                      }
                      className={`flex items-center justify-between rounded-2xl border p-3 text-sm font-bold transition ${
                        isSelected
                          ? "border-emerald-500 bg-brand-500/15 text-brand-950 ring-1 ring-emerald-500/30 shadow-2xs dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50"
                          : "border-brand-200/70 bg-white/60 text-brand-900/70 hover:border-brand-300 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/60 dark:hover:bg-brand-900/40"
                      }`}
                    >
                      <span>{sep.label}</span>
                      <span className="font-mono text-base font-black text-brand-600 dark:text-brand-400">
                        {sep.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capitalize Words Toggle Card */}
            <button
              type="button"
              role="checkbox"
              aria-checked={passphraseOptions.capitalizeWords}
              onClick={() =>
                setPassphraseOptions((prev) => ({
                  ...prev,
                  capitalizeWords: !prev.capitalizeWords,
                }))
              }
              className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
                passphraseOptions.capitalizeWords
                  ? "border-emerald-500/50 bg-brand-500/10 text-brand-950 ring-1 ring-emerald-500/30 dark:border-emerald-400/50 dark:bg-emerald-950/50 dark:text-brand-50"
                  : "border-brand-200/70 bg-white/60 text-brand-900/70 hover:border-brand-300 hover:bg-white dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-200/60 dark:hover:bg-brand-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black rounded-lg bg-brand-500/15 px-2 py-1 text-brand-800 dark:text-brand-200">
                  Aa
                </span>
                <span className="text-sm font-bold">{t.capitalizeWords}</span>
              </div>
              <div
                className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${
                  passphraseOptions.capitalizeWords
                    ? "border-brand-500 bg-brand-500 text-brand-950 font-black shadow-xs"
                    : "border-brand-300 bg-white dark:border-brand-700 dark:bg-brand-900"
                }`}
              >
                {passphraseOptions.capitalizeWords ? (
                  <Check size={13} className="stroke-[3]" />
                ) : null}
              </div>
            </button>
          </div>
        )}

        {/* 4. Bulk Generation Settings (Optional batch count) */}
        <div className="mt-6 pt-5 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers size={16} className="text-brand-600 dark:text-brand-400" />
            <label
              htmlFor="password-count-select"
              className="text-sm font-bold text-brand-950 dark:text-brand-50"
            >
              {t.batchCount}:
            </label>
            <select
              id="password-count-select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="rounded-xl border border-brand-200/80 bg-white px-3 py-1.5 text-sm font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-50"
            >
              <option value="1">1 {locale === "vi" ? "kết quả" : "result"}</option>
              <option value="5">5 {locale === "vi" ? "kết quả" : "results"}</option>
              <option value="10">10 {locale === "vi" ? "kết quả" : "results"}</option>
              <option value="20">20 {locale === "vi" ? "kết quả" : "results"}</option>
              <option value="50">50 {locale === "vi" ? "kết quả" : "results"}</option>
            </select>
          </div>

          {rawValues.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copyToClipboard(rawValues.join("\n"), -1)}
                className="flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-950 shadow-2xs transition hover:border-brand-400 hover:bg-brand-50 active:scale-95 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 dark:hover:bg-brand-900"
              >
                {copiedIndex === -1 ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{t.copyAll}</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDownloadOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-950 shadow-2xs transition hover:border-brand-400 hover:bg-brand-50 active:scale-95 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 dark:hover:bg-brand-900"
              >
                <FileDown size={14} />
                <span>{t.download}</span>
              </button>
            </div>
          ) : null}
        </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bulk Results List (When count > 1) */}
      {count > 1 && results.length > 1 ? (
        <div className="space-y-2.5 rounded-[26px] border border-emerald-500/20 bg-emerald-50/40 p-5 dark:border-emerald-500/20 dark:bg-[#07241a]/60">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 mb-2">
            <span>
              {locale === "vi"
                ? `Danh sách ${results.length} mật khẩu đã tạo`
                : `List of ${results.length} generated passwords`}
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {results.map((result, index) => (
              <div
                key={`${result.value}-${index}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-brand-200/80 bg-white/90 p-3 shadow-2xs transition hover:border-brand-400 hover:shadow-xs dark:border-brand-800/80 dark:bg-brand-950/80"
              >
                <div className="flex min-w-0 items-center gap-2.5 flex-1">
                  <span className="select-none font-mono text-xs font-bold text-brand-700/50 dark:text-brand-300/50 w-6">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1 font-mono text-sm break-all">
                    <HighlightedPasswordText
                      value={result.value}
                      revealed={revealed}
                      mode={mode}
                      separator={passphraseOptions.separator}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void copyToClipboard(result.value, index)}
                  title={common.copy}
                  className="grid size-8 place-items-center rounded-lg border border-brand-200/60 text-brand-800/70 transition hover:bg-brand-100 hover:text-brand-950 dark:border-brand-800/60 dark:text-brand-200/70 dark:hover:bg-brand-900"
                >
                  {copiedIndex === index ? (
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60">
        {t.privacy}
      </p>

      {/* Confirmation Modal for File Download */}
      <ConfirmDialog
        open={confirmDownloadOpen}
        onOpenChange={setConfirmDownloadOpen}
        tone="warning"
        title={t.downloadConfirmTitle}
        description={t.downloadConfirmDesc}
        note={t.downloadConfirmNote}
        confirmLabel={t.downloadConfirmAction}
        cancelLabel={t.downloadCancelAction}
        onConfirm={() => {
          triggerDownload(rawValues, mode);
          toast({
            title: common.download,
            description:
              mode === "passphrase"
                ? "sfrankey-passphrases.txt"
                : "sfrankey-passwords.txt",
            variant: "success",
          });
        }}
      />
    </div>
  );
}

export function PasswordCheckerTool({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).password.checker;
  const common = getDictionary(locale).common;
  const [value, setValue] = React.useState("");
  const [revealed, setRevealed] = React.useState(true);
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
      void assessPassword(value, locale)
        .then((nextResult) => {
          if (!active) return;
          setResult(nextResult);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setResult(null);
          setLoading(false);
          setError(t.fallback);
        });
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locale, t.fallback, t.tooLong, value]);

  const clear = () => {
    setValue("");
    setResult(null);
    setError("");
    tracked.current = false;
  };

  const getScoreTheme = (score: number) => {
    switch (score) {
      case 0:
        return {
          label: t.scoreNames[0] ?? "Very weak",
          color: "bg-rose-500",
          textColor: "text-rose-600 dark:text-rose-400",
          border: "border-rose-500/30",
          bgTint: "bg-rose-500/10",
          percent: 20,
        };
      case 1:
        return {
          label: t.scoreNames[1] ?? "Weak",
          color: "bg-orange-500",
          textColor: "text-orange-600 dark:text-orange-400",
          border: "border-orange-500/30",
          bgTint: "bg-orange-500/10",
          percent: 40,
        };
      case 2:
        return {
          label: t.scoreNames[2] ?? "Fair",
          color: "bg-amber-500",
          textColor: "text-amber-600 dark:text-amber-400",
          border: "border-amber-500/30",
          bgTint: "bg-amber-500/10",
          percent: 60,
        };
      case 3:
        return {
          label: t.scoreNames[3] ?? "Strong",
          color: "bg-emerald-500",
          textColor: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-500/30",
          bgTint: "bg-emerald-500/10",
          percent: 80,
        };
      case 4:
      default:
        return {
          label: t.scoreNames[4] ?? "Very strong",
          color: "bg-brand-500",
          textColor: "text-brand-700 dark:text-brand-300",
          border: "border-brand-500/30",
          bgTint: "bg-brand-500/10",
          percent: 100,
        };
    }
  };

  const scoreTheme = result ? getScoreTheme(result.score) : null;

  return (
    <div className="w-full space-y-6">
      {/* 1. Password Input Card */}
      <div className="rounded-[26px] border border-emerald-500/20 bg-white/90 p-5 sm:p-7 shadow-soft dark:border-emerald-500/20 dark:bg-[#07241a]/90">
        <div className="flex items-center justify-between gap-2 mb-3">
          <label
            htmlFor="password-check-input"
            className="flex items-center gap-2 text-sm font-bold text-brand-950 dark:text-brand-50"
          >
            <Lock size={16} className="text-brand-600 dark:text-brand-400" />
            <span>{t.passwordLabel}</span>
          </label>
          {value ? (
            <span className="font-mono text-xs font-bold text-brand-700/60 dark:text-brand-300/60">
              {value.length} / {MAX_PASSWORD_LENGTH}
            </span>
          ) : null}
        </div>

        {/* Input cluster with Reveal & Clear actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="password-check-input"
              type={revealed ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              maxLength={MAX_PASSWORD_LENGTH}
              className="w-full rounded-2xl border border-brand-200/80 bg-white p-3.5 pr-11 text-base sm:text-lg font-mono text-brand-950 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-50"
            />
            {value ? (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                title={revealed ? t.hidePassword : t.showPassword}
                aria-label={revealed ? t.hidePassword : t.showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700/60 transition hover:text-brand-950 dark:text-brand-300/60 dark:hover:text-brand-50"
              >
                {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={clear}
            disabled={!value}
            title={t.clear}
            aria-label={t.clear}
            className="flex min-h-[48px] items-center gap-1.5 rounded-2xl border border-brand-200/80 bg-white px-4 text-xs font-bold text-brand-950 shadow-2xs transition hover:border-brand-400 hover:bg-brand-50 active:scale-95 disabled:opacity-40 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 dark:hover:bg-brand-900"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">{common.clear}</span>
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      {/* 2. Analysis Results Section */}
      {result && scoreTheme ? (
        <div className="space-y-6">
          {/* Main Strength Meter Card */}
          <div className="relative overflow-hidden rounded-[26px] border border-emerald-500/25 bg-gradient-to-b from-white via-white to-emerald-50/30 p-5 sm:p-7 shadow-soft dark:border-emerald-500/20 dark:from-[#08291e] dark:via-[#06241a] dark:to-[#041a13]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {t.scoreLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-base font-black ${scoreTheme.textColor}`}>
                  {scoreTheme.label}
                </span>
                <span className="rounded-lg bg-brand-500/15 px-2.5 py-0.5 font-mono text-xs font-black text-brand-800 ring-1 ring-brand-500/25 dark:bg-brand-400/15 dark:text-brand-200">
                  {result.score} / 4
                </span>
              </div>
            </div>

            {/* 5-segment animated score bar */}
            <div
              className="grid grid-cols-5 gap-1.5 h-3 rounded-full overflow-hidden bg-emerald-950/10 dark:bg-emerald-950/60 p-0.5"
              role="progressbar"
              aria-label={t.scoreLabel}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={result.score}
            >
              {[0, 1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full rounded-full transition-all duration-300 ${
                    step <= result.score
                      ? scoreTheme.color
                      : "bg-transparent opacity-20"
                  }`}
                />
              ))}
            </div>

            {/* Guesses metadata */}
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-brand-800/75 dark:text-brand-200/75 pt-3 border-t border-emerald-500/15">
              <span>{t.guesses}:</span>
              <strong className="font-mono text-sm text-brand-950 dark:text-brand-50">
                {new Intl.NumberFormat(locale).format(result.guesses)}
              </strong>
            </div>
          </div>

          {/* Crack Times Grid (Online vs Offline) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-emerald-500/20 bg-white/90 p-5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/90">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 mb-2">
                <Clock size={15} className="text-brand-600 dark:text-brand-400" />
                <span>{t.onlineThrottled}</span>
              </div>
              <div className="font-mono text-lg font-black text-brand-950 dark:text-brand-50 break-words">
                {result.onlineThrottled}
              </div>
            </div>

            <div className="rounded-[22px] border border-emerald-500/20 bg-white/90 p-5 shadow-2xs dark:border-emerald-500/20 dark:bg-[#07241a]/90">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 mb-2">
                <Zap size={15} className="text-amber-600 dark:text-amber-400" />
                <span>{t.offlineSlowHashing}</span>
              </div>
              <div className="font-mono text-lg font-black text-brand-950 dark:text-brand-50 break-words">
                {result.offlineSlowHashing}
              </div>
            </div>
          </div>

          {/* Warning Banner (if detected) */}
          {result.warning ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-200"
            >
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{result.warning}</span>
            </div>
          ) : null}

          {/* Suggestions List */}
          {result.suggestions.length > 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 sm:p-5 dark:border-emerald-500/20 dark:bg-[#07241a]/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70 mb-3">
                <Info size={15} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Gợi ý cải thiện" : "Suggestions"}</span>
              </div>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-brand-900/80 dark:text-brand-100/80"
                  >
                    <Check size={15} className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-brand-700/60 dark:text-brand-300/60 text-center">
            {t.estimateNote}
          </p>
        </div>
      ) : !loading && !value ? (
        <div className="rounded-[22px] border border-dashed border-emerald-500/20 p-8 text-center text-sm font-medium text-brand-700/60 dark:text-brand-300/60">
          {t.empty}
        </div>
      ) : null}

      <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60">
        {t.privacy}
      </p>
    </div>
  );
}
