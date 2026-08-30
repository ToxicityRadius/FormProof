import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/react-hidden-focus");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("React keyboard and focus fixture", () => {
  it("pins the validated React/Vite toolchain and exposes a dedicated command", async () => {
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
    expect(fixture.dependencies).toMatchObject({ react: "19.2.7", "react-dom": "19.2.7" });
    expect(fixture.devDependencies).toMatchObject({ vite: "8.2.2" });
    expect(root.scripts).toMatchObject({
      "fixture:react-keyboard": "npm --prefix fixtures/react-hidden-focus run dev -- --host 127.0.0.1 --port 4179 --strictPort"
    });
  });

  it("keeps the hidden legacy action and stateful React save behavior", async () => {
    const app = await fixtureFile("src/App.tsx");

    expect(app).toContain('aria-hidden="true"');
    expect(app).toContain('id="legacy-export"');
    expect(app).toContain('<button id="legacy-export" type="button">');
    expect(app).not.toContain('<button id="legacy-export" type="button" disabled>');
    expect(app).toContain('id="save-changes"');
    expect(app).toContain('onClick={() => setStatus("Changes saved.")}');
    expect(app).toContain('role="status"');
  });

  it("checks save behavior and browser errors without masking the focus defect", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('locator("#legacy-export")');
    expect(regression).toContain('locator("#save-changes")');
    expect(regression).not.toContain('page.keyboard.press("Tab")');
    expect(regression).toContain("Changes saved.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
