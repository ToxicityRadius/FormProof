import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/vue-label");

async function fixtureFile(path: string): Promise<string> {
  return readFile(resolve(fixtureRoot, path), "utf8");
}

describe("Vue label fixture", () => {
  it("pins a runnable Vue and Vite project", async () => {
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
    expect(packageJson.dependencies).toMatchObject({ vue: "3.5.42" });
    expect(packageJson.devDependencies).toMatchObject({
      "@vitejs/plugin-vue": "6.0.8",
      vite: "8.2.2"
    });
  });

  it("mounts a controlled Vue form with user-visible submission behavior", async () => {
    const [html, main, app, config] = await Promise.all([
      fixtureFile("index.html"),
      fixtureFile("src/main.js"),
      fixtureFile("src/App.vue"),
      fixtureFile("vite.config.js")
    ]);

    expect(html).toContain('<div id="app"></div>');
    expect(main).toContain('createApp(App).mount("#app")');
    expect(config).toContain("plugins: [vue()]");
    expect(app).toContain('<script setup>');
    expect(app).toContain('v-model="displayName"');
    expect(app).toContain('@submit.prevent="handleSubmit"');
    expect(app).toContain('<button type="submit">Save</button>');
    expect(app).toContain('role="status"');
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
