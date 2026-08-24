import { describe, expect, it } from "vitest";
import { getTool, toolDefinitions, type ToolIconKey } from "./index";

const iconKeys: ToolIconKey[] = ["timer", "scan-line", "key-round", "shield-check", "qr-code", "scan-qr-code", "binary", "hash", "file-check", "braces", "code-xml", "fingerprint", "clock-3", "globe-2", "map-pin", "shield-question", "radar", "server-cog", "radio-tower", "network", "lock-keyhole", "route", "panel-top"];

describe("tool registry", () => {
  it("contains unique slugs", () => {
    const slugs = toolDefinitions.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("maps every tool to a registered brand icon", () => {
    expect(toolDefinitions).toHaveLength(23);
    expect(toolDefinitions.every((tool) => iconKeys.includes(tool.iconKey))).toBe(true);
    expect(new Set(toolDefinitions.map((tool) => tool.iconKey)).size).toBe(23);
  });
  it("finds a local-first tool", () => { expect(getTool("totp-generator")?.privacyMode).toBe("on-device"); });
  it("contains ten explicit network tools", () => { expect(toolDefinitions.filter((tool) => tool.privacyMode === "network-required")).toHaveLength(10); });
});
