import { expect, test } from "@playwright/test";

const networkSlugs = [
  "check-my-ip",
  "ip-lookup",
  "vpn-proxy-checker",
  "ip-leak-test",
  "dns-leak-test",
  "webrtc-leak-test",
  "dns-lookup",
  "ssl-checker",
  "redirect-checker",
  "http-header-checker",
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("sfrankey-ui-splash-v1", "seen"),
  );
});

test("all Network Suite routes render in both locales without a request on mount", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/v1/network/")) requests.push(request.url());
  });

  for (const locale of ["en", "vi"] as const) {
    for (const slug of networkSlugs) {
      await page.goto(`/${locale}/tools/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("[data-workspace-shell]")).toBeVisible();
      await expect(
        page.getByText(locale === "en" ? "No request has been sent yet." : "Chưa có request nào được gửi.").first(),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
  }

  expect(requests).toEqual([]);
});

test("IP lookup sends a request only after an explicit action and keeps the target out of storage and URL", async ({
  page,
}) => {
  const target = "1.1.1.1";
  let postedBody = "";
  const networkRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/v1/network/")) networkRequests.push(request.url());
  });
  await page.route(/\/v1\/network\/ip-lookup$/, async (route) => {
    postedBody = route.request().postData() ?? "";
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        requestId: "network-e2e",
        data: {
          ip: target,
          version: 4,
          scope: "public",
          countryName: "Australia",
          approximate: true,
          capabilities: {},
        },
      }),
    });
  });

  await page.goto("/en/tools/ip-lookup", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("textbox", { name: "IP, hostname or URL" });
  await input.fill(target);
  expect(postedBody).toBe("");
  await page.getByRole("button", { name: "Run check" }).click();
  await expect.poll(() => networkRequests.length).toBe(1);
  expect(postedBody).toContain(`\"ip\":\"${target}\"`);
  await expect(page.getByText("Australia")).toBeVisible();
  expect(page.url()).not.toContain(target);
  expect(
    await page.evaluate(
      () => `${localStorage.getItem("sfrankey-preferences") ?? ""}\n${sessionStorage.getItem("sfrankey-preferences") ?? ""}`,
    ),
  ).not.toContain(target);
});
