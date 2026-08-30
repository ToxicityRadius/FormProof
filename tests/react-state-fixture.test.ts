import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/react-error-state");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("React dynamic-state and error fixture", () => {
  it("has a dedicated Vite command", async () => {
    const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      "fixture:react-state":
        "npm --prefix fixtures/react-error-state run dev -- --host 127.0.0.1 --port 4184 --strictPort"
    });
  });

  it("renders an invalid email state and preserves correction behavior", async () => {
    const app = await fixtureFile("src/App.tsx");

    expect(app).toContain('aria-invalid={invalid ? "true" : undefined}');
    expect(app).toContain('aria-errormessage="email-error"');
    expect(app).toContain('id="email-error"');
    expect(app).not.toContain('role="alert"');
    expect(app).toContain("input.validity.valid");
    expect(app).toContain("setInvalid(false)");
    expect(app).toContain("Subscription saved for");
  });

  it("checks error exposure, state clearing, success, and browser errors", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('getAttribute("aria-errormessage")');
    expect(regression).not.toContain('getAttribute("role")');
    expect(regression).toContain('fill("ada@example.com")');
    expect(regression).toContain('getAttribute("aria-invalid")');
    expect(regression).toContain("Subscription saved for ada@example.com.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
