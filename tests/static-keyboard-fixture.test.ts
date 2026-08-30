import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/static-hidden-focus");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Static keyboard and focus fixture", () => {
  it("is exposed through a dedicated local fixture command", async () => {
    const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      "fixture:static-keyboard": "node scripts/serve-fixture.mjs fixtures/static-hidden-focus 4178"
    });
  });

  it("keeps the hidden legacy action and visible save behavior", async () => {
    const html = await fixtureFile("index.html");

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('id="legacy-export"');
    expect(html).toContain('<button id="legacy-export" type="button">');
    expect(html).not.toContain('<button id="legacy-export" type="button" disabled>');
    expect(html).toContain('id="save-changes"');
    expect(html.indexOf('id="legacy-export"')).toBeLessThan(html.indexOf('id="save-changes"'));
    expect(html).toContain('role="status"');
    expect(html).toContain('addEventListener("click"');
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
