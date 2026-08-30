import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  countPatchLines,
  createBenchmarkRun,
  freezeBenchmark,
  parseCaseArguments,
  parseTrajectoryUsage,
  removeBenchmarkWorkspace,
  runProcess,
  runBenchmarkCase,
  type BenchmarkRun,
  type RunnerDependencies
} from "../src/benchmark/run.js";

const COMMIT = "a".repeat(40);

async function project(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "formproof-benchmark-"));
  await mkdir(join(root, "benchmark"), { recursive: true });
  await mkdir(join(root, "fixtures", "sample"), { recursive: true });
  await writeFile(join(root, "fixtures", "sample", "index.html"), "<button>Save</button>\n");
  await writeFile(join(root, "benchmark", "direct-prompt.md"), "Fix {{URL}} then run {{REGRESSION_COMMAND}}.\n");
  await writeFile(join(root, "benchmark", "cases.json"), JSON.stringify({
    schemaVersion: "1.0",
    primaryMetric: "Macro-VBRR@1",
    cases: [{
      id: "static-01",
      stack: "static",
      class: "semantics-and-names",
      fixturePath: "fixtures/sample",
      url: "http://127.0.0.1:4173",
      setupCommand: "setup {fixture}",
      serverCommand: "serve {fixture}",
      regressionCommand: "test {fixture}"
    }]
  }, null, 2));
  await writeFile(join(root, "benchmark", "results.json"), `${JSON.stringify({ schemaVersion: "1.0", protocol: null, runs: [] }, null, 2)}\n`);
  return root;
}

function command(stdout = "", exitCode = 0) {
  return { exitCode, stdout, stderr: "", timedOut: false };
}

