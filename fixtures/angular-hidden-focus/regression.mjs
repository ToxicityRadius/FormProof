import { chromium } from "playwright";

const targetUrl = process.env.FORMPROOF_TARGET_URL ?? "http://127.0.0.1:4182";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const legacyAction = page.locator("#legacy-export");
  if (await legacyAction.count() !== 1) {
    throw new Error("The dormant legacy action must remain in the Angular document.");
  }

  await page.keyboard.press("Tab");
  const focusedId = await page.evaluate(() => document.activeElement?.id ?? "");
  if (focusedId !== "save-changes") {
    throw new Error(`Expected hidden action to be skipped; focus reached ${focusedId || "<no id>"}.`);
  }
  await page.keyboard.press("Enter");

  const status = page.getByRole("status");
  await status.waitFor({ state: "visible" });
  const message = (await status.textContent())?.trim();
  if (message !== "Changes saved.") {
    throw new Error(`Unexpected status message: ${message ?? "<missing>"}`);
  }
  if (browserErrors.length > 0) {
    throw new Error(`Angular keyboard fixture browser errors: ${browserErrors.join(" | ")}`);
  }

  console.log("Angular keyboard fixture regression: hidden focus exclusion and save behavior preserved.");
} finally {
  await browser.close();
}
