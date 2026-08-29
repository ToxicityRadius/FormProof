import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/angular-error-state");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Angular dynamic-state and error fixture", () => {
  it("pins the validated Angular toolchain and exposes a dedicated command", async () => {
    const [fixturePackage, rootPackage] = await Promise.all([
      fixtureFile("package.json"),
      readFile(resolve("package.json"), "utf8")
    ]);
    const fixture = JSON.parse(fixturePackage) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const root = JSON.parse(rootPackage) as { scripts?: Record<string, string> };

    expect(fixture.scripts).toMatchObject({
      dev: "ng serve",
      build: "ng build",
      regression: "node regression.mjs"
    });
    expect(fixture.dependencies).toMatchObject({
      "@angular/core": "21.2.22",
      "@angular/forms": "21.2.22",
      "@angular/platform-browser": "21.2.22"
    });
    expect(fixture.devDependencies).toMatchObject({
      "@angular/cli": "21.2.22",
      typescript: "5.9.3"
    });
    expect(root.scripts).toMatchObject({
      "fixture:angular-state": "npm --prefix fixtures/angular-error-state run dev -- --host 127.0.0.1 --port 4187"
    });
  });

  it("renders an invalid email state and preserves correction behavior", async () => {
    const [component, template] = await Promise.all([
      fixtureFile("src/app/app.ts"),
      fixtureFile("src/app/app.html")
    ]);

    expect(component).toContain("input.validity.valid");
    expect(component).toContain("this.showError = false");
    expect(component).toContain("Subscription saved for");
    expect(template).toContain("[attr.aria-invalid]=\"showError ? 'true' : null\"");
    expect(template).toContain('aria-errormessage="email-error"');
    expect(template).toContain('id="email-error"');
  });

  it("checks error exposure, correction, success, and browser errors", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('getAttribute("aria-errormessage")');
    expect(regression).toContain('getAttribute("aria-describedby")');
    expect(regression).toContain('getAttribute("aria-live")');
    expect(regression).toContain('getAttribute("role")');
    expect(regression).toContain('fill("ada@example.com")');
    expect(regression).toContain("waitForFunction");
    expect(regression).toContain("Subscription saved for ada@example.com.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
