import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildRepairPrompt, runCodexRepair, type CodexRunInput, type CodexRunResult } from "../agent/codex-runner.js";
import type { Decision, RegressionGate, ScanEvidence } from "../contracts.js";
import { renderHtmlReport } from "../report/html-report.js";
import { scanUrl, type ScanOptions } from "../scanner/axe-scanner.js";
import { decideOutcome } from "./decision.js";

type ScanFunction = (options: ScanOptions) => Promise<ScanEvidence>;
type AgentFunction = (input: CodexRunInput) => Promise<CodexRunResult>;
type RegressionFunction = (command: string, cwd: string) => Promise<RegressionGate>;

export interface InspectWorkflowInput {
  url: string;
  sourceRoot: string;
  outDir: string;
}

export interface RepairWorkflowInput {
  beforePath: string;
  outDir: string;
  approved: boolean;
  targetViolationIds?: string[];
  regressionCommand: string;
  model?: string;
}

export interface WorkflowResult {
  decision: Decision;
  reportPath: string;
  beforePath: string;
  afterPath?: string;
}

export interface InspectDependencies {
  scan?: ScanFunction;
}

export interface RepairDependencies {
  scan?: ScanFunction;
  runAgent?: AgentFunction;
  runRegression?: RegressionFunction;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isScanEvidence(value: unknown): value is ScanEvidence {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScanEvidence>;
  return candidate.schemaVersion === "1.0"
    && typeof candidate.runId === "string"
    && Array.isArray(candidate.violations)
    && typeof candidate.target?.url === "string"
    && typeof candidate.target?.sourceRoot === "string";
}

async function readEvidence(path: string): Promise<ScanEvidence> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isScanEvidence(value)) throw new Error(`Invalid FormProof evidence file: ${path}`);
  return value;
}

export async function runRegressionCommand(command: string, cwd: string): Promise<RegressionGate> {
  const child = spawn(command, { cwd, shell: true, windowsHide: true });
  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => { output += chunk; });
  child.stderr.on("data", (chunk: string) => { output += chunk; });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
  const details = output.trim().slice(-8_000) || `exit code ${exitCode}`;
  return { name: command, passed: exitCode === 0, details };
}

export async function inspectWorkflow(input: InspectWorkflowInput, dependencies: InspectDependencies = {}): Promise<WorkflowResult> {
  const scan = dependencies.scan ?? scanUrl;
  await mkdir(input.outDir, { recursive: true });
  const beforePath = join(input.outDir, "before.json");
  const reportPath = join(input.outDir, "report.html");
  const before = await scan({
    url: input.url,
    sourceRoot: input.sourceRoot,
    screenshotPath: join(input.outDir, "before.png")
  });
  const targetViolationIds = before.violations.map((violation) => violation.id);
  const decision: Decision = {
    status: "HUMAN_REVIEW_REQUIRED",
    summary: before.violations.length > 0
      ? "Baseline evidence is frozen. Human approval is required before repair."
      : "No automated violations were detected; human review is still required for non-automated criteria.",
    unresolvedViolationIds: targetViolationIds,
    newViolationIds: [],
    regressionGates: []
  };

  await Promise.all([
    writeJson(beforePath, before),
    writeJson(join(input.outDir, "decision.json"), decision),
    writeFile(join(input.outDir, "repair-prompt.md"), `${buildRepairPrompt(before, targetViolationIds)}\n`, "utf8"),
    writeFile(reportPath, renderHtmlReport({ before, decision }), "utf8")
  ]);

  return { decision, reportPath, beforePath };
}

export async function repairWorkflow(input: RepairWorkflowInput, dependencies: RepairDependencies = {}): Promise<WorkflowResult> {
  if (!input.approved) throw new Error("Repair requires explicit human approval. Re-run with --approve after reviewing before.json and repair-prompt.md.");
  if (!input.regressionCommand.trim()) throw new Error("Repair requires a regression command supplied with --test.");

  const scan = dependencies.scan ?? scanUrl;
  const runAgent = dependencies.runAgent ?? runCodexRepair;
  const runRegression = dependencies.runRegression ?? runRegressionCommand;
  const before = await readEvidence(input.beforePath);
  const targetViolationIds = input.targetViolationIds ?? before.violations.map((violation) => violation.id);
  if (targetViolationIds.length === 0) throw new Error("Repair requires at least one target violation from the frozen evidence.");
  const availableViolationIds = new Set(before.violations.map((violation) => violation.id));
  const unknownViolationIds = [...new Set(targetViolationIds.filter((id) => !availableViolationIds.has(id)))].sort();
  if (unknownViolationIds.length > 0) throw new Error(`Unknown target violation ID(s): ${unknownViolationIds.join(", ")}`);
  const prompt = buildRepairPrompt(before, targetViolationIds, input.regressionCommand);
  await mkdir(input.outDir, { recursive: true });

  const reportPath = join(input.outDir, "report.html");
  const decisionPath = join(input.outDir, "decision.json");
  const afterPath = join(input.outDir, "after.json");
  const pendingDecision: Decision = {
    status: "HUMAN_REVIEW_REQUIRED",
    summary: "Repair started; verification has not completed. No repair has been accepted for this attempt.",
    unresolvedViolationIds: targetViolationIds,
    newViolationIds: [],
    regressionGates: []
  };
  const saveDecision = async (decision: Decision, after?: ScanEvidence): Promise<void> => {
    await Promise.all([
      writeJson(decisionPath, decision),
      writeFile(reportPath, renderHtmlReport({ before, decision, ...(after ? { after } : {}) }), "utf8")
    ]);
  };

  await saveDecision(pendingDecision);
  try {
    await Promise.all([
      rm(afterPath, { force: true }),
      rm(join(input.outDir, "after.png"), { force: true }),
      writeFile(join(input.outDir, "repair-prompt.md"), `${prompt}\n`, "utf8")
    ]);
    const agentResult = await runAgent({
      sourceRoot: before.target.sourceRoot,
      trajectoryPath: join(input.outDir, "trajectory.jsonl"),
      lastMessagePath: join(input.outDir, "agent-summary.txt"),
      prompt,
      ...(input.model ? { model: input.model } : {})
    });

    if (agentResult.exitCode !== 0) {
      const decision: Decision = {
        ...pendingDecision,
        summary: `Codex exited with code ${agentResult.exitCode}; no repair was accepted.`
      };
      await saveDecision(decision);
      return { decision, reportPath, beforePath: input.beforePath };
    }

    const after = await scan({
      url: before.target.url,
      sourceRoot: before.target.sourceRoot,
      screenshotPath: join(input.outDir, "after.png")
    });
    const regressionGates = [await runRegression(input.regressionCommand, before.target.sourceRoot)];
    const decision = decideOutcome({ before, after, targetViolationIds, regressionGates });

    await writeJson(afterPath, after);
    await saveDecision(decision, after);
    return { decision, reportPath, beforePath: input.beforePath, afterPath };
  } catch (error) {
    await saveDecision({
      ...pendingDecision,
      summary: `Repair or verification failed; no repair was accepted: ${error instanceof Error ? error.message : String(error)}`
    });
    throw error;
  }
}