describe("benchmark runner", () => {
  it("accepts npm-safe positional case arguments and the direct named form", () => {
    expect(parseCaseArguments(["static-01"])).toEqual({ caseId: "static-01", dryRun: false });
    expect(parseCaseArguments(["--case", "static-01", "--dry-run"])).toEqual({ caseId: "static-01", dryRun: true });
    expect(() => parseCaseArguments([])).toThrow("Usage: benchmark case");
  });

  it("freezes a clean protocol with the fixed model controls and fixture hashes", async () => {
    const root = await project();
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "status") return command("");
      if (args[0] === "rev-parse") return command(`${COMMIT}\n`);
      if (args[0] === "ls-files") return command("fixtures/sample/index.html\n");
      throw new Error(`unexpected git command: ${args.join(" ")}`);
    });

    const protocol = await freezeBenchmark({ root }, {
      runCommand,
      now: () => new Date("2026-08-30T00:00:00.000Z")
    });

    expect(protocol).toMatchObject({
      baseCommit: COMMIT,
      frozenAt: "2026-08-30T00:00:00.000Z",
      model: "gpt-5.6-sol",
      reasoningEffort: "medium",
      timeoutMs: 900_000
    });
    expect(protocol.manifestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(protocol.fixtureSha256["static-01"]).toMatch(/^[a-f0-9]{64}$/);
    const results = JSON.parse(await readFile(join(root, "benchmark", "results.json"), "utf8"));
    expect(results.protocol).toEqual(protocol);
  });

  it("refuses to freeze a dirty tracked tree", async () => {
    const root = await project();
    await expect(freezeBenchmark({ root }, {
      runCommand: vi.fn(async () => command(" M src/file.ts\n"))
    })).rejects.toThrow("clean worktree");
  });

  it("rejects invalid freeze state and git output", async () => {
    const root = await project();
    const resultsPath = join(root, "benchmark", "results.json");
    const existing = JSON.parse(await readFile(resultsPath, "utf8"));
    existing.runs.push(successfulRun("static-01", "direct"));
    await writeFile(resultsPath, `${JSON.stringify(existing, null, 2)}\n`);
    await expect(freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status" ? command("") : command(COMMIT))
    })).rejects.toThrow("before any runs");

    existing.runs = [];
    existing.protocol = {
      baseCommit: COMMIT,
      frozenAt: "2026-08-30T00:00:00.000Z",
      manifestSha256: "b".repeat(64),
      fixtureSha256: { "static-01": "c".repeat(64) },
      model: "gpt-5.6-sol",
      reasoningEffort: "medium",
      timeoutMs: 900_000
    };
    await writeFile(resultsPath, `${JSON.stringify(existing, null, 2)}\n`);
    await expect(freezeBenchmark({ root }, {
      runCommand: vi.fn(async () => command(""))
    })).rejects.toThrow("already frozen");

    existing.protocol = null;
    await writeFile(resultsPath, `${JSON.stringify(existing, null, 2)}\n`);
    await expect(freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status" ? command("") : command("short"))
    })).rejects.toThrow("40-character commit hash");
  });

  it("refuses to freeze when an untracked source file exists", async () => {
    const root = await project();
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "status") return command("?? fixtures/sample/untracked.html\n");
      throw new Error(`unexpected git command: ${args.join(" ")}`);
    });

    await expect(freezeBenchmark({ root }, { runCommand })).rejects.toThrow("clean worktree");
    expect(runCommand).toHaveBeenCalledWith("git", ["status", "--porcelain"], root);
  });

  it("dry-runs the paired case without copying fixtures or changing results", async () => {
    const root = await project();
    await freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status"
        ? command("")
        : args[0] === "rev-parse"
          ? command(`${COMMIT}\n`)
          : command("fixtures/sample/index.html\n"))
    });
    const before = await readFile(join(root, "benchmark", "results.json"), "utf8");

    const result = await runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command(""))
    });

    expect(result).toEqual({
      caseId: "static-01",
      conditions: ["direct", "formproof"],
      commands: {
        setup: "setup <isolated-fixture>",
        server: "serve <isolated-fixture>",
        regression: "test <isolated-fixture>"
      }
    });
    expect(await readFile(join(root, "benchmark", "results.json"), "utf8")).toBe(before);
  });

  it("rejects unknown, unfrozen, and drifted cases before setup", async () => {
    const root = await project();
    await expect(runBenchmarkCase({ root, caseId: "missing", dryRun: true })).rejects.toThrow("Unknown benchmark case");
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true })).rejects.toThrow("not frozen");

    await freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status" ? command("") : command(`${COMMIT}\n`))
    });
    const resultsPath = join(root, "benchmark", "results.json");
    const results = JSON.parse(await readFile(resultsPath, "utf8"));

    results.protocol.model = "wrong-model";
    await writeFile(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async () => command(`${COMMIT}\n`))
    })).rejects.toThrow("Invalid benchmark protocol");

    results.protocol.model = "gpt-5.6-sol";
    results.protocol.manifestSha256 = "b".repeat(64);
    await writeFile(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async () => command(`${COMMIT}\n`))
    })).rejects.toThrow("manifest changed");

    const manifestText = await readFile(join(root, "benchmark", "cases.json"), "utf8");
    results.protocol.manifestSha256 = (await import("node:crypto")).createHash("sha256").update(manifestText).digest("hex");
    await writeFile(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "rev-parse" ? command(`${"d".repeat(40)}\n`) : command(""))
    })).rejects.toThrow("HEAD changed");
  });

  it("rejects tracked and fixture drift after freeze", async () => {
    const root = await project();
    await freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status" ? command("") : command(`${COMMIT}\n`))
    });
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command(" M src/file.ts\n"))
    })).rejects.toThrow("Worktree changed");

    await writeFile(join(root, "fixtures", "sample", "index.html"), "<button>Changed</button>\n");
    await expect(runBenchmarkCase({ root, caseId: "static-01", dryRun: true }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command(" M benchmark/results.json\n"))
    })).rejects.toThrow("Fixture changed");
  });

  it("prepares both isolated copies before running direct then FormProof and atomically appends results", async () => {
    const root = await project();
    await freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status"
        ? command("")
        : args[0] === "rev-parse"
          ? command(`${COMMIT}\n`)
          : command("fixtures/sample/index.html\n"))
    });
    const order: string[] = [];
    const workspaces: string[] = [];
    const runCommand = vi.fn(async (executable: string, args: string[], cwd: string) => {
      if (cwd === root && args[0] === "rev-parse") return command(`${COMMIT}\n`);
      if (cwd === root && args[0] === "status") return command(" M benchmark/results.json\n");
      order.push(`setup:${cwd}`);
      return command();
    });
    const executeCondition: RunnerDependencies["executeCondition"] = vi.fn(async (input) => {
      order.push(input.condition);
      workspaces.push(input.workspace);
      expect(await readFile(join(input.workspace, "index.html"), "utf8")).toContain("Save");
      await writeFile(join(input.workspace, `${input.condition}.txt`), "changed");
      return successfulRun(input.case.id, input.condition);
    });

    await runBenchmarkCase({ root, caseId: "static-01" }, { runCommand, executeCondition });

    expect(order.slice(-2)).toEqual(["direct", "formproof"]);
    expect(workspaces[0]).not.toBe(workspaces[1]);
    await expect(stat(workspaces[0]!)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(workspaces[1]!)).rejects.toMatchObject({ code: "ENOENT" });
    const results = JSON.parse(await readFile(join(root, "benchmark", "results.json"), "utf8"));
    expect(results.runs.map((run: BenchmarkRun) => run.condition)).toEqual(["direct", "formproof"]);
  });

  it("does not consume an attempt when setup fails and resumes only the missing condition", async () => {
    const root = await project();
    await freezeBenchmark({ root }, {
      runCommand: vi.fn(async (_command, args) => args[0] === "status"
        ? command("")
        : args[0] === "rev-parse"
          ? command(`${COMMIT}\n`)
          : command("fixtures/sample/index.html\n"))
    });
    const executeCondition = vi.fn();
    await expect(runBenchmarkCase({ root, caseId: "static-01" }, {
      runCommand: vi.fn(async (_command, args, cwd) => cwd === root
        ? args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command(" M benchmark/results.json\n")
        : args[0] === "init" || args[0] === "add" || args[0] === "-c" ? command() : command("", 1)),
      executeCondition
    })).rejects.toThrow("Setup failed");
    expect(executeCondition).not.toHaveBeenCalled();
    let results = JSON.parse(await readFile(join(root, "benchmark", "results.json"), "utf8"));
    expect(results.runs).toEqual([]);

    results.runs.push(successfulRun("static-01", "direct"));
    await writeFile(join(root, "benchmark", "results.json"), `${JSON.stringify(results, null, 2)}\n`);
    const resumed = vi.fn(async (input) => successfulRun(input.case.id, input.condition));
    await runBenchmarkCase({ root, caseId: "static-01" }, {
      runCommand: vi.fn(async (_command, args, cwd) => cwd === root && args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command()),
      executeCondition: resumed
    });
    expect(resumed).toHaveBeenCalledOnce();
    expect(resumed.mock.calls[0]![0].condition).toBe("formproof");
    await expect(runBenchmarkCase({ root, caseId: "static-01" }, {
      runCommand: vi.fn(async (_command, args, cwd) => cwd === root && args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command()),
      executeCondition: resumed
    })).rejects.toThrow("already has recorded results for both conditions");
  });

  it("records an agent failure as ERROR and continues with the paired condition", async () => {
    const root = await project();
    const manifestPath = join(root, "benchmark", "cases.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.cases[0].setupCommand = "";
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const frozenGit = vi.fn(async (_command: string, args: string[]) => args[0] === "status"
      ? command("")
      : args[0] === "rev-parse"
        ? command(`${COMMIT}\n`)
        : command());
    await freezeBenchmark({ root }, { runCommand: frozenGit });
    const executeCondition = vi.fn(async (input) => {
      if (input.condition === "direct") throw new Error("agent failed");
      throw "plain failure";
    });

    await runBenchmarkCase({ root, caseId: "static-01" }, {
      runCommand: vi.fn(async (_command, args, cwd) => cwd === root && args[0] === "rev-parse" ? command(`${COMMIT}\n`) : command()),
      executeCondition
    });

    const results = JSON.parse(await readFile(join(root, "benchmark", "results.json"), "utf8"));
    expect(results.runs.map((run: BenchmarkRun) => run.decision)).toEqual(["ERROR", "ERROR"]);
    expect(await readFile(join(root, ".formproof", "benchmark", "runs", "static-01", "direct", "error.txt"), "utf8"))
      .toBe("agent failed\n");
    expect(await readFile(join(root, ".formproof", "benchmark", "runs", "static-01", "formproof", "error.txt"), "utf8"))
      .toBe("plain failure\n");
  });

  it("parses peak token usage, counts textual patch lines, and derives run gates", async () => {
    expect(parseTrajectoryUsage([
      "diagnostic",
      JSON.stringify({ usage: { input_tokens: 3, output_tokens: 4 } }),
      JSON.stringify({ token_usage: { inputTokens: 8, outputTokens: 2 } }),
      JSON.stringify({ usage: null }),
      JSON.stringify({ usage: 5, token_usage: 6 }),
      JSON.stringify({ usage: { input_tokens: "invalid", output_tokens: "invalid" } })
    ].join("\n"))).toEqual({ inputTokens: 8, outputTokens: 4 });

    const runCommand = vi.fn(async (_command: string, args: string[]) =>
      args[0] === "diff" ? command("2\t1\tfile.txt\n-\t-\timage.png\n") : command(""));
    expect(await countPatchLines(runCommand, "C:\\fixture")).toBe(3);
    await expect(countPatchLines(vi.fn(async () => ({ ...command("git failed", 1), stderr: "" })), "C:\\fixture"))
      .rejects.toThrow("Git failed: git failed");

    const baseDecision = {
      status: "VERIFIED_FIXED" as const,
      summary: "fixed",
      unresolvedViolationIds: [],
      newViolationIds: ["new-rule"],
      regressionGates: []
    };
    expect(createBenchmarkRun("static-01", "direct", baseDecision, 12, { inputTokens: 8, outputTokens: 4 }, 3))
      .toMatchObject({ newViolationCount: 1, regressionPassed: false, wallClockMs: 12, patchLines: 3 });
    expect(createBenchmarkRun("static-01", "formproof", {
      ...baseDecision,
      regressionGates: [{ name: "test", passed: true, details: "ok" }]
    }, 12, { inputTokens: 8, outputTokens: 4 }, 3).regressionPassed).toBe(true);
    expect(createBenchmarkRun("static-01", "formproof", {
      ...baseDecision,
      regressionGates: [{ name: "test", passed: false, details: "failed" }]
    }, 12, { inputTokens: 8, outputTokens: 4 }, 3).regressionPassed).toBe(false);
  });

  it("runs subprocesses with output, input, shell commands, and timeouts", async () => {
    const root = await project();
    const output = await runProcess(process.execPath, ["-e", "process.stdout.write('out'); process.stderr.write('err')"], root);
    expect(output).toMatchObject({ exitCode: 0, stdout: "out", stderr: "err", timedOut: false });

    const input = await runProcess(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], root, { input: "hello", timeoutMs: 2_000 });
    expect(input).toMatchObject({ exitCode: 0, stdout: "hello", timedOut: false });

    const shell = await runProcess(`"${process.execPath}" --version`, [], root);
    expect(shell.exitCode).toBe(0);

    const timedOut = await runProcess(process.execPath, ["-e", "setTimeout(() => {}, 1000)"], root, { timeoutMs: 10 });
    expect(timedOut).toMatchObject({ exitCode: 124, timedOut: true });

    await expect(runProcess(join(root, "missing-executable"), ["--version"], root)).rejects.toBeTruthy();
  });

  it("refuses cleanup outside the generated workspace directory", async () => {
    const root = await project();
    await expect(removeBenchmarkWorkspace(root, root)).rejects.toThrow("Unsafe benchmark workspace cleanup target");
    await expect(removeBenchmarkWorkspace(root, join(root, ".formproof", "benchmark", "workspaces")))
      .rejects.toThrow("Unsafe benchmark workspace cleanup target");
  });
});

function successfulRun(caseId: string, condition: "direct" | "formproof"): BenchmarkRun {
  return {
    caseId,
    condition,
    attempt: 1,
    decision: "VERIFIED_FIXED",
    newViolationCount: 0,
    regressionPassed: true,
    wallClockMs: 10,
    inputTokens: 1,
    outputTokens: 1,
    patchLines: 1
  };
}
