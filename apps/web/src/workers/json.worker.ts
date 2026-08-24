import {
  JsonToolError,
  processJson,
  type JsonDiagnostic,
  type JsonTransformOptions,
} from "@sfrankey/tool-core/json";

type Request =
  | { type: "process"; jobId: string; input: string; options: JsonTransformOptions }
  | { type: "cancel"; jobId: string };

type Response =
  | { type: "working"; jobId: string }
  | { type: "result"; jobId: string; result: ReturnType<typeof processJson> }
  | { type: "diagnostic"; jobId: string; diagnostic: JsonDiagnostic }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: Response) => void;
};
const canceled = new Set<string>();

function post(message: Response) {
  scope.postMessage(message);
}

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type === "cancel") {
    canceled.add(request.jobId);
    return;
  }
  canceled.delete(request.jobId);
  post({ type: "working", jobId: request.jobId });
  queueMicrotask(() => {
    if (canceled.has(request.jobId)) {
      post({ type: "canceled", jobId: request.jobId });
      return;
    }
    try {
      const result = processJson(request.input, request.options);
      if (canceled.has(request.jobId)) {
        post({ type: "canceled", jobId: request.jobId });
        return;
      }
      post({ type: "result", jobId: request.jobId, result });
    } catch (error) {
      if (canceled.has(request.jobId)) {
        post({ type: "canceled", jobId: request.jobId });
      } else if (error instanceof JsonToolError && error.diagnostic) {
        post({ type: "diagnostic", jobId: request.jobId, diagnostic: error.diagnostic });
      } else {
        post({
          type: "error",
          jobId: request.jobId,
          code: error instanceof JsonToolError ? error.code : "PROCESSING_FAILED",
        });
      }
    } finally {
      canceled.delete(request.jobId);
    }
  });
};
