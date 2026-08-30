import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/static-label");

describe("Static label fixture", () => {
  it("keeps the intended missing-label baseline and form behavior", async () => {
    const [html, regression] = await Promise.all([
      readFile(resolve(fixtureRoot, "index.html"), "utf8"),
      readFile(resolve(fixtureRoot, "regression.mjs"), "utf8")
    ]);

    expect(html).toContain('id="email"');
    expect(html).not.toContain('<label for="email">');
    expect(regression).toContain('name="email"');
    expect(regression).toContain('<button type="submit">Subscribe</button>');
  });
});
