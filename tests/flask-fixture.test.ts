import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/flask-label");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Flask label fixture", () => {
  it("pins the Flask runtime and defines a repeatable server command", async () => {
    const [requirements, packageJsonText] = await Promise.all([
      fixtureFile("requirements.txt"),
      readFile(resolve("package.json"), "utf8")
    ]);
    const packageJson = JSON.parse(packageJsonText) as {
      scripts?: Record<string, string>;
    };

    expect(requirements).toContain("Flask==3.1.3");
    expect(requirements).not.toMatch(/[~^><]=?/);
    expect(packageJson.scripts).toHaveProperty("fixture:flask");
  });

  it("handles a submitted display name and renders a status message", async () => {
    const [app, template] = await Promise.all([
      fixtureFile("app.py"),
      fixtureFile("templates/index.html")
    ]);

    expect(app).toContain('methods=["GET", "POST"]');
    expect(app).toContain('app.config["TEMPLATES_AUTO_RELOAD"] = True');
    expect(app).toContain("request.form");
    expect(app).toContain("status=status");
    expect(template).toContain('<form method="post">');
    expect(template).toContain('name="display_name"');
    expect(template).not.toContain('<label for="display-name">');
    expect(template).toContain('<button type="submit">Save</button>');
    expect(template).toContain('role="status"');
  });

  it("covers both Flask integration behavior and the browser regression", async () => {
    const [integration, regression] = await Promise.all([
      fixtureFile("test_app.py"),
      fixtureFile("regression.mjs")
    ]);

    expect(integration).toContain("app.test_client()");
    expect(integration).toContain("Profile saved for Ada.");
    expect(regression).toContain('getByRole("button", { name: "Save" })');
    expect(regression).toContain('getByRole("status")');
    expect(regression).toContain("python -m unittest");
    expect(regression).toContain("unitTests.error");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
