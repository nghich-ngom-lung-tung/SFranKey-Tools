export function formatJson(input: string, space = 2, sortKeys = false) {
  const value: unknown = JSON.parse(input);
  const normalized = sortKeys ? sortJson(value) : value;
  return JSON.stringify(normalized, null, space);
}
export function minifyJson(input: string, sortKeys = false) {
  const value: unknown = JSON.parse(input);
  return JSON.stringify(sortKeys ? sortJson(value) : value);
}
export function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sortJson(item)]));
  return value;
}
export function jsonErrorMessage(error: unknown) { return error instanceof SyntaxError ? error.message : "Invalid JSON"; }
