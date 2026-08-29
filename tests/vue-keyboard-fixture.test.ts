import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/vue-hidden-focus");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Vue keyboard and focus fixture", () => {
  it("pins the validated Vue/Vite toolchain and exposes a dedicated command", async () => {
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
      dev: "vite",
      build: "vite build",
      regression: "node regression.mjs"
    });
    expect(fixture.dependencies).toMatchObject({ vue: "3.5.42" });
    expect(fixture.devDependencies).toMatchObject({
      "@vitejs/plugin-vue": "6.0.8",
      vite: "8.2.2"
    });
    expect(root.scripts).toMatchObject({
      "fixture:vue-keyboard": "npm --prefix fixtures/vue-hidden-focus run dev -- --host 127.0.0.1 --port 4180 --strictPort"
    });
  });

  it("keeps the hidden legacy action and stateful Vue save behavior", async () => {
    const app = await fixtureFile("src/App.vue");

    expect(app).toContain('<script setup>');
    expect(app).toContain('aria-hidden="true"');
    expect(app).toContain('id="legacy-export"');
    expect(app).toContain('id="save-changes"');
    expect(app).toContain('@click="status = \'Changes saved.\'"');
    expect(app).toContain('role="status"');
  });

  it("checks hidden-focus exclusion, keyboard save, and browser errors in Playwright", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('page.keyboard.press("Tab")');
    expect(regression).toContain('focusedId !== "save-changes"');
    expect(regression).toContain('locator("#legacy-export")');
    expect(regression).toContain('page.keyboard.press("Enter")');
    expect(regression).toContain("Changes saved.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
