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

const targetUrl = process.env.FORMPROOF_TARGET_URL ?? "http://127.0.0.1:4181";
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
    throw new Error("The dormant legacy action must remain in the Flask document.");
  }

  await page.locator("#save-changes").click();

  const status = page.getByRole("status");
  await status.waitFor({ state: "visible" });
  const message = (await status.textContent())?.trim();
  if (message !== "Changes saved.") {
    throw new Error(`Unexpected status message: ${message ?? "<missing>"}`);
  }
  if (browserErrors.length > 0) {
    throw new Error(`Flask keyboard fixture browser errors: ${browserErrors.join(" | ")}`);
  }

  console.log("Flask keyboard fixture regression: integration and save behavior preserved.");
} finally {
  await browser.close();
}
