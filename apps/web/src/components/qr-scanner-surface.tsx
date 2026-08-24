"use client";

import * as React from "react";
import { Button } from "@sfrankey/ui";
import { scanQrImage } from "@sfrankey/tool-core/qr-scan";
import { FileDropzone, type FileErrorCode } from "@/components/file-dropzone";

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
  const [camera, setCamera] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<ScannerErrorCode | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const lastFrameRef = React.useRef(0);
  const scanJobRef = React.useRef(0);

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

  const scanFile = React.useCallback(
    async (selected: File) => {
      const jobId = ++scanJobRef.current;
      stopCamera();
      setProcessing(true);
      setError(null);
      if (selected.type && !ACCEPT.includes(selected.type) && selected.type !== "application/octet-stream") {
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
      let bitmap: ImageBitmap | null = null;
      try {
        const detectedMime = await detectImageMime(selected);
        if (jobId !== scanJobRef.current) return;
        if (!detectedMime)
          throw new Error("invalid");
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
        onDecoded(value);
      } catch (caught) {
        if (jobId !== scanJobRef.current) return;
        const code =
          caught instanceof Error &&
          ["noQr", "invalid"].includes(caught.message)
            ? (caught.message as "noQr" | "invalid")
            : "invalid";
        setFile(null);
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
    },
    [releaseCamera],
  );
  React.useEffect(() => {
    scanJobRef.current += 1;
    stopCamera();
    setFile(null);
    setError(null);
    setProcessing(false);
  }, [resetKey, stopCamera]);

  return (
    <div className={`grid gap-4 ${className}`}>
      <FileDropzone
        id="qr-scanner-file"
        accept={ACCEPT}
        maxBytes={MAX_IMAGE_BYTES}
        file={file}
        labels={{
          idle: labels.drop,
          active: labels.active,
          browse: labels.browse,
          remove: labels.remove,
        }}
        onFile={(selected) => void scanFile(selected)}
        onRejected={reportError}
        onClear={() => {
          scanJobRef.current += 1;
          setFile(null);
          setError(null);
          setProcessing(false);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setError(null);
            setCamera((value) => !value);
          }}
        >
          {camera ? labels.stopCamera : labels.camera}
        </Button>
        <p className="text-xs text-brand-800/65 dark:text-brand-200/65">
          {labels.pasteHint}
        </p>
      </div>
      {camera ? (
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-[var(--radius-lg)] bg-brand-950 object-cover"
          muted
          playsInline
          aria-label={labels.camera}
        />
      ) : null}
      {processing ? (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-brand-700 dark:text-brand-200"
        >
          {labels.processing}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
          {labels.errors[error]}
        </p>
      ) : null}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
