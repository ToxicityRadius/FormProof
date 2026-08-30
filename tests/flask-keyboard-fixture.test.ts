import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/flask-hidden-focus");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Flask keyboard and focus fixture", () => {
  it("pins Flask and exposes a dedicated repeatable server command", async () => {
    const [requirements, packageJsonText] = await Promise.all([
      fixtureFile("requirements.txt"),
      readFile(resolve("package.json"), "utf8")
    ]);
    const packageJson = JSON.parse(packageJsonText) as {
      scripts?: Record<string, string>;
    };

    expect(requirements).toContain("Flask==3.1.3");
    expect(requirements).not.toMatch(/[~^><]=?/);
    expect(packageJson.scripts).toMatchObject({
      "fixture:flask-keyboard": "fixtures\\flask-hidden-focus\\.venv\\Scripts\\python.exe -m flask --app fixtures/flask-hidden-focus/app.py run --host 127.0.0.1 --port 4181"
    });
  });

  it("keeps the hidden legacy action and server-rendered save behavior", async () => {
    const [app, template] = await Promise.all([
      fixtureFile("app.py"),
      fixtureFile("templates/index.html")
    ]);

    expect(app).toContain('methods=["GET", "POST"]');
    expect(app).toContain('app.config["TEMPLATES_AUTO_RELOAD"] = True');
    expect(app).toContain('status = "Changes saved."');
    expect(template).toContain('aria-hidden="true"');
    expect(template).toContain('id="legacy-export"');
    expect(template).toContain('<button id="legacy-export" type="button">');
    expect(template).not.toContain('<button id="legacy-export" type="button" disabled>');
    expect(template).toContain('id="save-changes"');
    expect(template).toContain('role="status"');
  });

  it("checks Flask integration and save behavior without masking the focus defect", async () => {
    const [integration, regression] = await Promise.all([
      fixtureFile("test_app.py"),
      fixtureFile("regression.mjs")
    ]);

    expect(integration).toContain("app.test_client()");
    expect(integration).toContain("Changes saved.");
    expect(regression).toContain("python -m unittest");
    expect(regression).toContain("unitTests.error");
    expect(regression).toContain('locator("#legacy-export")');
    expect(regression).toContain('locator("#save-changes")');
    expect(regression).not.toContain('page.keyboard.press("Tab")');
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
