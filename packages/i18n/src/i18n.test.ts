import { describe, expect, it } from "vitest";
import { getDictionary } from "./index";
describe("dictionaries", () => { it("has the main navigation in both locales", () => { expect(getDictionary("vi").nav.tools).toBeTruthy(); expect(getDictionary("en").nav.tools).toBeTruthy(); }); });
