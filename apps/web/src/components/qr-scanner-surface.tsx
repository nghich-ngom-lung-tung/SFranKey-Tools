"use client";

import * as React from "react";
import { scanQrImage } from "@sfrankey/tool-core/qr-scan";
import { FileDropzone, type FileErrorCode } from "@/components/file-dropzone";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Upload,
  VideoOff,
} from "lucide-react";

export type ScannerErrorCode = FileErrorCode | "noQr" | "camera" | "invalid";
export type QrScannerLabels = {
  drop: string;
  browse: string;
  active: string;
  remove: string;
  camera: string;
  stopCamera: string;
  pasteHint: string;
  processing: string;
  scanning?: string;
  errors: Record<ScannerErrorCode, string>;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

async function detectImageMime(
  file: File,
): Promise<(typeof ACCEPT)[number] | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png =
    bytes.length >= 8 &&
    bytes
      .slice(0, 8)
      .every(
        (byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index],
      );
  const jpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const webp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (png) return "image/png";
  if (jpeg) return "image/jpeg";
  if (webp) return "image/webp";
  return null;
}

export function QrScannerSurface({
  labels,
  onDecoded,
  onError,
  className = "",
  resetKey = 0,
}: {
  labels: QrScannerLabels;
  onDecoded: (value: string) => void;
  onError?: (code: ScannerErrorCode) => void;
  className?: string;
  resetKey?: number;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [camera, setCamera] = React.useState(false);
  const [mode, setMode] = React.useState<"file" | "camera">("file");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<ScannerErrorCode | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const lastFrameRef = React.useRef(0);
  const scanJobRef = React.useRef(0);
  const previewUrlRef = React.useRef<string | null>(null);
  previewUrlRef.current = previewUrl;

  const reportError = React.useCallback(
    (code: ScannerErrorCode) => {
      setError(code);
      onError?.(code);
    },
    [onError],
  );

  const releaseCamera = React.useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopCamera = React.useCallback(() => {
    releaseCamera();
    setCamera(false);
  }, [releaseCamera]);

  const startCamera = React.useCallback(async () => {
    setCamera(true);
    setMode("camera");
    setError(null);
  }, []);

  const clearFile = React.useCallback(() => {
    scanJobRef.current += 1;
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
    setProcessing(false);
  }, []);

  const scanFile = React.useCallback(
    async (selected: File) => {
      const jobId = ++scanJobRef.current;
      stopCamera();
      setProcessing(true);
      setError(null);
      if (
        selected.type &&
        !ACCEPT.includes(selected.type) &&
        selected.type !== "application/octet-stream"
      ) {
        setProcessing(false);
        reportError("type");
        return;
      }
      if (selected.size > MAX_IMAGE_BYTES) {
        setProcessing(false);
        reportError("size");
        return;
      }
      setFile(selected);
      const objUrl = URL.createObjectURL(selected);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objUrl;
      });

      let bitmap: ImageBitmap | null = null;
      try {
        const detectedMime = await detectImageMime(selected);
        if (jobId !== scanJobRef.current) return;
        if (!detectedMime) throw new Error("invalid");
        bitmap = await createImageBitmap(selected);
        if (jobId !== scanJobRef.current) return;
        const canvas = canvasRef.current ?? document.createElement("canvas");
        const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("invalid");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const value = scanQrImage(
          context.getImageData(0, 0, canvas.width, canvas.height),
        );
        if (!value) throw new Error("noQr");
        if (jobId !== scanJobRef.current) return;
        stopCamera();
        setError(null);
        onDecoded(value);
      } catch (caught) {
        if (jobId !== scanJobRef.current) return;
        const code =
          caught instanceof Error &&
          ["noQr", "invalid"].includes(caught.message)
            ? (caught.message as "noQr" | "invalid")
            : "invalid";
        reportError(code);
      } finally {
        bitmap?.close();
        if (jobId === scanJobRef.current) setProcessing(false);
      }
    },
    [onDecoded, reportError, stopCamera],
  );

  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pasted = event.clipboardData?.files?.[0];
      if (pasted) void scanFile(pasted);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [scanFile]);

  React.useEffect(() => {
    if (!camera) return;
    let cancelled = false;
    const scanFrame = (timestamp: number) => {
      if (cancelled || !streamRef.current) return;
      if (timestamp - lastFrameRef.current < 100) {
        frameRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      lastFrameRef.current = timestamp;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        frameRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reportError("camera");
        stopCamera();
        return;
      }
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const value = scanQrImage(
          context.getImageData(0, 0, canvas.width, canvas.height),
        );
        if (value) {
          stopCamera();
          setError(null);
          onDecoded(value);
          return;
        }
      } catch {
        reportError("camera");
        stopCamera();
        return;
      }
      frameRef.current = requestAnimationFrame(scanFrame);
    };
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch {
        setCamera(false);
        reportError("camera");
      }
    })();
    return () => {
      cancelled = true;
      releaseCamera();
    };
  }, [camera, onDecoded, releaseCamera, reportError, stopCamera]);

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) stopCamera();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [stopCamera]);

  React.useEffect(
    () => () => {
      scanJobRef.current += 1;
      releaseCamera();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [releaseCamera],
  );

  React.useEffect(() => {
    scanJobRef.current += 1;
    stopCamera();
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
    setProcessing(false);
  }, [resetKey, stopCamera]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-1.5 dark:border-emerald-500/20 dark:bg-emerald-950/40">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setMode("file");
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === "file" && !camera
              ? "bg-white text-brand-950 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-900/90 dark:text-brand-50 font-black"
              : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
          }`}
        >
          <ImageIcon size={16} className="text-brand-600 dark:text-brand-300" />
          <span>{labels.browse}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (camera) {
              stopCamera();
              setMode("file");
            } else {
              void startCamera();
            }
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            camera
              ? "bg-brand-500 text-brand-950 shadow-sm font-black"
              : "text-brand-800/70 hover:text-brand-950 dark:text-brand-200/70 dark:hover:text-brand-50"
          }`}
        >
          <Camera size={16} className={camera ? "" : "text-brand-600 dark:text-brand-300"} />
          <span>{camera ? labels.stopCamera : labels.camera}</span>
        </button>
      </div>

      {/* Main Scanner Body */}
      {camera ? (
        <div className="relative aspect-[4/3] sm:aspect-video w-full overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-black shadow-raised">
          <video
            ref={videoRef}
            className="size-full object-cover"
            muted
            playsInline
            aria-label={labels.camera}
          />
          {/* Cyber reticle overlay */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-48 sm:size-56 rounded-2xl border-2 border-dashed border-emerald-400/80">
              {/* Corner brackets */}
              <div className="absolute -left-1 -top-1 size-4 border-l-2 border-t-2 border-emerald-400" />
              <div className="absolute -right-1 -top-1 size-4 border-r-2 border-t-2 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-emerald-400" />
              {/* Animated laser scanning line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
            <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
              {labels.scanning ?? labels.processing}
            </span>
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-black transition"
            >
              <VideoOff size={14} />
              <span>{labels.stopCamera}</span>
            </button>
          </div>
        </div>
      ) : file && previewUrl ? (
        /* Real QR Image Preview Viewport */
        <div className="relative rounded-3xl border border-emerald-500/30 bg-white/95 p-4 shadow-raised backdrop-blur-xl dark:border-emerald-500/25 dark:bg-[#07241a]/95 flex flex-col items-center gap-3">
          {/* Uploaded QR Image */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-white p-2.5 shadow-sm ring-4 ring-emerald-500/10 dark:border-emerald-500/20">
            <img
              src={previewUrl}
              alt="Uploaded QR Code"
              className="max-h-52 sm:max-h-60 w-auto object-contain rounded-xl"
            />
          </div>

          {/* File details badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="truncate max-w-[180px] sm:max-w-xs font-mono text-xs font-bold text-brand-950 dark:text-brand-50">
              {file.name}
            </span>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-800 dark:text-brand-200">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Inline error inside preview card */}
          {error ? (
            <div
              role="alert"
              className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {labels.errors[error]}
            </div>
          ) : null}

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 pt-1 w-full justify-center">
            <label
              htmlFor="qr-scanner-file-replace"
              className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-emerald-100/70 hover:bg-emerald-200/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 px-3.5 py-2 text-xs font-bold text-brand-950 dark:text-brand-50 transition"
            >
              <Upload size={14} className="text-brand-600 dark:text-brand-300" />
              <span>{labels.browse}</span>
            </label>
            <input
              id="qr-scanner-file-replace"
              type="file"
              accept={ACCEPT.join(",")}
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void scanFile(picked);
                e.currentTarget.value = "";
              }}
            />

            <button
              type="button"
              onClick={clearFile}
              className="flex items-center gap-1.5 rounded-xl border border-brand-200/80 hover:bg-brand-50 dark:border-brand-800 dark:hover:bg-brand-900/60 px-3.5 py-2 text-xs font-semibold text-brand-800 dark:text-brand-200 transition"
            >
              <RotateCcw size={13} />
              <span>{labels.remove}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div>
          <FileDropzone
            id="qr-scanner-file"
            accept={ACCEPT}
            maxBytes={MAX_IMAGE_BYTES}
            file={null}
            labels={{
              idle: labels.drop,
              active: labels.active,
              browse: labels.browse,
              remove: labels.remove,
            }}
            onFile={(selected) => void scanFile(selected)}
            onRejected={reportError}
            onClear={clearFile}
          />
        </div>
      )}

      {/* Paste hint */}
      <p className="text-center text-xs font-medium text-brand-700/60 dark:text-brand-300/60">
        {labels.pasteHint}
      </p>

      {processing ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500/15 p-3 text-xs font-bold text-brand-900 dark:text-brand-100 animate-pulse"
        >
          <Sparkles size={15} className="text-brand-600 dark:text-brand-400" />
          <span>{labels.processing}</span>
        </div>
      ) : null}

      {error && !(file && previewUrl) ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300"
        >
          {labels.errors[error]}
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
