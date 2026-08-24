export type DownloadSpec = { blob: Blob; fileName: string };
export type DownloadTextSpec = { value: string; fileName: string; mimeType?: string };

export function sanitizeDownloadName(value: string, fallback: string) {
  const sanitized = value
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return sanitized || fallback;
}

export function downloadBlob({ blob, fileName }: DownloadSpec) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeDownloadName(fileName, "sfrankey-download");
  link.rel = "noopener";
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadText({ value, fileName, mimeType = "text/plain;charset=utf-8" }: DownloadTextSpec) {
  downloadBlob({ blob: new Blob([value], { type: mimeType }), fileName });
}
