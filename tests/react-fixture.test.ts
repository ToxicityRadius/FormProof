import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/react-label");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("React label fixture", () => {
  it("defines a runnable Vite project and repeatable regression command", async () => {
    const packageJson = JSON.parse(await fixtureFile("package.json")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      dev: "vite",
      build: "vite build",
      regression: "node regression.mjs"
    });
    expect(packageJson.dependencies).toHaveProperty("react");
    expect(packageJson.dependencies).toHaveProperty("react-dom");
    expect(packageJson.devDependencies).toHaveProperty("vite");
  });

  it("mounts a controlled form with user-visible submission behavior", async () => {
    const [html, main, app] = await Promise.all([
      fixtureFile("index.html"),
      fixtureFile("src/main.tsx"),
      fixtureFile("src/App.tsx")
    ]);

    expect(html).toContain('<div id="root"></div>');
    expect(main).toContain("createRoot");
    expect(app).toContain("<form onSubmit={handleSubmit}>");
    expect(app).toContain('name="displayName"');
    expect(app).toContain('<button type="submit">Save</button>');
    expect(app).toContain('role="status"');
  });

  it("keeps the browser regression focused on the form behavior", async () => {
    const regression = await fixtureFile("regression.mjs");

    expect(regression).toContain('getByRole("button", { name: "Save" })');
    expect(regression).toContain('getByRole("status")');
    expect(regression).toContain("Profile saved for Ada");
    expect(regression).toContain('page.on("pageerror"');
    expect(regression).toContain('message.type() === "error"');
  });
});
