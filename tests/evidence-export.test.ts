import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("evidence exporter", () => {
  it("retains generic regression commands in representative trajectories", async () => {
    const exporter = await readFile(resolve("scripts/export-evidence.mjs"), "utf8");

    expect(exporter).toContain("/regression|unittest|git diff/i.test(command)");
    expect(exporter).toContain("await access(resolve(runDirectory, fileName))");
    expect(exporter).toContain("Use baseRepositoryCommit and before.json");
  });
});
