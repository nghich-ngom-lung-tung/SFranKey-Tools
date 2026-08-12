import { describe, expect, it } from "vitest";
import { getTool, toolDefinitions } from "./index";
describe("tool registry", () => { it("contains unique slugs", () => { const slugs = toolDefinitions.map((tool) => tool.slug); expect(new Set(slugs).size).toBe(slugs.length); }); it("finds a local-first tool", () => { expect(getTool("totp-generator")?.privacyMode).toBe("on-device"); }); });
