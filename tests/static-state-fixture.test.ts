import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/static-error-state");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Static dynamic-state and error fixture", () => {
  it("is exposed through the existing static fixture server", async () => {
    const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      "fixture:static-state": "node scripts/serve-fixture.mjs fixtures/static-error-state 4183"
    });
  });

  it("renders an invalid email state and preserves correction behavior", async () => {
    const html = await fixtureFile("index.html");

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-errormessage="email-error"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('addEventListener("submit"');
    expect(html).toContain('email.removeAttribute("aria-invalid")');
    expect(html).toContain('error.hidden = true');
    expect(html).toContain("Subscription saved for");
  });

  it("checks error exposure, state clearing, success, and browser errors", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('getAttribute("aria-errormessage")');
    expect(regression).toContain('getAttribute("aria-describedby")');
    expect(regression).toContain('getAttribute("aria-live")');
    expect(regression).toContain('getAttribute("role")');
    expect(regression).toContain('fill("ada@example.com")');
    expect(regression).toContain('getAttribute("aria-invalid")');
    expect(regression).toContain("Subscription saved for ada@example.com.");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
