import {
  Base64Error,
  decodeBase64Alphabet,
  encodeBase64Alphabet,
  estimateBase64DecodedSize,
  parseBase64DataUrlParts,
  validateBase64,
  type Base64Alphabet,
  type Base64FileEncoding,
} from "@sfrankey/tool-core/encoding";

type EncodeRequest = {
  type: "encode-file";
  jobId: string;
  file: File;
  alphabet: Base64Alphabet;
  output: Base64FileEncoding;
};
type DecodeRequest = {
  type: "decode-file";
  jobId: string;
  value: string;
  alphabet: Base64Alphabet;
  mimeType?: string;
};
type Request =
  EncodeRequest | DecodeRequest | { type: "cancel"; jobId: string };
type Response =
  | { type: "progress"; jobId: string; processed: number; total: number }
  | { type: "encoded"; jobId: string; value: string }
  | { type: "decoded"; jobId: string; bytes: ArrayBuffer; mimeType: string }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: Response, transfer?: Transferable[]) => void;
};
const canceled = new Set<string>();
const chunkSize = 768 * 1024;
const MIME_PATTERN =
  /^[a-zA-Z][a-zA-Z0-9!#$&^_.+-]{0,126}\/[a-zA-Z0-9!#$&^_.+-]{1,127}$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ENCODED_CHARACTERS = 14 * 1024 * 1024;

function post(message: Response, transfer?: Transferable[]) {
  scope.postMessage(message, transfer);
}
function isCanceled(jobId: string) {
  return canceled.has(jobId);
}
function yieldToMessages() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function encodeFile(request: EncodeRequest) {
  if (request.file.size > MAX_FILE_BYTES)
    throw new Base64Error("DECODED_SIZE_LIMIT");
  const parts: string[] = [];
  if (request.file.size === 0)
    post({ type: "progress", jobId: request.jobId, processed: 0, total: 0 });
  for (let offset = 0; offset < request.file.size; offset += chunkSize) {
    if (isCanceled(request.jobId)) {
      post({ type: "canceled", jobId: request.jobId });
      return;
    }
    const end = Math.min(offset + chunkSize, request.file.size);
    const bytes = new Uint8Array(
      await request.file.slice(offset, end).arrayBuffer(),
    );
    if (isCanceled(request.jobId)) {
      post({ type: "canceled", jobId: request.jobId });
      return;
    }
    parts.push(encodeBase64Alphabet(bytes, request.alphabet));
    post({
      type: "progress",
      jobId: request.jobId,
      processed: end,
      total: request.file.size,
    });
    await yieldToMessages();
  }
  const raw = parts.join("");
  const mimeType = MIME_PATTERN.test(request.file.type)
    ? request.file.type.toLowerCase()
    : "application/octet-stream";
  post({
    type: "encoded",
    jobId: request.jobId,
    value:
      request.output === "data-url" ? `data:${mimeType};base64,${raw}` : raw,
  });
}

async function decodeChunks(
  value: string,
  alphabet: Base64Alphabet,
  jobId: string,
) {
  const normalized = validateBase64(value, alphabet);
  const decodedSize = estimateBase64DecodedSize(normalized, alphabet);
  if (decodedSize > MAX_FILE_BYTES) throw new Base64Error("DECODED_SIZE_LIMIT");
  const output = new Uint8Array(decodedSize);
  let outputOffset = 0;
  if (normalized.length === 0)
    post({ type: "progress", jobId, processed: 0, total: 0 });
  for (let offset = 0; offset < normalized.length; offset += 4 * 1024) {
    if (isCanceled(jobId)) {
      post({ type: "canceled", jobId });
      return null;
    }
    const chunk = normalized.slice(offset, offset + 4 * 1024);
    const decoded = decodeBase64Alphabet(chunk, alphabet);
    output.set(decoded, outputOffset);
    outputOffset += decoded.byteLength;
    post({
      type: "progress",
      jobId,
      processed: Math.min(offset + chunk.length, normalized.length),
      total: normalized.length,
    });
    await yieldToMessages();
  }
  return output;
}

async function decodeFile(request: DecodeRequest) {
  try {
    if (request.value.length > MAX_ENCODED_CHARACTERS)
      throw new Base64Error("DECODED_SIZE_LIMIT");
    let value = request.value;
    let mimeType: string;
    if (/^data:/i.test(value)) {
      const parsed = parseBase64DataUrlParts(value);
      mimeType = parsed.mimeType;
      value = parsed.payload;
    } else {
      mimeType = request.mimeType || "application/octet-stream";
      if (!MIME_PATTERN.test(mimeType)) throw new Base64Error("INVALID_MIME");
      mimeType = mimeType.toLowerCase();
    }
    const output = await decodeChunks(value, request.alphabet, request.jobId);
    if (!output) return;
    if (isCanceled(request.jobId)) {
      post({ type: "canceled", jobId: request.jobId });
      return;
    }
    post(
      { type: "decoded", jobId: request.jobId, bytes: output.buffer, mimeType },
      [output.buffer],
    );
  } catch (error) {
    post({
      type: "error",
      jobId: request.jobId,
      code:
        error instanceof Error && "code" in error
          ? String((error as { code?: string }).code)
          : "INVALID_BASE64",
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
  void (
    request.type === "encode-file" ? encodeFile(request) : decodeFile(request)
  )
    .catch((error) =>
      post({
        type: "error",
        jobId: request.jobId,
        code:
          error instanceof Error && "code" in error
            ? String((error as { code?: string }).code)
            : "INVALID_BASE64",
      }),
    )
    .finally(() => canceled.delete(request.jobId));
};
