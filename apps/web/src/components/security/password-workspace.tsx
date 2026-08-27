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
import { useToast } from "@/components/providers/toast-provider";
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
  Sliders,
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
      {/* 1. Centered Segmented Mode Switcher */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t.title}
          className="inline-flex w-full max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-1.5 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/50"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "characters"}
            onClick={() => setMode("characters")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              mode === "characters"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <Dices size={16} className={mode === "characters" ? "text-brand-600 dark:text-brand-300" : ""} />
            <span>{t.modes.characters}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "passphrase"}
            onClick={() => setMode("passphrase")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              mode === "passphrase"
                ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
                : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
            }`}
          >
            <FileText size={16} className={mode === "passphrase" ? "text-brand-600 dark:text-brand-300" : ""} />
            <span>{t.modes.passphrase}</span>
          </button>
        </div>
      </div>

      {/* 2. Symmetrical 2-Column Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: Configuration Studio */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            {/* Header with Title & Reset Button */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/75 dark:text-brand-200/75">
                <Sliders size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Cấu hình & Tùy chọn" : "Settings & Options"}</span>
              </div>

              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-brand-800 shadow-2xs hover:bg-white dark:border-emerald-500/20 dark:bg-[#07241a]/80 dark:text-brand-200 transition"
              >
                <RotateCw size={12} className="text-brand-600 dark:text-brand-400" />
                <span>{common.reset}</span>
              </button>
            </div>

            {mode === "characters" ? (
              /* --- RANDOM CHARACTERS CONTROLS --- */
              <div className="space-y-5">
                {/* Length Control with Quick Presets */}
                <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="password-length-slider"
                      className="flex items-center gap-2 text-xs font-bold text-brand-950 dark:text-brand-50"
                    >
                      <KeyRound size={14} className="text-brand-600 dark:text-brand-400" />
                      <span>{t.length}:</span>
                      <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-black text-brand-800 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                        {characterOptions.length} {locale === "vi" ? "ký tự" : "chars"}
                      </span>
                    </label>

                    {/* Length Preset Chips */}
                    <div className="flex items-center gap-1">
                      {LENGTH_PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setCharacterOptions((prev) => ({ ...prev, length: val }))
                          }
                          className={`rounded-lg px-2 py-0.5 text-xs font-mono font-bold transition ${
                            characterOptions.length === val
                              ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                              : "bg-emerald-50/80 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200"
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
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldAlert size={13} className="shrink-0" />
                      <span>{t.shortLengthWarning}</span>
                    </p>
                  ) : null}
                </div>

                {/* Character Set Switches */}
                <div className="rounded-2xl border border-emerald-500/20 bg-white/80 p-3.5 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80 divide-y divide-emerald-500/10">
                  {optionCards.map((opt) => {
                    const isChecked = characterOptions[opt.key];
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="switch"
                        aria-checked={Boolean(isChecked)}
                        onClick={() => updateCharacterOption(opt.key)}
                        className="group flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 px-1 -mx-1 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                              isChecked
                                ? "bg-brand-500/15 ring-1 ring-brand-500/30 dark:bg-brand-400/15"
                                : "bg-brand-100/60 dark:bg-brand-900/40 opacity-50"
                            }`}
                          >
                            {opt.icon}
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-bold truncate transition-colors ${
                                isChecked
                                  ? "text-brand-950 dark:text-brand-50"
                                  : "text-brand-900/50 dark:text-brand-200/50"
                              }`}
                            >
                              {opt.label}
                            </div>
                            <div className="font-mono text-[10px] text-brand-700/60 dark:text-brand-300/60">
                              {opt.badge}
                            </div>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                            isChecked
                              ? "bg-brand-500 shadow-inner shadow-brand-600/30"
                              : "bg-brand-200 dark:bg-brand-800"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 size-4 rounded-full bg-white shadow-md transition-all duration-200 ${
                              isChecked ? "left-[18px]" : "left-0.5"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

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
                    <div className="rounded-2xl border border-emerald-500/15 bg-white/60 p-3.5 dark:border-emerald-500/15 dark:bg-[#07241a]/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                          <Layers size={13} className="text-brand-600 dark:text-brand-400" />
                          <span>{locale === "vi" ? "Ký tự khả dụng" : "Character pool"}</span>
                        </div>
                        <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-[11px] font-black text-brand-800 ring-1 ring-brand-500/25 dark:bg-brand-400/15 dark:text-brand-200">
                          {poolSize} {locale === "vi" ? "ký tự" : "chars"}
                        </span>
                      </div>
                      {pool.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {pool.map((ch, i) => {
                            const isNumber = /[0-9]/.test(ch);
                            const isSymbol = /[^a-zA-Z0-9]/.test(ch);
                            const isUpper = /[A-Z]/.test(ch);
                            return (
                              <span
                                key={`${ch}-${i}`}
                                className={`inline-flex size-6 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                                  isSymbol
                                    ? "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300"
                                    : isNumber
                                      ? "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300"
                                      : isUpper
                                        ? "bg-brand-500/12 text-brand-900 ring-1 ring-brand-500/20 dark:text-brand-100 font-black"
                                        : "bg-brand-500/8 text-brand-800/80 ring-1 ring-brand-500/15 dark:text-brand-200/80"
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
              </div>
            ) : (
              /* --- PASSPHRASE CONTROLS --- */
              <div className="space-y-5">
                {/* Word Count Control */}
                <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="passphrase-word-slider"
                      className="flex items-center gap-2 text-xs font-bold text-brand-950 dark:text-brand-50"
                    >
                      <FileText size={14} className="text-brand-600 dark:text-brand-400" />
                      <span>{t.wordCount}:</span>
                      <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-black text-brand-800 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200">
                        {passphraseOptions.wordCount} {locale === "vi" ? "từ" : "words"}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      {WORD_PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setPassphraseOptions((prev) => ({ ...prev, wordCount: val }))
                          }
                          className={`rounded-lg px-2 py-0.5 text-xs font-mono font-bold transition ${
                            passphraseOptions.wordCount === val
                              ? "bg-brand-500 text-brand-950 shadow-2xs font-black"
                              : "bg-emerald-50/80 text-brand-900/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-brand-200"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

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
                </div>

                {/* Separator Chips Selection (Symmetrical Vertical Stacked Cards) */}
                <div className="rounded-2xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                    {t.separator}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: " ", label: locale === "vi" ? "Khoảng trắng" : t.separatorSpace, icon: "␣" },
                      { value: "-", label: locale === "vi" ? "Gạch ngang" : t.separatorDash, icon: "-" },
                      { value: "_", label: locale === "vi" ? "Gạch dưới" : t.separatorUnderscore, icon: "_" },
                      { value: ".", label: locale === "vi" ? "Dấu chấm" : t.separatorDot, icon: "." },
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
                          className={`flex flex-col items-center justify-center rounded-2xl border p-2 min-h-[66px] transition-all duration-200 ${
                            isSelected
                              ? "border-emerald-500 bg-brand-500/15 text-brand-950 ring-2 ring-emerald-500/30 shadow-sm dark:border-emerald-400 dark:bg-brand-400/15 dark:text-brand-50 font-black"
                              : "border-emerald-500/20 bg-white/70 text-brand-900/70 hover:border-brand-300 hover:bg-white dark:border-emerald-500/15 dark:bg-[#07241a]/60 dark:text-brand-200/70 dark:hover:bg-[#07241a]"
                          }`}
                        >
                          <span className="font-mono text-base font-black text-brand-700 dark:text-brand-300 leading-none mb-1.5">
                            {sep.icon}
                          </span>
                          <span className="text-[11px] font-bold text-center truncate w-full px-0.5">
                            {sep.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capitalize Words Toggle Card */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={passphraseOptions.capitalizeWords}
                  onClick={() =>
                    setPassphraseOptions((prev) => ({
                      ...prev,
                      capitalizeWords: !prev.capitalizeWords,
                    }))
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-emerald-500/20 bg-white/80 p-3.5 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80 transition-colors hover:bg-white dark:hover:bg-[#07241a]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-black rounded-lg bg-brand-500/15 px-2.5 py-1 text-brand-800 dark:text-brand-200 ring-1 ring-brand-500/25">
                      Aa
                    </span>
                    <span className="text-xs font-bold text-brand-950 dark:text-brand-50">
                      {t.capitalizeWords}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                      passphraseOptions.capitalizeWords
                        ? "bg-brand-500 shadow-inner shadow-brand-600/30"
                        : "bg-brand-200 dark:bg-brand-800"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 size-4 rounded-full bg-white shadow-md transition-all duration-200 ${
                        passphraseOptions.capitalizeWords ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </div>
                </button>
              </div>
            )}

            {/* Batch Count Selector */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-950 dark:text-brand-50">
                <Layers size={14} className="text-brand-600 dark:text-brand-400" />
                <label htmlFor="password-count-select">{t.batchCount}:</label>
              </div>
              <select
                id="password-count-select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-xl border border-emerald-500/25 bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-950 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-emerald-500/20 dark:bg-[#07241a]/90 dark:text-brand-50"
              >
                <option value="1">1 {locale === "vi" ? "kết quả" : "result"}</option>
                <option value="5">5 {locale === "vi" ? "kết quả" : "results"}</option>
                <option value="10">10 {locale === "vi" ? "kết quả" : "results"}</option>
                <option value="20">20 {locale === "vi" ? "kết quả" : "results"}</option>
                <option value="50">50 {locale === "vi" ? "kết quả" : "results"}</option>
              </select>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60 pt-3 border-t border-emerald-500/15">
            {t.privacy}
          </p>
        </div>

        {/* RIGHT COLUMN: Live Stage & Security Inspector */}
        <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/85 via-white/95 to-teal-50/60 p-5 sm:p-7 shadow-[0_16px_40px_rgba(26,105,71,0.08)] backdrop-blur-xl dark:border-emerald-500/25 dark:from-[#08291e]/95 dark:via-[#06241a]/95 dark:to-[#041a13]/95 flex flex-col justify-between gap-6 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/15" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15" />

          <div className="relative z-10 space-y-5">
            {/* Header with Title & Length/Count Badge */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-200/80">
                <Zap size={16} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Mật khẩu trực tiếp" : "Live Output"}</span>
              </div>

              {primaryResult ? (
                <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-900 ring-1 ring-emerald-500/30 dark:bg-emerald-900/60 dark:text-emerald-200">
                  {primaryResult.length} {locale === "vi" ? "ký tự" : "chars"}
                </span>
              ) : null}
            </div>

            {/* Main Hero Password Display Card */}
            <div className="rounded-3xl border border-emerald-500/25 bg-white/95 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/90 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  {locale === "vi" ? "Kết quả chính" : "Primary Password"}
                </span>

                {/* Quick Action Toolbar */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRevealed((v) => !v)}
                    title={revealed ? t.hide : t.reveal}
                    aria-label={revealed ? t.hide : t.reveal}
                    className="grid size-8 place-items-center rounded-lg border border-emerald-500/20 bg-white text-brand-900 shadow-2xs hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:text-brand-100 transition"
                  >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleRoll()}
                    disabled={busy}
                    title={t.generate}
                    aria-label={t.generate}
                    className="grid size-8 place-items-center rounded-lg border border-emerald-500/20 bg-white text-brand-900 shadow-2xs hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:text-brand-100 transition disabled:opacity-50"
                  >
                    <RotateCw
                      size={14}
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
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-bold text-brand-950 shadow-2xs hover:bg-brand-400 transition active:scale-95 disabled:opacity-50"
                  >
                    {copiedIndex === 0 ? (
                      <>
                        <Check size={13} className="stroke-[3]" />
                        <span>{common.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="stroke-[2.5]" />
                        <span>{common.copy}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Password String Box (Click to copy) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => void copyToClipboard(primaryResult, 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void copyToClipboard(primaryResult, 0);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-50/30 p-4 font-mono text-xl sm:text-2xl break-all tracking-wider select-all transition hover:border-brand-500 hover:bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-[#06241a]/60 dark:hover:border-brand-400"
                title={locale === "vi" ? "Nhấp để sao chép nhanh mật khẩu" : "Click to copy password"}
              >
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

            {/* Live Entropy & Strength Progress Meter */}
            {primaryResult && entropy > 0 ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-brand-900/80 dark:text-brand-100/80">
                    <ShieldCheck size={15} className="text-brand-600 dark:text-brand-400" />
                    <span>
                      {t.entropy}:{" "}
                      <strong className="text-brand-950 dark:text-brand-50 font-mono">
                        {entropy.toFixed(1)} {t.bits}
                      </strong>
                    </span>
                  </div>
                  <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
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

            {/* Batch Results List (When count > 1) */}
            {count > 1 && results.length > 1 ? (
              <div className="space-y-2.5 rounded-3xl border border-emerald-500/20 bg-white/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-[#07241a]/80">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-800/70 dark:text-brand-200/70">
                  <span>
                    {locale === "vi"
                      ? `${results.length} mật khẩu đã tạo`
                      : `${results.length} generated passwords`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(rawValues.join("\n"), -1)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 transition"
                    >
                      {copiedIndex === -1 ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{t.copyAll}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDownloadOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-emerald-100/60 dark:text-brand-300 transition"
                    >
                      <FileDown size={12} />
                      <span>{t.download}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {results.map((result, index) => (
                    <div
                      key={`${result.value}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/15 bg-white p-2 text-xs shadow-2xs dark:border-emerald-500/15 dark:bg-[#07241a]"
                    >
                      <div className="flex min-w-0 items-center gap-2 flex-1 font-mono">
                        <span className="text-brand-700/50 dark:text-brand-300/50 text-[10px] w-4">
                          {index + 1}.
                        </span>
                        <div className="truncate flex-1">
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
                        className="grid size-6 place-items-center rounded text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70"
                      >
                        {copiedIndex === index ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Security & Standard Information Box */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-[#07241a]/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-brand-950 dark:text-brand-50">
                <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
                <span>{locale === "vi" ? "Tiêu chuẩn & An toàn mật mã" : "Cryptographic Security Standard"}</span>
              </div>
              <ul className="space-y-1 text-brand-800/75 dark:text-brand-200/75 text-[11px]">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{locale === "vi" ? "Sử dụng CSPRNG (crypto.getRandomValues) an toàn cấp trình duyệt." : "Powered by CSPRNG (crypto.getRandomValues) standard."}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{locale === "vi" ? "100% trong bộ nhớ tạm, không truyền qua mạng hay lưu lại." : "100% in-memory, never transmitted or persisted."}</span>
                </li>
              </ul>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>

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
