export function timestampToDate(value: number, unit: "seconds" | "milliseconds" = "seconds") {
  const date = new Date(unit === "seconds" ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
  return date;
}
export function dateToTimestamp(date: Date, unit: "seconds" | "milliseconds" = "seconds") { return unit === "seconds" ? Math.floor(date.getTime() / 1000) : date.getTime(); }
export function relativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return `${seconds}s`;
  if (abs < 3600) return `${Math.round(seconds / 60)}m`;
  if (abs < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}
