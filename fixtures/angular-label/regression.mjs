import { chromium } from "playwright";

const targetUrl = process.env.FORMPROOF_TARGET_URL ?? "http://127.0.0.1:4177";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox").fill("Ada");
  await page.getByRole("button", { name: "Save" }).click();

  const status = page.getByRole("status");
  await status.waitFor({ state: "visible" });
  const message = (await status.textContent())?.trim();
  if (message !== "Profile saved for Ada.") {
    throw new Error(`Unexpected status message: ${message ?? "<missing>"}`);
  }
  if (browserErrors.length > 0) {
    throw new Error(`Angular fixture browser errors: ${browserErrors.join(" | ")}`);
  }

  console.log("Angular fixture regression: form submission behavior preserved.");
} finally {
  await browser.close();
}
