import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { runCodexRepair } from "../agent/codex-runner.js";
import type { CodexRunResult } from "../agent/codex-runner.js";
import type { Decision } from "../contracts.js";
import { decideOutcome } from "../core/decision.js";
import { inspectWorkflow, repairWorkflow, runRegressionCommand } from "../core/workflow.js";
import { scanUrl } from "../scanner/axe-scanner.js";
import { parseManifest, parseResults, type BenchmarkManifest, type BenchmarkResults } from "./summary.js";

const CONDITIONS = ["direct", "formproof"] as const;
const MODEL = "gpt-5.6-sol";
const REASONING = "medium";
const TIMEOUT_MS = 900_000;
const HASH_EXCLUDES = new Set([".git", ".venv", "node_modules", "dist", "coverage", "__pycache__"]);

type Condition = typeof CONDITIONS[number];
export type BenchmarkCase = BenchmarkManifest["cases"][number];
export type BenchmarkProtocol = NonNullable<BenchmarkResults["protocol"]>;
export type BenchmarkRun = BenchmarkResults["runs"][number];

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

interface RunCommandOptions {
  timeoutMs?: number;
  input?: string;
}

type RunCommand = (command: string, args: string[], cwd: string, options?: RunCommandOptions) => Promise<CommandResult>;

interface ConditionInput {
  root: string;
  case: BenchmarkCase;
  condition: Condition;
  workspace: string;
  runDir: string;
}

export interface RunnerDependencies {
  runCommand?: RunCommand;
  executeCondition?: (input: ConditionInput) => Promise<BenchmarkRun>;
  now?: () => Date;
}

export interface FreezeOptions { root?: string }
export interface CaseOptions { root?: string; caseId: string; dryRun?: boolean }

