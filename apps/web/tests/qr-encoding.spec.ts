import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("sfrankey-ui-splash-v1", "seen"),
  );
});

test("QR generator keeps its local preview current as settings change", async ({
  page,
}) => {
  await page.goto("/en/tools/qr-generator", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "QR Code Generator" }),
  ).toBeVisible();
  const preview = page.locator('img[alt="QR preview"]');
  await expect(preview).toBeVisible();
  await expect(page.getByText(/bytes$/).last()).toBeVisible();
  const initialSource = await preview.getAttribute("src");

  await page.locator("#qr-url-input").fill("https://example.com/updated");
  await expect(preview).not.toHaveAttribute("src", initialSource!);
  const generatedSource = await preview.getAttribute("src");

  await page.locator("#qr-url-input").fill("ftp://example.com");
  await expect(
    page.getByText("Enter a valid HTTP or HTTPS URL."),
  ).toBeVisible();
  await expect(preview).toHaveAttribute("src", generatedSource!);
});

test("QR reader decodes an exported image without opening it", async ({
  page,
}) => {
  await page.goto("/en/tools/qr-generator", { waitUntil: "domcontentloaded" });
  await page.locator("#qr-url-input").fill("https://sfrankey.bond/private");
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
  const decodedPayload = page.locator("textarea[readonly]");
  await expect(decodedPayload).toHaveValue("https://sfrankey.bond/private", {
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Open link" })).toBeVisible();

  await page
    .locator("#qr-scanner-file-replace")
    .setInputFiles({
      name: "mismatch.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("this is not a QR image"),
    });
  await expect(page.getByText("Could not read this QR image.")).toBeVisible();
  await expect(decodedPayload).toHaveValue("https://sfrankey.bond/private");
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
  await page.getByRole("button", { name: "Encode", exact: true }).last().click();
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
