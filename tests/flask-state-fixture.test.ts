import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/flask-error-state");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Flask dynamic-state and error fixture", () => {
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
      "fixture:flask-state": "fixtures\\flask-error-state\\.venv\\Scripts\\python.exe -m flask --app fixtures/flask-error-state/app.py run --host 127.0.0.1 --port 4186"
    });
  });

  it("renders an invalid email state and preserves correction behavior", async () => {
    const [app, template] = await Promise.all([
      fixtureFile("app.py"),
      fixtureFile("templates/index.html")
    ]);

    expect(app).toContain('methods=["GET", "POST"]');
    expect(app).toContain('app.config["TEMPLATES_AUTO_RELOAD"] = True');
    expect(app).toContain("invalid = True");
    expect(app).toContain("invalid = not email");
    expect(app).toContain("Subscription saved for");
    expect(template).toContain('aria-invalid="{{ \'true\' if invalid else \'false\' }}"');
    expect(template).toContain('aria-errormessage="email-error"');
    expect(template).toContain('id="email-error"');
  });

  it("checks integration, error exposure, correction, and browser errors", async () => {
    const [integration, regression] = await Promise.all([
      fixtureFile("test_app.py"),
      fixtureFile("regression.mjs")
    ]);

    expect(integration).toContain("app.test_client()");
    expect(integration).toContain("ada@example.com");
    expect(regression).toContain("python -m unittest");
    expect(regression).toContain('getAttribute("aria-errormessage")');
    expect(regression).toContain('getAttribute("aria-describedby")');
    expect(regression).toContain('getAttribute("aria-live")');
    expect(regression).toContain('getAttribute("role")');
    expect(regression).toContain('fill("ada@example.com")');
    expect(regression).toContain("Subscription saved for ada@example.com.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
