import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/angular-hidden-focus");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Angular keyboard and focus fixture", () => {
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
      "@angular/platform-browser": "21.2.22",
      rxjs: "7.8.2",
      "zone.js": "0.16.2"
    });
    expect(fixture.devDependencies).toMatchObject({
      "@angular/build": "21.2.22",
      "@angular/cli": "21.2.22",
      "@angular/compiler-cli": "21.2.22",
      typescript: "5.9.3"
    });
    expect(root.scripts).toMatchObject({
      "fixture:angular-keyboard": "npm --prefix fixtures/angular-hidden-focus run dev -- --host 127.0.0.1 --port 4182"
    });
  });

  it("keeps the hidden legacy action and stateful Angular save behavior", async () => {
    const [component, template] = await Promise.all([
      fixtureFile("src/app/app.ts"),
      fixtureFile("src/app/app.html")
    ]);

    expect(component).toContain('templateUrl: "./app.html"');
    expect(component).toContain('this.status = "Changes saved."');
    expect(template).toContain('aria-hidden="true"');
    expect(template).toContain('id="legacy-export"');
    expect(template).toContain('id="save-changes"');
    expect(template).toContain('(click)="saveChanges()"');
    expect(template).toContain('role="status"');
  });

  it("checks hidden-focus exclusion, keyboard save, and browser errors", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('locator("#legacy-export")');
    expect(regression).toContain('page.keyboard.press("Tab")');
    expect(regression).toContain('focusedId !== "save-changes"');
    expect(regression).toContain('page.keyboard.press("Enter")');
    expect(regression).toContain("Changes saved.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
