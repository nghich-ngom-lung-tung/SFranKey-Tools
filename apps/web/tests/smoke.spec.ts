import { expect, test } from "@playwright/test";
test("tool page uses the shared workspace shell", async ({ page }) => {
  await page.goto("/en/tools/json-formatter", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.locator('[data-workspace-shell="json-formatter"]'),
  ).toBeVisible();
});
test("home and tool page render", async ({ page }) => {
  await page.goto("/vi", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Công cụ hữu ích/i }),
  ).toBeVisible();
  await page.goto("/vi/tools/json-formatter", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "JSON Formatter" }),
  ).toBeVisible();
  await expect(
    page.getByText("Xử lý trên thiết bị này", { exact: true }).first(),
  ).toBeVisible();
});

test("about page explains the manifesto in both locales", async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("sfrankey-ui-splash-v1", "seen"),
  );
  await page.goto("/vi/about", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: "Công cụ hữu ích. Dữ liệu thuộc về bạn.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Những công cụ nhỏ không nên đòi hỏi sự đánh đổi lớn.",
    }),
  ).toBeVisible();
  await expect(
    page.locator("[aria-label*='Sơ đồ cho thấy']").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Một hệ công cụ nhỏ cho công việc hằng ngày.",
    }),
  ).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await page.getByRole("link", { name: /Khám phá công cụ/ }).first().click();
  await expect(page).toHaveURL(/\/vi\/tools$/);

  await page.goto("/en/about", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Useful tools. Your data stays yours." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Small utilities should not require big privacy tradeoffs.",
    }),
  ).toBeVisible();
});

test("splash shows once per tab session and can be skipped", async ({
  page,
}) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const splash = page.getByRole("dialog", { name: "SFranKey" });
  await expect(splash).toBeVisible();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash).toHaveCount(0);
  await page.goto("/en/tools", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "SFranKey" })).toHaveCount(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "SFranKey" })).toHaveCount(0);
});

test("mobile drawer and keyboard search remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/vi", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Bỏ qua giới thiệu" }).click();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Tất cả công cụ" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Control+KeyK");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByPlaceholder("Tìm theo công cụ, danh mục hoặc từ khóa")
    .fill("mật khẩu");
  await expect(
    page.getByRole("button", { name: /Tạo mật khẩu/ }),
  ).toBeVisible();
});

test("header category menu exposes registry categories", async ({ page }) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const splash = page.getByRole("dialog", { name: "SFranKey" });
  if (await splash.count())
    await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Categories" }).click();
  await expect(page.getByRole("menuitem", { name: /2FA & OTP/ })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Developer/ })).toBeVisible();
});

