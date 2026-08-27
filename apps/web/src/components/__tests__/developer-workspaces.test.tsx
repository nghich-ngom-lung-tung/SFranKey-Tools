import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@sfrankey/i18n";
import { processJson } from "@sfrankey/tool-core/json";
import { JwtDecoderWorkspace } from "@/components/developer/jwt-decoder-workspace";
import { JsonFormatterWorkspace } from "@/components/developer/json-formatter-workspace";
import { UuidGeneratorWorkspace } from "@/components/developer/uuid-generator-workspace";

const encodePart = (value: unknown) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const token = `${encodePart({ alg: "none", typ: "JWT" })}.${encodePart({ sub: "local" })}.`;

class TestWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  postMessage(message: { type: string; jobId: string; input?: string; options?: Parameters<typeof processJson>[1] }) {
    if (message.type === "cancel") return;
    queueMicrotask(() => {
      if (this.terminated) return;
      this.onmessage?.({ data: { type: "working", jobId: message.jobId } } as MessageEvent);
      try {
        const result = processJson(message.input ?? "", message.options ?? { operation: "format", indent: { kind: "spaces", size: 2 }, sortKeys: false });
        this.onmessage?.({ data: { type: "result", jobId: message.jobId, result } } as MessageEvent);
      } catch (error) {
        this.onmessage?.({ data: { type: "error", jobId: message.jobId, code: error instanceof Error && "code" in error ? (error as { code: string }).code : "PROCESSING_FAILED" } } as MessageEvent);
      }
    });
  }
  terminate() { this.terminated = true; }
}

describe("developer workspaces", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("decodes and resets a JWT without a submit-side request", async () => {
    const user = userEvent.setup();
    render(<JwtDecoderWorkspace locale="en" />);
    await user.type(screen.getByLabelText("JWT token"), token);
    await user.click(screen.getByRole("button", { name: "Decode token" }));
    expect(screen.getByText("Header", { selector: "p" })).toBeTruthy();
    expect(screen.getByText(/local/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("local")).toBeNull();
  });

  it("runs JSON actions through the worker and exposes diagnostics", async () => {
    vi.stubGlobal("Worker", TestWorker);
    const user = userEvent.setup();
    render(<JsonFormatterWorkspace locale="en" />);
    const input = screen.getByLabelText("JSON input");
    fireEvent.change(input, { target: { value: '{"b":1,"a":2}' } });
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(await screen.findByText(/"b": 1/)).toBeTruthy();
    fireEvent.change(input, { target: { value: '{"a":1,"a":2}' } });
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(await screen.findByText("Duplicate object keys are not allowed.")).toBeTruthy();
  });

  it("generates the default UUID batch only after the explicit action", async () => {
    const user = userEvent.setup();
    render(<UuidGeneratorWorkspace locale="en" />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Generate UUIDs" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("keeps both locale dictionaries complete for the developer suite", () => {
    for (const locale of ["vi", "en"] as const) {
      const suite = getDictionary(locale).developerSuite;
      expect(suite.jwt.title).toBeTruthy();
      expect(suite.json.errors.INVALID_JSON).toBeTruthy();
      expect(suite.uuid.errors.COUNT_OUT_OF_RANGE).toBeTruthy();
      expect(suite.timestamp.errors.INVALID_TIME_ZONE).toBeTruthy();
    }
  });
});
