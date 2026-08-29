import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const fixtureRoot = resolve(import.meta.dirname);
const windowsPython = resolve(fixtureRoot, ".venv", "Scripts", "python.exe");
const unixPython = resolve(fixtureRoot, ".venv", "bin", "python");
const python = existsSync(windowsPython) ? windowsPython : unixPython;
const unitTestCommand = "python -m unittest test_app.py";

const unitTests = spawnSync(python, ["-m", "unittest", "test_app.py"], {
  cwd: fixtureRoot,
  encoding: "utf8"
});
if (unitTests.error) {
  throw new Error(`${unitTestCommand} could not start: ${unitTests.error.message}`);
}
if (unitTests.status !== 0) {
  throw new Error(
    `${unitTestCommand} failed:\n${unitTests.stdout ?? ""}${unitTests.stderr ?? ""}`
  );
}

const targetUrl = process.env.FORMPROOF_TARGET_URL ?? "http://127.0.0.1:4186";
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

  const describedBy = (await email.getAttribute("aria-describedby"))?.split(/\s+/) ?? [];
  const live = await error.getAttribute("aria-live");
  const role = await error.getAttribute("role");
  if (!describedBy.includes(errorId) && live !== "polite" && live !== "assertive" && role !== "alert") {
    throw new Error("The validation error is not exposed as an accessible error message.");
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
    throw new Error(`Flask error-state fixture browser errors: ${browserErrors.join(" | ")}`);
  }

  console.log("Flask error-state regression: integration, accessible error exposure, and correction behavior preserved.");
} finally {
  await browser.close();
}
