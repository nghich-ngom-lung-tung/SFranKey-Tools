export type PasswordOptions = { length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean; noRepeat: boolean };
const groups = { uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lowercase: "abcdefghijklmnopqrstuvwxyz", numbers: "0123456789", symbols: "!@#$%^&*()-_=+[]{}:,.?" } as const;
const ambiguous = new Set("0OIl1|`'\" ".split(""));

function randomInt(max: number) {
  if (!Number.isInteger(max) || max <= 0) throw new Error("Invalid random range");
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  const limit = Math.floor(0xffffffff / max) * max;
  let value = values[0];
  while (value >= limit) { crypto.getRandomValues(values); value = values[0]; }
  return value % max;
}

function randomChar(source: string) { return source[randomInt(source.length)]; }
function shuffle(chars: string[]) { for (let i = chars.length - 1; i > 0; i -= 1) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; } return chars; }

export function generatePassword(options: PasswordOptions) {
  const selected = Object.entries(groups).filter(([key]) => options[key as keyof typeof groups] !== false).map(([, value]) => value).join("");
  if (!selected || options.length < 4 || options.length > 128) throw new Error("Choose a valid length and character set");
  const availableGroups = Object.entries(groups).filter(([key]) => options[key as keyof typeof groups] !== false).map(([, value]) => value);
  const pool = options.excludeAmbiguous ? selected.split("").filter((char) => !ambiguous.has(char)).join("") : selected;
  if (!pool || (options.noRepeat && pool.length < options.length)) throw new Error("The selected character set cannot satisfy these options");
  const chars = availableGroups.map((group) => { const clean = options.excludeAmbiguous ? group.split("").filter((char) => !ambiguous.has(char)).join("") : group; return randomChar(clean); });
  while (chars.length < options.length) {
    let char = randomChar(pool);
    if (options.noRepeat && chars.includes(char) && pool.length >= options.length) continue;
    chars.push(char);
  }
  return shuffle(chars).join("");
}

export function estimateEntropy(password: string, options?: Partial<PasswordOptions>) {
  const pool = (options?.uppercase !== false ? 26 : 0) + (options?.lowercase !== false ? 26 : 0) + (options?.numbers !== false ? 10 : 0) + (options?.symbols !== false ? 25 : 0);
  return Math.round(password.length * Math.log2(Math.max(pool, 1)));
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: "very-weak" | "weak" | "medium" | "strong" | "very-strong"; suggestions: string[]; entropy: number };
export function assessPassword(password: string): Strength {
  if (!password) return { score: 0, label: "very-weak", suggestions: ["Use a longer password."], entropy: 0 };
  const classes = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  let score = Math.min(4, Math.floor(password.length / 6) + classes - 2) as 0 | 1 | 2 | 3 | 4;
  if (/^(.)\1+$/.test(password) || /12345|qwerty|password|admin/i.test(password)) score = 0;
  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push("Use at least 12 characters.");
  if (classes < 3) suggestions.push("Mix more character types.");
  if (/123|abc|qwerty|password/i.test(password)) suggestions.push("Avoid common sequences and words.");
  const labels = ["very-weak", "weak", "medium", "strong", "very-strong"] as const;
  return { score, label: labels[score], suggestions, entropy: estimateEntropy(password, { uppercase: /[A-Z]/.test(password), lowercase: /[a-z]/.test(password), numbers: /\d/.test(password), symbols: /[^A-Za-z0-9]/.test(password) }) };
}
