import { describe, expect, it } from "vitest";
import { getDictionary } from "./index";
import { toolDefinitions, categories } from "@sfrankey/shared";

function findMissingKeys(objA: any, objB: any, path = ""): string[] {
  const issues: string[] = [];
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  for (const key of keysA) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in objB)) {
      issues.push(`Missing in Target: ${currentPath}`);
      continue;
    }
    const valA = objA[key];
    const valB = objB[key];

    if (valA === "" || valA === null || valA === undefined) {
      issues.push(`Empty in Source: ${currentPath}`);
    }
    if (valB === "" || valB === null || valB === undefined) {
      issues.push(`Empty in Target: ${currentPath}`);
    }

    if (typeof valA === "object" && valA !== null && !Array.isArray(valA)) {
      if (typeof valB === "object" && valB !== null && !Array.isArray(valB)) {
        issues.push(...findMissingKeys(valA, valB, currentPath));
      } else {
        issues.push(`Type mismatch at: ${currentPath}`);
      }
    }
  }

  for (const key of keysB) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in objA)) {
      issues.push(`Missing in Source: ${currentPath}`);
    }
  }

  return issues;
}

describe("i18n Full Parity & Coverage Audit", () => {
  const vi = getDictionary("vi");
  const en = getDictionary("en");

  it("has 100% identical key structure between Vietnamese and English dictionaries", () => {
    const issues = findMissingKeys(vi, en);
    expect(issues).toEqual([]);
  });

  it("has all categories translated in both locales", () => {
    for (const cat of categories) {
      expect(vi.categories[cat]).toBeTruthy();
      expect(en.categories[cat]).toBeTruthy();
    }
  });

  it("has complete titles and descriptions in tool definitions for all 23 tools", () => {
    for (const tool of toolDefinitions) {
      expect(tool.title.vi).toBeTruthy();
      expect(tool.title.en).toBeTruthy();
      expect(tool.description.vi).toBeTruthy();
      expect(tool.description.en).toBeTruthy();
    }
  });

  it("has complete Guide, Privacy & FAQ for all tools in both locales", () => {
    for (const tool of toolDefinitions) {
      const viDetail = vi.toolDetails[tool.slug as keyof typeof vi.toolDetails];
      const enDetail = en.toolDetails[tool.slug as keyof typeof en.toolDetails];

      expect(viDetail, `VI details missing for ${tool.slug}`).toBeDefined();
      expect(enDetail, `EN details missing for ${tool.slug}`).toBeDefined();

      expect(viDetail.guide, `VI guide missing for ${tool.slug}`).toBeTruthy();
      expect(viDetail.privacy, `VI privacy missing for ${tool.slug}`).toBeTruthy();
      expect(viDetail.faq, `VI faq missing for ${tool.slug}`).toBeTruthy();

      expect(enDetail.guide, `EN guide missing for ${tool.slug}`).toBeTruthy();
      expect(enDetail.privacy, `EN privacy missing for ${tool.slug}`).toBeTruthy();
      expect(enDetail.faq, `EN faq missing for ${tool.slug}`).toBeTruthy();
    }
  });

  it("has all suite components fully translated", () => {
    for (const locale of ["vi", "en"] as const) {
      const dict = getDictionary(locale);
      expect(dict.qrSuite.generator.generate).toBeTruthy();
      expect(dict.qrSuite.reader.errors.noQr).toBeTruthy();
      expect(dict.encodingSuite.base64.invalidBase64).toBeTruthy();
      expect(dict.encodingSuite.hash.note).toBeTruthy();
      expect(dict.encodingSuite.checksum.workerError).toBeTruthy();
      expect(dict.developerSuite.json.format).toBeTruthy();
      expect(dict.developerSuite.jwt.header).toBeTruthy();
      expect(dict.networkSuite.disclosureTitle).toBeTruthy();
      expect(dict.networkSuite.disclosure).toBeTruthy();
    }
  });
});
