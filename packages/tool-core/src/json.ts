import {
  applyEdits,
  createScanner,
  format as formatJsonDocument,
  parseTree,
  visit,
  type Node,
  type NodeType,
} from "jsonc-parser";

// jsonc-parser publishes SyntaxKind as an ambient const enum. Keeping the
// token values local avoids leaking const-enum access through isolated builds.
const JSON_TOKEN = {
  eof: 17,
  lineComment: 12,
  blockComment: 13,
  lineBreak: 14,
  trivia: 15,
} as const;

export type JsonOperation = "validate" | "format" | "minify";
export type DeveloperToolErrorCode =
  | "EMPTY_INPUT"
  | "INPUT_TOO_LARGE"
  | "INVALID_FORMAT"
  | "OUTPUT_TOO_LARGE"
  | "WORKER_UNAVAILABLE"
  | "PROCESSING_FAILED";
export type JsonIndent =
  | { kind: "spaces"; size: 2 | 4 }
  | { kind: "tab" };

export type JsonDiagnosticCode =
  | "EMPTY_INPUT"
  | "INPUT_TOO_LARGE"
  | "INVALID_JSON"
  | "COMMENTS_NOT_ALLOWED"
  | "TRAILING_COMMA"
  | "DUPLICATE_KEY"
  | "MAX_DEPTH_EXCEEDED"
  | "OUTPUT_TOO_LARGE";

export type JsonDiagnostic = {
  code: JsonDiagnosticCode;
  offset: number;
  length: number;
  line: number;
  column: number;
  path?: Array<string | number>;
};

export type JsonTransformOptions = {
  operation: JsonOperation;
  indent: JsonIndent;
  sortKeys: boolean;
};

export type JsonRootType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

export type JsonTransformResult = {
  valid: true;
  output?: string;
  inputBytes: number;
  outputBytes?: number;
  rootType: JsonRootType;
};

export type JsonWorkerRequest =
  | { type: "process"; jobId: string; input: string; options: JsonTransformOptions }
  | { type: "cancel"; jobId: string };

export type JsonWorkerResponse =
  | { type: "working"; jobId: string }
  | { type: "result"; jobId: string; result: JsonTransformResult }
  | { type: "diagnostic"; jobId: string; diagnostic: JsonDiagnostic }
  | { type: "canceled"; jobId: string }
  | { type: "error"; jobId: string; code: DeveloperToolErrorCode | JsonDiagnosticCode };

export type JsonErrorCode =
  | JsonDiagnosticCode
  | "MAX_DEPTH_EXCEEDED"
  | "PROCESSING_FAILED";

export class JsonToolError extends Error {
  readonly code: JsonErrorCode;
  readonly diagnostic?: JsonDiagnostic;

  constructor(code: JsonErrorCode, diagnostic?: JsonDiagnostic) {
    super(code);
    this.name = "JsonToolError";
    this.code = code;
    this.diagnostic = diagnostic;
  }
}

export const JSON_MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const JSON_MAX_OUTPUT_BYTES = 15 * 1024 * 1024;
export const JSON_MAX_DEPTH = 512;

function lineColumn(text: string, offset: number) {
  const bounded = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;
  for (let index = 0; index < bounded; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      lineStart = index + 1;
    }
  }
  return { line, column: bounded - lineStart + 1 };
}

function diagnostic(
  text: string,
  code: JsonDiagnosticCode,
  offset: number,
  length: number,
  path?: Array<string | number>,
): JsonDiagnostic {
  return { code, offset, length: Math.max(1, length), ...lineColumn(text, offset), path };
}

function parserDiagnostic(text: string, error: number, offset: number, length: number) {
  const before = text.slice(0, offset).trimEnd();
  const around = text.slice(offset, offset + Math.max(1, length));
  const isComment = around.startsWith("/") || before.endsWith("/") || before.endsWith("*");
  if (isComment || error === 10 || error === 11) {
    return diagnostic(text, "COMMENTS_NOT_ALLOWED", offset, length);
  }
  if (error === 4 && before.endsWith(",") && /^[}\]]/.test(around)) {
    return diagnostic(text, "TRAILING_COMMA", offset, length);
  }
  return diagnostic(text, "INVALID_JSON", offset, length);
}

function collectDiagnostics(text: string): {
  root?: Node;
  diagnostics: JsonDiagnostic[];
} {
  const parseErrors: Array<{ error: number; offset: number; length: number }> = [];
  const root = parseTree(text, parseErrors, {
    disallowComments: true,
    allowTrailingComma: false,
    allowEmptyContent: false,
  });
  const diagnostics = parseErrors.map((item) =>
    parserDiagnostic(text, item.error, item.offset, item.length),
  );
  const seenKeys = new Set<string>();
  let depth = 0;
  let maxDepthOffset = -1;
  visit(
    text,
    {
      onObjectBegin(offset) {
        depth += 1;
        if (depth > JSON_MAX_DEPTH && maxDepthOffset < 0) maxDepthOffset = offset;
      },
      onObjectEnd() {
        depth -= 1;
      },
      onArrayBegin(offset) {
        depth += 1;
        if (depth > JSON_MAX_DEPTH && maxDepthOffset < 0) maxDepthOffset = offset;
      },
      onArrayEnd() {
        depth -= 1;
      },
      onObjectProperty(property, offset, length, _startLine, _startCharacter, pathSupplier) {
        const path = pathSupplier();
        const key = `${JSON.stringify(path)}:${property}`;
        if (seenKeys.has(key)) {
          diagnostics.push(diagnostic(text, "DUPLICATE_KEY", offset, length, [...path, property]));
        }
        seenKeys.add(key);
      },
    },
    { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false },
  );
  if (maxDepthOffset >= 0) diagnostics.push(diagnostic(text, "MAX_DEPTH_EXCEEDED", maxDepthOffset, 1));
  return { root, diagnostics: diagnostics.sort((left, right) => left.offset - right.offset) };
}

