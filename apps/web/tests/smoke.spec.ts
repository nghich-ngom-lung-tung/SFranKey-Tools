import { expect, test } from "@playwright/test";
test("home and tool page render", async ({ page }) => { await page.goto("/vi"); await expect(page.getByRole("heading", { name: /Công cụ hữu ích/i })).toBeVisible(); await page.goto("/vi/tools/json-formatter"); await expect(page.getByRole("heading", { name: "JSON Formatter" })).toBeVisible(); await expect(page.getByText(/Xử lý trên thiết bị/i)).toBeVisible(); });

test("TOTP secret stays local and generates without submit", async ({ page }) => {
  const secret = "JBSWY3DPEHPK3PXP";
  const observedRequests: string[] = [];
  page.on("request", (request) => observedRequests.push(`${request.url()} ${request.postData() ?? ""}`));
  await page.goto("/vi/tools/totp-generator");
  await expect(page.getByRole("tab", { name: "Nhập secret" })).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Secret 2FA (Base32)").fill(secret);
  await expect(page.getByText(/^\d{6}$/).last()).toBeVisible();
  const storedPreferences = await page.evaluate(() => localStorage.getItem("sfrankey-preferences") ?? "");
  expect(storedPreferences).not.toContain(secret);
  expect(observedRequests.join("\n")).not.toContain(secret);
});

test("URI tab resolves metadata and QR route opens the scan tab", async ({ page }) => {
  await page.goto("/en/tools/totp-generator");
  await page.getByRole("tab", { name: "Paste setup URI" }).click();
  await page.getByLabel("otpauth:// setup URI").fill("otpauth://totp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&issuer=SFranKey&algorithm=SHA256&digits=8&period=60");
  await expect(page.getByText("SHA-256").last()).toBeVisible();
  await expect(page.getByText("60 seconds").last()).toBeVisible();
  await expect(page.getByText(/^\d{8}$/).last()).toBeVisible();
  await page.goto("/en/tools/qr-2fa-scanner");
  await expect(page.getByRole("tab", { name: "Scan QR" })).toHaveAttribute("aria-selected", "true");
});
