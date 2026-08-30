import { chromium } from "playwright";

const targetUrl = process.env.FORMPROOF_TARGET_URL ?? "http://127.0.0.1:4184";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const email = page.locator("#email");
  const error = page.locator("#email-error");
  if (await email.getAttribute("aria-invalid") !== "true") {
    throw new Error("The fixture must begin in its invalid email state.");
  }
  const errorId = await email.getAttribute("aria-errormessage");
  if (errorId !== "email-error" || !(await error.isVisible())) {
    throw new Error("The visible validation error and aria-errormessage reference must remain intact.");
  }

  await email.fill("ada@example.com");
  await page.getByRole("button", { name: "Subscribe" }).click();
  if (await email.getAttribute("aria-invalid") === "true" || await error.isVisible()) {
    throw new Error("The corrected email must clear the invalid state and hide its error.");
  }

  const message = (await page.getByRole("status").textContent())?.trim();
  if (message !== "Subscription saved for ada@example.com.") {
    throw new Error(`Unexpected status message: ${message ?? "<missing>"}`);
  }
  if (browserErrors.length > 0) {
    throw new Error(`React error-state fixture browser errors: ${browserErrors.join(" | ")}`);
  }

  console.log("React error-state regression: validation and correction behavior preserved.");
} finally {
  await browser.close();
}
