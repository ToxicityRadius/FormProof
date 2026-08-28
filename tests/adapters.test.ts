import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectAdapter, getAdapter, mapNodeToSources } from "../src/adapters/index.js";

const temporaryDirectories: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "formproof-adapter-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("detectAdapter", () => {
  it("detects a static HTML project", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "index.html"), "<!doctype html><title>Example</title>");

    await expect(detectAdapter(root)).resolves.toMatchObject({ id: "static" });
  });

  it("detects React before treating JSX-adjacent HTML as static", async () => {
    const root = await temporaryProject();
    await mkdir(join(root, "src"));
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { react: "latest" } }));
    await writeFile(join(root, "src", "App.tsx"), "export function App() { return <main />; }");
    await writeFile(join(root, "index.html"), "<div id=\"root\"></div>");

    await expect(detectAdapter(root)).resolves.toMatchObject({ id: "react" });
  });

  it("detects a Flask template project", async () => {
    const root = await temporaryProject();
    await mkdir(join(root, "templates"));
    await writeFile(join(root, "requirements.txt"), "Flask==3.1.0\n");
    await writeFile(join(root, "templates", "index.html"), "<main>{{ message }}</main>");

    await expect(detectAdapter(root)).resolves.toMatchObject({ id: "flask" });
  });

  it("returns unknown when no supported source evidence exists", async () => {
    const root = await temporaryProject();

    await expect(detectAdapter(root)).resolves.toMatchObject({ id: "unknown" });
  });

  it("falls back from malformed package metadata and ignores generated directories", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "package.json"), "{not-json");
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "node_modules", "ignored.html"), "<main>ignored</main>");

    await expect(detectAdapter(root)).resolves.toMatchObject({ id: "unknown" });
  });

  it("detects Next.js in devDependencies and Flask in pyproject metadata", async () => {
    const reactRoot = await temporaryProject();
    await writeFile(join(reactRoot, "package.json"), JSON.stringify({ devDependencies: { next: "latest" } }));
    await expect(detectAdapter(reactRoot)).resolves.toMatchObject({ id: "react" });

    const flaskRoot = await temporaryProject();
    await writeFile(join(flaskRoot, "pyproject.toml"), 'dependencies = ["Flask>=3"]');
    await expect(detectAdapter(flaskRoot)).resolves.toMatchObject({ id: "flask" });
  });

  it("maps id and name evidence to likely source files", async () => {
    const root = await temporaryProject();
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src", "Form.tsx"), '<input id="email" name="subscriber">');
    await writeFile(join(root, "src", "Other.tsx"), '<main id="other" />');

    const candidates = await mapNodeToSources(
      root,
      getAdapter("react"),
      ["#email"],
      '<input id="email" name="subscriber">'
    );

    expect(candidates).toContainEqual(expect.objectContaining({ path: "src/Form.tsx", confidence: "high" }));
    expect(getAdapter("static").displayName).toBe("Static HTML");
  });

  it("uses a low-confidence fallback only when one supported file exists", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "index.html"), "<main>No matching token</main>");

    await expect(mapNodeToSources(root, getAdapter("static"), [], "<main>none</main>"))
      .resolves.toEqual([{ path: "index.html", confidence: "low", reason: "only supported source file" }]);

    await writeFile(join(root, "second.html"), "<main>Still no match</main>");
    await expect(mapNodeToSources(root, getAdapter("static"), [], "<main>none</main>"))
      .resolves.toEqual([]);
  });
});
