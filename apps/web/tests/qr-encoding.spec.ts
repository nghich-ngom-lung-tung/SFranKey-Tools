import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("sfrankey-ui-splash-v1", "seen"),
  );
});

test("QR generator builds a local preview and keeps it stable until generate", async ({
  page,
}) => {
  await page.goto("/en/tools/qr-generator", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "QR Code Generator" }),
  ).toBeVisible();
  await page.locator("#qr-text").fill("SFranKey local QR");
  await page.getByRole("button", { name: "Generate QR" }).click();
  const preview = page.locator('img[alt="QR preview"]');
  await expect(preview).toBeVisible();
  await expect(page.getByText(/bytes$/).last()).toBeVisible();
  const generatedSource = await preview.getAttribute("src");

  await page.locator("#qr-kind").selectOption("url");
  await expect(
    page.getByText("Settings changed. Generate again to update the preview."),
  ).toBeVisible();
  await expect(preview).toHaveAttribute("src", generatedSource!);

  await page.locator("#qr-url").fill("ftp://example.com");
  await page.getByRole("button", { name: "Generate QR" }).click();
  await expect(
    page.getByText("Enter a valid HTTP or HTTPS URL."),
  ).toBeVisible();
  await expect(preview).toHaveAttribute("src", generatedSource!);
});

test("QR reader decodes an exported image without opening it", async ({
  page,
}) => {
  await page.goto("/en/tools/qr-generator", { waitUntil: "domcontentloaded" });
  await page.locator("#qr-text").fill("https://sfrankey.bond/private");
  await page.getByRole("button", { name: "Generate QR" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  await page.goto("/en/tools/qr-reader", { waitUntil: "domcontentloaded" });
  await page
    .locator("#qr-scanner-file")
    .setInputFiles({
      name: "sfrankey.png",
      mimeType: "image/png",
      buffer: png,
    });
  await expect(
    page.getByText("https://sfrankey.bond/private", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Open link" })).toBeVisible();

  await page
    .locator("#qr-scanner-file")
    .setInputFiles({
      name: "mismatch.jpg",
      mimeType: "image/jpeg",
      buffer: png,
    });
  await expect(page.getByText("Could not read this QR image.")).toBeVisible();
  await expect(
    page.getByText("https://sfrankey.bond/private", { exact: true }),
  ).toBeVisible();
});

test("Base64 text round trips Unicode locally", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) =>
    requests.push(`${request.url()} ${request.postData() ?? ""}`),
  );
  await page.goto("/en/tools/base64-encode-decode", {
    waitUntil: "domcontentloaded",
  });
  await page.getByLabel("Input").fill("Xin chào 🌿");
  await page.getByRole("button", { name: "Encode" }).click();
  await expect(
    page.getByText("WGluIGNow6BvIPCfjL8=", { exact: true }),
  ).toBeVisible();
  expect(requests.join("\n")).not.toContain("Xin chào");
});

test("Base64 file encode uses the local worker", async ({ page }) => {
  await page.goto("/en/tools/base64-encode-decode", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("tab", { name: "File" }).click();
  await page
    .locator("#base64-file")
    .setInputFiles({
      name: "sample.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.from([0, 255, 65]),
    });
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("AP9B", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
});

test("Hash generator matches a known SHA-256 digest", async ({ page }) => {
  await page.goto("/en/tools/hash-generator", {
    waitUntil: "domcontentloaded",
  });
  await page.getByLabel("Text to hash").fill("abc");
  await page.getByRole("button", { name: "Hash", exact: true }).click();
  await expect(
    page.getByText(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      { exact: true },
    ),
  ).toBeVisible();
});

test("File checksum accepts a small file and reports the digest", async ({
  page,
}) => {
  await page.goto("/en/tools/file-checksum", { waitUntil: "domcontentloaded" });
  await page
    .locator("#checksum-file")
    .setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("abc"),
    });
  await page.getByRole("button", { name: "Calculate checksum" }).click();
  await expect(
    page.getByText(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 30_000 });
});