function assertInput(input: string): number {
  const bytes = new TextEncoder().encode(input).byteLength;
  if (!input.trim()) throw new JsonToolError("EMPTY_INPUT", diagnostic(input, "EMPTY_INPUT", 0, 1));
  if (bytes > JSON_MAX_INPUT_BYTES) throw new JsonToolError("INPUT_TOO_LARGE");
  return bytes;
}

export function analyzeJson(input: string) {
  const inputBytes = assertInput(input);
  const { root, diagnostics } = collectDiagnostics(input);
  return { root, diagnostics, inputBytes };
}

function indentText(indent: JsonIndent) {
  return indent.kind === "tab" ? "\t" : " ".repeat(indent.size);
}

function compareCodePoints(left: string, right: string) {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0) ?? 0);
  const rightPoints = Array.from(right, (value) => value.codePointAt(0) ?? 0);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
  }
  return leftPoints.length - rightPoints.length;
}

function renderNode(node: Node, source: string, indent: string, level: number, minify: boolean, sortKeys: boolean): string {
  const raw = source.slice(node.offset, node.offset + node.length);
  if (!node.children?.length || (node.type !== "object" && node.type !== "array")) return raw;

  const childIndent = minify ? "" : indent.repeat(level + 1);
  const currentIndent = minify ? "" : indent.repeat(level);
  if (node.type === "array") {
    const values = node.children.map((child) => renderNode(child, source, indent, level + 1, minify, sortKeys));
    if (!values.length) return "[]";
    return minify
      ? `[${values.join(",")}]`
      : `[\n${values.map((value) => `${childIndent}${value}`).join(",\n")}\n${currentIndent}]`;
  }

  const properties = node.children
    .map((property) => {
      const key = property.children?.[0];
      const value = property.children?.[1];
      if (!key || !value) return null;
      return { property, key, value, keyText: String(key.value ?? "") };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (sortKeys) properties.sort((left, right) => compareCodePoints(left.keyText, right.keyText));
  const values = properties.map(({ key, value }) => {
    const rendered = renderNode(value, source, indent, level + 1, minify, sortKeys);
    return `${source.slice(key.offset, key.offset + key.length)}${minify ? ":" : ": "}${rendered}`;
  });
  if (!values.length) return "{}";
  return minify
    ? `{${values.join(",")}}`
    : `{\n${values.map((value) => `${childIndent}${value}`).join(",\n")}\n${currentIndent}}`;
}

function minifySource(source: string) {
  const scanner = createScanner(source, false);
  let output = "";
  while (true) {
    const token = scanner.scan();
    if (token === JSON_TOKEN.eof) break;
    const offset = scanner.getTokenOffset();
    const length = scanner.getTokenLength();
    if (
      token !== JSON_TOKEN.trivia &&
      token !== JSON_TOKEN.lineBreak &&
      token !== JSON_TOKEN.lineComment &&
      token !== JSON_TOKEN.blockComment
    ) {
      output += source.slice(offset, offset + length);
    }
  }
  return output;
}

export function processJson(input: string, options: JsonTransformOptions): JsonTransformResult {
  const { root, diagnostics, inputBytes } = analyzeJson(input);
  if (diagnostics.length) throw new JsonToolError(diagnostics[0].code, diagnostics[0]);
  if (!root) throw new JsonToolError("INVALID_JSON");
  const rootType = toRootType(root.type);
  if (options.operation === "validate") {
    return { valid: true, inputBytes, rootType };
  }

  const indent = indentText(options.indent);
  const output = options.operation === "format" && !options.sortKeys
    ? applyEdits(input, formatJsonDocument(input, undefined, { insertSpaces: indent !== "\t", tabSize: indent === "\t" ? 1 : indent.length, eol: "\n", insertFinalNewline: false }))
    : options.operation === "minify" && !options.sortKeys
      ? minifySource(input)
      : renderNode(root, input, indent, 0, options.operation === "minify", options.sortKeys);
  const outputBytes = new TextEncoder().encode(output).byteLength;
  if (outputBytes > JSON_MAX_OUTPUT_BYTES) throw new JsonToolError("OUTPUT_TOO_LARGE");
  return { valid: true, output, inputBytes, outputBytes, rootType };
}

function toRootType(type: NodeType): JsonRootType {
  if (type === "property") throw new JsonToolError("INVALID_JSON");
  return type;
}

export function formatJson(input: string, space = 2, sortKeys = false) {
  return processJson(input, {
    operation: "format",
    indent: { kind: "spaces", size: space === 4 ? 4 : 2 },
    sortKeys,
  }).output ?? "";
}

export function minifyJson(input: string, sortKeys = false) {
  return processJson(input, {
    operation: "minify",
    indent: { kind: "spaces", size: 2 },
    sortKeys,
  }).output ?? "";
}

export function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareCodePoints(left, right))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }
  return value;
}

export function jsonErrorMessage(error: unknown) {
  return error instanceof JsonToolError ? error.code : "INVALID_JSON";
}
