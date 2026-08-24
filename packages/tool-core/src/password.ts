import type { PasswordStrengthLocale, PasswordStrengthResult } from "./password-strength";

export type PasswordGeneratorMode = "characters" | "passphrase";

export type CharacterPasswordOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  noRepeat: boolean;
};

export type PassphraseOptions = {
  wordCount: number;
  separator: " " | "-" | "_" | ".";
  capitalizeWords: boolean;
};

export type PasswordGenerationRequest =
  | { mode: "characters"; count: number; options: CharacterPasswordOptions }
  | { mode: "passphrase"; count: number; options: PassphraseOptions };

export type GeneratedPassword = {
  value: string;
  estimatedEntropyBits: number;
};

export const DEFAULT_CHARACTER_OPTIONS: CharacterPasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  noRepeat: false
};

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  wordCount: 6,
  separator: "-",
  capitalizeWords: false
};

export const EFF_WORDLIST_SIZE = 7_776;
export const PASSWORD_BATCH_MIN = 1;
export const PASSWORD_BATCH_MAX = 50;

export type PasswordErrorCode =
  | "INVALID_LENGTH"
  | "NO_CHARACTER_SET"
  | "IMPOSSIBLE_NO_REPEAT"
  | "INVALID_BATCH"
  | "INVALID_WORD_COUNT"
  | "INVALID_SEPARATOR";

export class PasswordGenerationError extends Error {
  readonly code: PasswordErrorCode;

  constructor(code: PasswordErrorCode) {
    super(code);
    this.name = "PasswordGenerationError";
    this.code = code;
  }
}

const groups = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}:,.?"
} as const;

const ambiguous = new Set(["O", "0", "I", "l", "1"]);

function randomInt(max: number) {
  if (!Number.isInteger(max) || max <= 0) throw new Error("Invalid random range");
  const maxUint32Exclusive = 0x1_0000_0000;
  const limit = maxUint32Exclusive - (maxUint32Exclusive % max);
  const values = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(values);
    value = values[0] ?? 0;
  } while (value >= limit);
  return value % max;
}

function randomChar(source: string) {
  return source[randomInt(source.length)] ?? "";
}

function shuffle(chars: string[]) {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex]!, chars[index]!];
  }
  return chars;
}

function cleanGroup(group: string, excludeAmbiguous: boolean) {
  return excludeAmbiguous ? [...group].filter((character) => !ambiguous.has(character)).join("") : group;
}

function selectedGroups(options: CharacterPasswordOptions) {
  return (Object.keys(groups) as Array<keyof typeof groups>)
    .filter((key) => options[key])
    .map((key) => cleanGroup(groups[key], options.excludeAmbiguous));
}

function validateCharacterOptions(options: CharacterPasswordOptions) {
  if (!Number.isInteger(options.length) || options.length < 4 || options.length > 128) {
    throw new PasswordGenerationError("INVALID_LENGTH");
  }
  const availableGroups = selectedGroups(options);
  if (availableGroups.length === 0 || availableGroups.some((group) => group.length === 0)) {
    throw new PasswordGenerationError("NO_CHARACTER_SET");
  }
  const pool = availableGroups.join("");
  if (options.noRepeat && pool.length < options.length) {
    throw new PasswordGenerationError("IMPOSSIBLE_NO_REPEAT");
  }
  return { availableGroups, pool };
}

export function generatePassword(options: CharacterPasswordOptions) {
  const { availableGroups, pool } = validateCharacterOptions(options);
  const chars = availableGroups.map((group) => randomChar(group));
  while (chars.length < options.length) {
    const character = randomChar(pool);
    if (options.noRepeat && chars.includes(character)) continue;
    chars.push(character);
  }
  return shuffle(chars).join("");
}

export function estimateEntropy(password: string, options?: Partial<CharacterPasswordOptions>) {
  const excludeAmbiguous = options?.excludeAmbiguous ?? false;
  const pool = (Object.keys(groups) as Array<keyof typeof groups>)
    .filter((key) => options?.[key] !== false)
    .map((key) => cleanGroup(groups[key], excludeAmbiguous))
    .join("");
  return password.length * Math.log2(Math.max(pool.length, 1));
}

export function estimateCharacterEntropy(options: CharacterPasswordOptions) {
  const { pool } = validateCharacterOptions(options);
  if (!options.noRepeat) return options.length * Math.log2(pool.length);
  return Array.from({ length: options.length }, (_, index) => Math.log2(pool.length - index)).reduce((total, bits) => total + bits, 0);
}

let effWordlistPromise: Promise<readonly string[]> | undefined;

export function loadEffWordlist() {
  effWordlistPromise ??= import("./data/eff-large-wordlist").then(({ EFF_LARGE_WORDLIST }) => EFF_LARGE_WORDLIST);
  return effWordlistPromise;
}

function validatePassphraseOptions(options: PassphraseOptions) {
  if (!Number.isInteger(options.wordCount) || options.wordCount < 4 || options.wordCount > 10) {
    throw new PasswordGenerationError("INVALID_WORD_COUNT");
  }
  if (![" ", "-", "_", "."].includes(options.separator)) {
    throw new PasswordGenerationError("INVALID_SEPARATOR");
  }
}

export function estimatePassphraseEntropy(options: PassphraseOptions) {
  validatePassphraseOptions(options);
  return options.wordCount * Math.log2(EFF_WORDLIST_SIZE);
}

export async function generatePassphrase(options: PassphraseOptions) {
  validatePassphraseOptions(options);
  const wordlist = await loadEffWordlist();
  const words = Array.from({ length: options.wordCount }, () => {
    const word = wordlist[randomInt(wordlist.length)] ?? "";
    return options.capitalizeWords ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : word;
  });
  return words.join(options.separator);
}

export function validatePasswordBatchCount(count: number) {
  if (!Number.isInteger(count) || count < PASSWORD_BATCH_MIN || count > PASSWORD_BATCH_MAX) {
    throw new PasswordGenerationError("INVALID_BATCH");
  }
}

export async function generatePasswordBatch(request: PasswordGenerationRequest): Promise<GeneratedPassword[]> {
  validatePasswordBatchCount(request.count);
  if (request.mode === "characters") {
    const entropy = estimateCharacterEntropy(request.options);
    return Array.from({ length: request.count }, () => ({ value: generatePassword(request.options), estimatedEntropyBits: entropy }));
  }
  const entropy = estimatePassphraseEntropy(request.options);
  const values = await Promise.all(Array.from({ length: request.count }, () => generatePassphrase(request.options)));
  return values.map((value) => ({ value, estimatedEntropyBits: entropy }));
}

export type { PasswordStrengthLocale, PasswordStrengthResult };