export function parseCaseArguments(args: string[]): CaseOptions {
  const parsed = parseArgs({
    args,
    options: { case: { type: "string" }, "dry-run": { type: "boolean", default: false } },
    allowPositionals: true,
    strict: true
  });
  const caseId = parsed.values.case ?? parsed.positionals[0];
  if (!caseId || parsed.positionals.length > 1) throw new Error("Usage: benchmark case <case-id> [--dry-run]");
  return { caseId, dryRun: parsed.values["dry-run"] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function hashDirectory(root: string): Promise<string> {
  const files: string[] = [];
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (HASH_EXCLUDES.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  await visit(root);
  const hash = createHash("sha256");
  for (const path of files.sort()) {
    hash.update(relative(root, path).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(await readFile(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function runProcess(command: string, args: string[], cwd: string, options: RunCommandOptions = {}): Promise<CommandResult> {
  const child = spawn(command, args, { cwd, shell: args.length === 0, windowsHide: true });
  let stdout = "";
  let stderr = "";
  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");
  child.stdout?.on("data", (chunk: string) => { stdout += chunk; });
  child.stderr?.on("data", (chunk: string) => { stderr += chunk; });
  if (options.input !== undefined) child.stdin?.end(options.input);
  else child.stdin?.end();
  let timedOut = false;
  const timer = options.timeoutMs === undefined ? undefined : setTimeout(() => {
    timedOut = true;
    child.kill();
  }, options.timeoutMs);
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
  if (timer) clearTimeout(timer);
  return { exitCode: timedOut ? 124 : exitCode, stdout, stderr, timedOut };
}

async function git(runCommand: RunCommand, root: string, args: string[]): Promise<string> {
  const result = await runCommand("git", args, root);
  if (result.exitCode !== 0) throw new Error(`Git failed: ${result.stderr || result.stdout}`.trim());
  return result.stdout.trimEnd();
}

async function fixtureHashes(root: string, manifest: BenchmarkManifest): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(manifest.cases.map(async (item) => [
    item.id,
    await hashDirectory(resolve(root, item.fixturePath))
  ])));
}

export async function freezeBenchmark(options: FreezeOptions = {}, dependencies: RunnerDependencies = {}): Promise<BenchmarkProtocol> {
  const root = resolve(options.root ?? ".");
  const runCommand = dependencies.runCommand ?? runProcess;
  const manifestPath = join(root, "benchmark", "cases.json");
  const resultsPath = join(root, "benchmark", "results.json");
  const status = await git(runCommand, root, ["status", "--porcelain"]);
  if (status) throw new Error("Benchmark freeze requires a clean worktree.");
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = parseManifest(JSON.parse(manifestText));
  const results = parseResults(await readJson(resultsPath));
  if (results.protocol) throw new Error("Benchmark protocol is already frozen.");
  if (results.runs.length > 0) throw new Error("Benchmark protocol must be frozen before any runs are recorded.");
  const protocol: BenchmarkProtocol = {
    baseCommit: await git(runCommand, root, ["rev-parse", "HEAD"]),
    frozenAt: (dependencies.now ?? (() => new Date()))().toISOString(),
    manifestSha256: sha256(manifestText),
    fixtureSha256: await fixtureHashes(root, manifest),
    model: MODEL,
    reasoningEffort: REASONING,
    timeoutMs: TIMEOUT_MS
  };
  if (!/^[a-f0-9]{40}$/i.test(protocol.baseCommit)) throw new Error("Git HEAD must resolve to a 40-character commit hash.");
  await atomicJson(resultsPath, { ...results, protocol });
  return protocol;
}

function renderCommand(command: string, root: string, fixture: string): string {
  return command.replaceAll("{root}", root).replaceAll("{fixture}", fixture);
}

function displayCommand(command: string): string {
  return command.replaceAll("{root}", "<repository-root>").replaceAll("{fixture}", "<isolated-fixture>");
}

async function validateProtocol(root: string, manifestText: string, manifest: BenchmarkManifest, protocol: BenchmarkProtocol, runCommand: RunCommand): Promise<void> {
  if (protocol.manifestSha256 !== sha256(manifestText)) throw new Error("Benchmark manifest changed after freeze.");
  if (await git(runCommand, root, ["rev-parse", "HEAD"]) !== protocol.baseCommit) throw new Error("Git HEAD changed after benchmark freeze.");
  const dirty = (await git(runCommand, root, ["status", "--porcelain"]))
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => line.slice(3).replaceAll("\\", "/") !== "benchmark/results.json");
  if (dirty.length > 0) throw new Error("Worktree changed after benchmark freeze.");
  const currentHashes = await fixtureHashes(root, manifest);
  for (const item of manifest.cases) {
    if (currentHashes[item.id] !== protocol.fixtureSha256[item.id]) throw new Error(`Fixture changed after freeze: ${item.id}`);
  }
}

async function prepareWorkspace(root: string, item: BenchmarkCase, condition: Condition, runCommand: RunCommand): Promise<string> {
  const parent = join(root, ".formproof", "benchmark", "workspaces");
  await mkdir(parent, { recursive: true });
  const workspace = await mkdtemp(join(parent, `${item.id}-${condition}-`));
  try {
    await cp(resolve(root, item.fixturePath), workspace, {
      recursive: true,
      filter: (source) => !HASH_EXCLUDES.has(basename(source))
    });
    await git(runCommand, workspace, ["init", "--quiet"]);
    await mkdir(join(workspace, ".git", "info"), { recursive: true });
    await writeFile(join(workspace, ".git", "info", "exclude"), [...HASH_EXCLUDES].join("\n"), "utf8");
    await git(runCommand, workspace, ["add", "."]);
    await git(runCommand, workspace, ["-c", "user.name=FormProof Benchmark", "-c", "user.email=benchmark@invalid", "commit", "--quiet", "-m", "baseline"]);
    const setup = renderCommand(item.setupCommand, root, workspace);
    if (setup.trim()) {
      const result = await runCommand(setup, [], workspace);
      if (result.exitCode !== 0) throw new Error(`Setup failed for ${item.id}/${condition}: ${result.stderr || result.stdout}`.trim());
    }
    return workspace;
  } catch (error) {
    await removeBenchmarkWorkspace(root, workspace);
    throw error;
  }
}

export async function removeBenchmarkWorkspace(root: string, workspace: string): Promise<void> {
  const parent = resolve(root, ".formproof", "benchmark", "workspaces");
  const target = resolve(workspace);
  const within = relative(parent, target);
  if (!within || within.startsWith("..") || resolve(target) === resolve(root)) throw new Error(`Unsafe benchmark workspace cleanup target: ${target}`);
  await rm(target, { recursive: true, force: true });
}

export async function runBenchmarkCase(options: CaseOptions, dependencies: RunnerDependencies = {}): Promise<unknown> {
  const root = resolve(options.root ?? ".");
  const manifestPath = join(root, "benchmark", "cases.json");
  const resultsPath = join(root, "benchmark", "results.json");
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = parseManifest(JSON.parse(manifestText));
  const results = parseResults(await readJson(resultsPath));
  const item = manifest.cases.find((candidate) => candidate.id === options.caseId);
  if (!item) throw new Error(`Unknown benchmark case: ${options.caseId}`);
  if (!results.protocol) throw new Error("Benchmark protocol is not frozen. Run benchmark:freeze first.");
  const runCommand = dependencies.runCommand ?? runProcess;
  await validateProtocol(root, manifestText, manifest, results.protocol, runCommand);
  const completed = new Set(results.runs.filter((run) => run.caseId === item.id).map((run) => run.condition));
  const pending = CONDITIONS.filter((condition) => !completed.has(condition));
  if (pending.length === 0) throw new Error(`${item.id} already has recorded results for both conditions.`);
  if (options.dryRun) {
    return {
      caseId: item.id,
      conditions: [...pending],
      commands: {
        setup: displayCommand(item.setupCommand),
        server: displayCommand(item.serverCommand),
        regression: displayCommand(item.regressionCommand)
      }
    };
  }

  const executeCondition = dependencies.executeCondition ?? ((input) => defaultExecuteCondition(input, runCommand));
  const workspaces: Partial<Record<Condition, string>> = {};
  try {
    // Both setups are preflighted before either formal attempt starts.
    for (const condition of pending) workspaces[condition] = await prepareWorkspace(root, item, condition, runCommand);
    for (const condition of pending) {
      const workspace = workspaces[condition]!;
      const runDir = join(root, ".formproof", "benchmark", "runs", item.id, condition);
      await mkdir(runDir, { recursive: true });
      let run: BenchmarkRun;
      const started = Date.now();
      try {
        run = await executeCondition({ root, case: item, condition, workspace, runDir });
      } catch (error) {
        await writeFile(join(runDir, "error.txt"), `${error instanceof Error ? error.message : String(error)}\n`, "utf8");
        run = {
          caseId: item.id,
          condition,
          attempt: 1,
          decision: "ERROR",
          newViolationCount: 0,
          regressionPassed: false,
          wallClockMs: Date.now() - started,
          inputTokens: 0,
          outputTokens: 0,
          patchLines: await countPatchLines(runCommand, workspace)
        };
      }
      const latest = parseResults(await readJson(resultsPath));
      if (latest.runs.some((candidate) => candidate.caseId === item.id && candidate.condition === condition)) {
        throw new Error(`${item.id}/${condition} already has a recorded result.`);
      }
      latest.runs.push(run);
      await atomicJson(resultsPath, latest);
    }
  } finally {
    await Promise.all(Object.values(workspaces).map((workspace) => removeBenchmarkWorkspace(root, workspace)));
  }
  return { caseId: item.id, recorded: [...pending] };
}

async function waitForUrl(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* server is still starting */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`Fixture server did not become ready: ${url}`);
}

function startServer(command: string, cwd: string): ChildProcess {
  return spawn(command, [], { cwd, shell: true, windowsHide: true, detached: process.platform !== "win32" });
}

async function stopServer(server: ChildProcess, runCommand: RunCommand, cwd: string): Promise<void> {
  if (!server.pid || server.exitCode !== null) return;
  if (process.platform === "win32") await runCommand("taskkill", ["/pid", String(server.pid), "/T", "/F"], cwd).catch(() => undefined);
  else process.kill(-server.pid, "SIGTERM");
}

async function runCodex(prompt: string, workspace: string, runDir: string, runCommand: RunCommand): Promise<CodexRunResult & { timedOut: boolean }> {
  const trajectoryPath = join(runDir, "trajectory.jsonl");
  const lastMessagePath = join(runDir, "agent-summary.txt");
  if (runCommand !== runProcess) {
    const result = await runCommand("codex", [], workspace, { timeoutMs: TIMEOUT_MS, input: prompt });
    await writeFile(trajectoryPath, result.stdout, "utf8");
    return { exitCode: result.exitCode, trajectoryPath, lastMessagePath, stderr: result.stderr, timedOut: result.timedOut };
  }
  const result = await runCodexRepair({
    sourceRoot: workspace,
    trajectoryPath,
    lastMessagePath,
    model: MODEL,
    reasoningEffort: REASONING,
    timeoutMs: TIMEOUT_MS,
    prompt
  });
  return { ...result, timedOut: result.timedOut ?? false };
}

export async function countPatchLines(runCommand: RunCommand, workspace: string): Promise<number> {
  await git(runCommand, workspace, ["add", "-N", "."]);
  const result = await git(runCommand, workspace, ["diff", "--numstat", "HEAD"]);
  return result.split(/\r?\n/).filter(Boolean).reduce((total, line) => {
    const [added = "0", removed = "0"] = line.split("\t");
    return total + (Number(added) || 0) + (Number(removed) || 0);
  }, 0);
}

export function parseTrajectoryUsage(text: string): { inputTokens: number; outputTokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const line of text.split(/\r?\n/)) {
    try {
      const value = JSON.parse(line) as Record<string, unknown>;
      const usage = isRecord(value.usage) ? value.usage : isRecord(value.token_usage) ? value.token_usage : undefined;
      if (usage) {
        inputTokens = Math.max(inputTokens, Number(usage.input_tokens ?? usage.inputTokens) || 0);
        outputTokens = Math.max(outputTokens, Number(usage.output_tokens ?? usage.outputTokens) || 0);
      }
    } catch { /* ignore non-JSON diagnostic lines */ }
  }
  return { inputTokens, outputTokens };
}

export function createBenchmarkRun(caseId: string, condition: Condition, decision: Decision, elapsed: number, usage: ReturnType<typeof parseTrajectoryUsage>, lines: number): BenchmarkRun {
  return {
    caseId,
    condition,
    attempt: 1,
    decision: decision.status,
    newViolationCount: decision.newViolationIds.length,
    regressionPassed: decision.regressionGates.length > 0 && decision.regressionGates.every((gate) => gate.passed),
    wallClockMs: elapsed,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    patchLines: lines
  };
}

async function defaultExecuteCondition(input: ConditionInput, runCommand: RunCommand): Promise<BenchmarkRun> {
  const server = startServer(renderCommand(input.case.serverCommand, input.root, input.workspace), input.workspace);
  try {
    await waitForUrl(input.case.url);
    const started = Date.now();
    let decision: Decision;
    let trajectoryPath: string;
    if (input.condition === "direct") {
      const before = await scanUrl({ url: input.case.url, sourceRoot: input.workspace, screenshotPath: join(input.runDir, "before.png") });
      const template = await readFile(join(input.root, "benchmark", "direct-prompt.md"), "utf8");
      const prompt = template.replaceAll("{{URL}}", input.case.url).replaceAll("{{REGRESSION_COMMAND}}", renderCommand(input.case.regressionCommand, input.root, input.workspace));
      const agent = await runCodex(prompt, input.workspace, input.runDir, runCommand);
      trajectoryPath = agent.trajectoryPath;
      if (agent.timedOut) throw new Error("Codex timed out.");
      if (agent.exitCode !== 0) throw new Error(`Codex exited with ${agent.exitCode}.`);
      const after = await scanUrl({ url: input.case.url, sourceRoot: input.workspace, screenshotPath: join(input.runDir, "after.png") });
      const gate = await runRegressionCommand(renderCommand(input.case.regressionCommand, input.root, input.workspace), input.workspace);
      decision = decideOutcome({ before, after, targetViolationIds: before.violations.map((item) => item.id), regressionGates: [gate] });
      await Promise.all([
        writeFile(join(input.runDir, "before.json"), `${JSON.stringify(before, null, 2)}\n`),
        writeFile(join(input.runDir, "after.json"), `${JSON.stringify(after, null, 2)}\n`),
        writeFile(join(input.runDir, "decision.json"), `${JSON.stringify(decision, null, 2)}\n`)
      ]);
    } else {
      const inspected = await inspectWorkflow({ url: input.case.url, sourceRoot: input.workspace, outDir: input.runDir });
      let timedOut = false;
      let agentExitCode = 0;
      const repaired = await repairWorkflow({
        beforePath: inspected.beforePath,
        outDir: input.runDir,
        approved: true,
        regressionCommand: renderCommand(input.case.regressionCommand, input.root, input.workspace),
        model: MODEL
      }, {
        runAgent: async ({ prompt }) => {
          const result = await runCodex(prompt, input.workspace, input.runDir, runCommand);
          timedOut = result.timedOut;
          agentExitCode = result.exitCode;
          return result;
        }
      });
      if (timedOut) throw new Error("Codex timed out.");
      if (agentExitCode !== 0) throw new Error(`Codex exited with ${agentExitCode}.`);
      decision = repaired.decision;
      trajectoryPath = join(input.runDir, "trajectory.jsonl");
    }
    const usage = parseTrajectoryUsage(await readFile(trajectoryPath, "utf8"));
    return createBenchmarkRun(input.case.id, input.condition, decision, Date.now() - started, usage, await countPatchLines(runCommand, input.workspace));
  } finally {
    await stopServer(server, runCommand, input.workspace);
  }
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  if (command === "freeze") {
    process.stdout.write(`${JSON.stringify(await freezeBenchmark(), null, 2)}\n`);
    return;
  }
  if (command === "case") {
    process.stdout.write(`${JSON.stringify(await runBenchmarkCase(parseCaseArguments(rest)), null, 2)}\n`);
    return;
  }
  throw new Error("Usage: benchmark runner <freeze|case <case-id> [--dry-run]>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`Benchmark error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
