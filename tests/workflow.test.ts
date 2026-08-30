import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectWorkflow, repairWorkflow, runRegressionCommand } from "../src/core/workflow.js";
import type { ScanEvidence } from "../src/contracts.js";

const temporaryDirectories: string[] = [];

async function temporaryRun(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "formproof-workflow-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

function evidence(root: string, ids: string[]): ScanEvidence {
  return {
    schemaVersion: "1.0",
    runId: "workflow-test",
    capturedAt: "2026-08-29T00:00:00.000Z",
    target: { url: "http://127.0.0.1:4173", sourceRoot: root, adapter: "static" },
    violations: ids.map((id) => ({
      id,
      impact: "serious",
      description: `${id} description`,
      help: `${id} help`,
      helpUrl: `https://example.test/${id}`,
      tags: ["wcag2a"],
      nodes: []
    })),
    totals: { violations: ids.length, nodes: ids.length }
  };
}

describe("FormProof workflows", () => {
  it("inspect freezes baseline evidence, a repair prompt, and an HTML report", async () => {
    const root = await temporaryRun();
    const outDir = join(root, "run");

    const result = await inspectWorkflow(
      { url: "http://127.0.0.1:4173", sourceRoot: root, outDir },
      { scan: vi.fn().mockResolvedValue(evidence(root, ["label"])) }
    );

    expect(result.decision.status).toBe("HUMAN_REVIEW_REQUIRED");
    await expect(readFile(join(outDir, "before.json"), "utf8")).resolves.toContain('"label"');
    await expect(readFile(join(outDir, "decision.json"), "utf8")).resolves.toContain("HUMAN_REVIEW_REQUIRED");
    await expect(readFile(join(outDir, "repair-prompt.md"), "utf8")).resolves.toContain("minimal source-level patch");
    await expect(readFile(join(outDir, "report.html"), "utf8")).resolves.toContain("FormProof Evidence Report");
  });

  it("repair refuses to call Codex without explicit approval", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, ["label"])));
    const runAgent = vi.fn();

    await expect(repairWorkflow(
      { beforePath, outDir: join(root, "repair"), approved: false, regressionCommand: "npm test" },
      { scan: vi.fn(), runAgent, runRegression: vi.fn() }
    )).rejects.toThrow("--approve");
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("repair accepts a patch only after rescan and regression gates pass", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, ["label"])));
    const outDir = join(root, "repair");

    const result = await repairWorkflow(
      { beforePath, outDir, approved: true, regressionCommand: "npm test" },
      {
        scan: vi.fn().mockResolvedValue(evidence(root, [])),
        runAgent: vi.fn().mockResolvedValue({ exitCode: 0, trajectoryPath: join(outDir, "trajectory.jsonl"), lastMessagePath: join(outDir, "agent-summary.txt"), stderr: "" }),
        runRegression: vi.fn().mockResolvedValue({ name: "npm test", passed: true, details: "exit code 0" })
      }
    );

    expect(result.decision.status).toBe("VERIFIED_FIXED");
    await expect(readFile(join(outDir, "after.json"), "utf8")).resolves.toContain('"violations": []');
    await expect(readFile(join(outDir, "decision.json"), "utf8")).resolves.toContain("VERIFIED_FIXED");
  });

  it("describes a clean automated baseline without treating it as conformance", async () => {
    const root = await temporaryRun();
    const result = await inspectWorkflow(
      { url: "http://127.0.0.1:4173", sourceRoot: root, outDir: join(root, "run") },
      { scan: vi.fn().mockResolvedValue(evidence(root, [])) }
    );

    expect(result.decision.status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.decision.summary).toContain("human review");
    expect(result.decision.unresolvedViolationIds).toEqual([]);
    await expect(readFile(join(root, "run", "decision.json"), "utf8")).resolves.toContain("No automated violations were detected");
  });

  it("rejects malformed baseline evidence before invoking an agent", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify({ schemaVersion: "0.1", violations: [] }));
    const runAgent = vi.fn();

    await expect(repairWorkflow(
      { beforePath, outDir: join(root, "repair"), approved: true, regressionCommand: "npm test" },
      { scan: vi.fn(), runAgent }
    )).rejects.toThrow("Invalid FormProof evidence");
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("requires human review when the agent process fails", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, ["label"])));
    const scan = vi.fn();

    const result = await repairWorkflow(
      { beforePath, outDir: join(root, "repair"), approved: true, targetViolationIds: ["label"], regressionCommand: "npm test", model: "gpt-test" },
      {
        scan,
        runAgent: vi.fn().mockResolvedValue({
          exitCode: 2,
          trajectoryPath: join(root, "repair", "trajectory.jsonl"),
          lastMessagePath: join(root, "repair", "agent-summary.txt"),
          stderr: "failed"
        })
      }
    );

    expect(result.decision.status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.decision.summary).toContain("code 2");
    expect(scan).not.toHaveBeenCalled();
    await expect(readFile(join(root, "repair", "decision.json"), "utf8")).resolves.toContain("HUMAN_REVIEW_REQUIRED");
  });

  it("refuses repair without a configured regression command", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, ["label"])));
    const runAgent = vi.fn();
    const runRegression = vi.fn();

    await expect(repairWorkflow(
      { beforePath, outDir: join(root, "repair"), approved: true, regressionCommand: "" },
      {
        scan: vi.fn().mockResolvedValue(evidence(root, [])),
        runAgent,
        runRegression
      }
    )).rejects.toThrow("regression command");

    expect(runAgent).not.toHaveBeenCalled();
    expect(runRegression).not.toHaveBeenCalled();
  });

  it("rejects target rule IDs that are absent from the frozen evidence", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, ["label"])));
    const runAgent = vi.fn();

    await expect(repairWorkflow(
      {
        beforePath,
        outDir: join(root, "repair"),
        approved: true,
        targetViolationIds: ["not-in-evidence"],
        regressionCommand: "npm test"
      },
      { scan: vi.fn(), runAgent, runRegression: vi.fn() }
    )).rejects.toThrow("Unknown target violation ID");

    expect(runAgent).not.toHaveBeenCalled();
  });

  it("rejects repair when the frozen evidence contains no target violations", async () => {
    const root = await temporaryRun();
    const beforePath = join(root, "before.json");
    await writeFile(beforePath, JSON.stringify(evidence(root, [])));
    const runAgent = vi.fn();

    await expect(repairWorkflow(
      { beforePath, outDir: join(root, "repair"), approved: true, regressionCommand: "npm test" },
      { scan: vi.fn(), runAgent, runRegression: vi.fn() }
    )).rejects.toThrow("at least one target violation");

    expect(runAgent).not.toHaveBeenCalled();
  });

  it("records regression command output and exit status", async () => {
    const success = await runRegressionCommand(`"${process.execPath}" -e "process.stdout.write('ok')"`, process.cwd());
    const failure = await runRegressionCommand(`"${process.execPath}" -e "process.stderr.write('bad'); process.exit(3)"`, process.cwd());

    expect(success).toMatchObject({ passed: true, details: "ok" });
    expect(failure).toMatchObject({ passed: false, details: "bad" });
  });
});
