import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/angular-label");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Angular label fixture", () => {
  it("pins a runnable Angular CLI project", async () => {
    const packageJson = JSON.parse(await fixtureFile("package.json")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      dev: "ng serve",
      build: "ng build",
      regression: "node regression.mjs"
    });
    expect(packageJson.dependencies).toMatchObject({
      "@angular/core": "21.2.22",
      "@angular/forms": "21.2.22",
      "@angular/platform-browser": "21.2.22",
      rxjs: "7.8.2",
      "zone.js": "0.16.2"
    });
    expect(packageJson.devDependencies).toMatchObject({
      "@angular/build": "21.2.22",
      "@angular/cli": "21.2.22",
      "@angular/compiler-cli": "21.2.22",
      typescript: "5.9.3"
    });
  });

  it("defines a standalone Angular form with visible submission behavior", async () => {
    const [workspace, main, component, template] = await Promise.all([
      fixtureFile("angular.json"),
      fixtureFile("src/main.ts"),
      fixtureFile("src/app/app.ts"),
      fixtureFile("src/app/app.html")
    ]);

    expect(workspace).toContain('"builder": "@angular/build:application"');
    expect(workspace).toContain('"builder": "@angular/build:dev-server"');
    expect(main).toContain("bootstrapApplication(App)");
    expect(component).toContain("imports: [FormsModule]");
    expect(component).toContain('templateUrl: "./app.html"');
    expect(template).toContain('[(ngModel)]="displayName"');
    expect(template).toContain('(ngSubmit)="handleSubmit()"');
    expect(template).toContain('<button type="submit">Save</button>');
    expect(template).toContain('role="status"');
  });

  it("keeps the browser regression focused on behavior and browser errors", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('getByRole("button", { name: "Save" })');
    expect(regression).toContain('getByRole("status")');
    expect(regression).toContain("Profile saved for Ada.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