test("tool catalog searches, filters and keeps favorites local", async ({
  page,
}) => {
  await page.goto("/en/tools", { waitUntil: "domcontentloaded" });
  const splash = page.getByRole("dialog", { name: "SFranKey" });
  if (await splash.count())
    await page.getByRole("button", { name: "Skip intro" }).click();

  await expect(page.locator('[data-tool-catalog-ready="true"]')).toBeVisible();
  const search = page.getByRole("textbox", { name: "Search all tools" });
  const results = page.getByTestId("tool-catalog-results");
  await search.fill("json");
  await expect(
    results.getByRole("heading", { name: "JSON Formatter" }),
  ).toBeVisible();
  await expect(
    results.getByRole("heading", { name: "TOTP Generator" }),
  ).toHaveCount(0);

  await search.fill("");
  await page
    .getByRole("combobox", { name: "Filter category" })
    .selectOption("developer");
  await expect(
    results.getByRole("heading", { name: "JSON Formatter" }),
  ).toBeVisible();
  await expect(
    results.getByRole("heading", { name: "TOTP Generator" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Add to favorites" }).first().click();
  await expect(
    page.getByRole("button", { name: "Remove from favorites" }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => localStorage.getItem("sfrankey-preferences") ?? "",
    ),
  ).toContain("json-formatter");
});

test("reduced motion skips the splash animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "SFranKey" })).toHaveCount(0);
});

test("TOTP secret stays local and generates without submit", async ({
  page,
}) => {
  const secret = "JBSWY3DPEHPK3PXP";
  const observedRequests: string[] = [];
  page.on("request", (request) =>
    observedRequests.push(`${request.url()} ${request.postData() ?? ""}`),
  );
  await page.goto("/vi/tools/totp-generator");
  await expect(page.getByRole("tab", { name: "Nhập secret" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByLabel("Secret 2FA (Base32)").fill(secret);
  await expect(page.getByText(/^\d{6}$/).last()).toBeVisible();
  const storedPreferences = await page.evaluate(
    () => localStorage.getItem("sfrankey-preferences") ?? "",
  );
  expect(storedPreferences).not.toContain(secret);
  expect(observedRequests.join("\n")).not.toContain(secret);
});

test("URI tab resolves metadata and QR route opens the scan tab", async ({
  page,
}) => {
  await page.goto("/en/tools/totp-generator");
  await expect(page.locator("[data-two-factor-ready='true']")).toBeVisible();
  await page.getByRole("tab", { name: "Paste setup URI" }).click();
  await page
    .getByLabel("otpauth:// setup URI")
    .fill(
      "otpauth://totp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&issuer=SFranKey&algorithm=SHA256&digits=8&period=60",
    );
  await expect(page.getByText("SHA-256").last()).toBeVisible();
  await expect(page.getByText("60 seconds").last()).toBeVisible();
  await expect(page.getByText(/^\d{8}$/).last()).toBeVisible();
  await page.goto("/en/tools/qr-2fa-scanner");
  await expect(page.getByRole("tab", { name: "Scan QR" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("password generator creates a local batch and passphrase", async ({
  page,
}) => {
  const secret = "correct-horse-battery-staple";
  const observedRequests: string[] = [];
  page.on("request", (request) =>
    observedRequests.push(`${request.url()} ${request.postData() ?? ""}`),
  );
  await page.goto("/en/tools/password-generator");
  await expect(
    page.getByRole("tab", { name: "Random password" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-password-result]")).toHaveCount(1);
  await page.getByLabel("Number of results").fill("3");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator("[data-password-result]")).toHaveCount(3);
  await page.getByRole("tab", { name: "Passphrase" }).click();
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  const masked = await page
    .locator("[data-password-result]")
    .first()
    .textContent();
  expect(masked).toMatch(/^•+$/);
  await page.getByRole("button", { name: "Show results" }).click();
  await expect(page.locator("[data-password-result]").first()).toHaveAttribute(
    "data-password-result",
    "visible",
  );
  const value = await page
    .locator("[data-password-result]")
    .first()
    .textContent();
  expect(value?.length).toBeGreaterThan(20);
  expect(observedRequests.join("\n")).not.toMatch(/zxcvbn/i);
  expect(observedRequests.join("\n")).not.toContain(secret);
  expect(
    await page.evaluate(
      () => localStorage.getItem("sfrankey-preferences") ?? "",
    ),
  ).not.toContain(secret);
});

test("password checker loads locally and clears its state", async ({
  page,
}) => {
  const secret = "Correct Horse Battery Staple 71";
  const observedRequests: string[] = [];
  page.on("request", (request) =>
    observedRequests.push(`${request.url()} ${request.postData() ?? ""}`),
  );
  await page.goto("/vi/tools/password-strength-checker");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(secret);
  await expect(
    page.getByRole("progressbar", { name: "Độ mạnh" }),
  ).toBeVisible();
  await expect(page.getByText(/Số lần đoán ước tính/)).toBeVisible();
  expect(observedRequests.join("\n")).not.toMatch(/eff-large-wordlist/i);
  expect(observedRequests.join("\n")).not.toContain(secret);
  await page.getByRole("button", { name: "Xóa mật khẩu" }).click();
  await expect(
    page.getByText("Nhập mật khẩu để xem đánh giá cục bộ."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => localStorage.getItem("sfrankey-preferences") ?? "",
    ),
  ).not.toContain(secret);
});
