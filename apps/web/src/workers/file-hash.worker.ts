import {
  createSHA256,
  createSHA384,
  createSHA512,
  type IHasher,
} from "hash-wasm";
import {
  formatDigest,
  type DigestFormat,
  type HashAlgorithm,
} from "@sfrankey/tool-core/hash";

type Request =
  | {
      type: "start";
      jobId: string;
      file: File;
      algorithm: HashAlgorithm;
      format: DigestFormat;
    }
  | { type: "cancel"; jobId: string };
type Response =
  | {
      type: "progress";
      jobId: string;
      processed: number;
      total: number;
      percent: number;
    }
  | { type: "result"; jobId: string; digest: string; durationMs: number }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: Response) => void;
};
const canceled = new Set<string>();
const chunkSize = 4 * 1024 * 1024;

async function createHasher(algorithm: HashAlgorithm): Promise<IHasher> {
  if (algorithm === "SHA-384") return createSHA384();
  if (algorithm === "SHA-512") return createSHA512();
  return createSHA256();
}

async function run(request: Extract<Request, { type: "start" }>) {
  const started = performance.now();
  try {
    const hasher = await createHasher(request.algorithm);
    hasher.init();
    if (request.file.size === 0) {
      scope.postMessage({
        type: "progress",
        jobId: request.jobId,
        processed: 0,
        total: 0,
        percent: 100,
      });
    }
    for (let offset = 0; offset < request.file.size; offset += chunkSize) {
      if (canceled.has(request.jobId)) {
        scope.postMessage({ type: "canceled", jobId: request.jobId });
        return;
      }
      const end = Math.min(offset + chunkSize, request.file.size);
      const chunk = new Uint8Array(
        await request.file.slice(offset, end).arrayBuffer(),
      );
      if (canceled.has(request.jobId)) {
        scope.postMessage({ type: "canceled", jobId: request.jobId });
        return;
      }
      hasher.update(chunk);
      const processed = end;
      scope.postMessage({
        type: "progress",
        jobId: request.jobId,
        processed,
        total: request.file.size,
        percent: request.file.size
          ? (processed / request.file.size) * 100
          : 100,
      });
    }
    if (canceled.has(request.jobId)) {
      scope.postMessage({ type: "canceled", jobId: request.jobId });
      return;
    }
    scope.postMessage({
      type: "result",
      jobId: request.jobId,
      digest: formatDigest(hasher.digest("binary"), request.format),
      durationMs: Math.round(performance.now() - started),
    });
  } catch {
    scope.postMessage({
      type: "error",
      jobId: request.jobId,
      code: "WORKER_INIT",
    });
  }
}

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type === "cancel") {
    canceled.add(request.jobId);
    return;
  }
  canceled.delete(request.jobId);
  void run(request).finally(() => canceled.delete(request.jobId));
};
