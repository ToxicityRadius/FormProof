import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const conditions = ["direct", "formproof"] as const;
type Condition = typeof conditions[number];
type RunDecision = "VERIFIED_FIXED" | "REGRESSION_BLOCKED" | "HUMAN_REVIEW_REQUIRED" | "ERROR";

export interface BenchmarkManifest {
  schemaVersion: "1.0";
  primaryMetric: "Macro-VBRR@1";
  cases: Array<{ id: string; stack: string }>;
}

export interface BenchmarkResults {
  schemaVersion: "1.0";
  runs: Array<{
    caseId: string;
    condition: Condition;
    attempt: number;
    decision: RunDecision;
    newViolationCount: number;
    regressionPassed: boolean;
    wallClockMs: number;
    inputTokens: number;
    outputTokens: number;
    patchLines: number;
  }>;
}

interface SecondarySummary {
  newViolationRuns: number;
  failedRegressionRuns: number;
  medianWallClockMs: number;
  medianInputTokens: number;
  medianOutputTokens: number;
  medianPatchLines: number;
}

export interface BenchmarkSummary {
  reportable: boolean;
  missingRuns: string[];
  macroVbrrAt1: Record<Condition, number | null>;
  improvementPercentagePoints: number | null;
  secondary: Record<Condition, SecondarySummary | null>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseManifest(value: unknown): BenchmarkManifest {
  if (!isRecord(value) || value.schemaVersion !== "1.0" || value.primaryMetric !== "Macro-VBRR@1" || !Array.isArray(value.cases)) {
    throw new Error("Invalid benchmark manifest.");
  }
  if (value.cases.length === 0) throw new Error("Benchmark manifest must contain cases.");
  const ids = new Set<string>();
  for (const item of value.cases) {
    if (!isRecord(item) || typeof item.id !== "string" || item.id.length === 0 || typeof item.stack !== "string" || item.stack.length === 0) {
      throw new Error("Invalid benchmark case.");
    }
    if (ids.has(item.id)) throw new Error(`Duplicate benchmark case: ${item.id}`);
    ids.add(item.id);
  }
  return value as unknown as BenchmarkManifest;
}

function parseResults(value: unknown): BenchmarkResults {
  if (!isRecord(value) || value.schemaVersion !== "1.0" || !Array.isArray(value.runs)) {
    throw new Error("Invalid benchmark results.");
  }
  for (const run of value.runs) {
    if (!isRecord(run)
      || typeof run.caseId !== "string"
      || !conditions.includes(run.condition as Condition)
      || !Number.isInteger(run.attempt) || (run.attempt as number) < 1
      || !["VERIFIED_FIXED", "REGRESSION_BLOCKED", "HUMAN_REVIEW_REQUIRED", "ERROR"].includes(run.decision as string)
      || !Number.isInteger(run.newViolationCount) || (run.newViolationCount as number) < 0
      || typeof run.regressionPassed !== "boolean"
      || ![run.wallClockMs, run.inputTokens, run.outputTokens, run.patchLines]
        .every((number) => Number.isInteger(number) && (number as number) >= 0)) {
      throw new Error("Invalid benchmark run.");
    }
  }
  return value as unknown as BenchmarkResults;
}

export function summarizeBenchmark(manifestInput: BenchmarkManifest, resultsInput: BenchmarkResults): BenchmarkSummary {
  const manifest = parseManifest(manifestInput);
  const results = parseResults(resultsInput);
  const caseById = new Map(manifest.cases.map((item) => [item.id, item]));
  const firstAttempts = new Map<string, BenchmarkResults["runs"][number]>();

  for (const run of results.runs) {
    if (!caseById.has(run.caseId)) throw new Error(`Unknown benchmark case: ${run.caseId}`);
    if (run.attempt !== 1) continue;
    const key = `${run.condition}:${run.caseId}`;
    if (firstAttempts.has(key)) throw new Error(`Duplicate first-attempt result: ${key}`);
    firstAttempts.set(key, run);
  }

  const required = conditions.flatMap((condition) => manifest.cases.map((item) => `${condition}:${item.id}`));
  const missingRuns = required.filter((key) => !firstAttempts.has(key)).sort();
  if (missingRuns.length > 0) {
    return {
      reportable: false,
      missingRuns,
      macroVbrrAt1: { direct: null, formproof: null },
      improvementPercentagePoints: null,
      secondary: { direct: null, formproof: null }
    };
  }

  const stacks = [...new Set(manifest.cases.map((item) => item.stack))];
  const score = (condition: Condition): number => {
    const stackRates = stacks.map((stack) => {
      const stackCases = manifest.cases.filter((item) => item.stack === stack);
      const resolved = stackCases.filter((item) => {
        const run = firstAttempts.get(`${condition}:${item.id}`)!;
        return run.decision === "VERIFIED_FIXED" && run.newViolationCount === 0 && run.regressionPassed;
      }).length;
      return resolved / stackCases.length;
    });
    return stackRates.reduce((sum, value) => sum + value, 0) / stackRates.length;
  };

  const direct = score("direct");
  const formproof = score("formproof");
  const median = (values: number[]): number => {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[middle]!
      : (sorted[middle - 1]! + sorted[middle]!) / 2;
  };
  const secondary = (condition: Condition): SecondarySummary => {
    const runs = manifest.cases.map((item) => firstAttempts.get(`${condition}:${item.id}`)!);
    return {
      newViolationRuns: runs.filter((run) => run.newViolationCount > 0).length,
      failedRegressionRuns: runs.filter((run) => !run.regressionPassed).length,
      medianWallClockMs: median(runs.map((run) => run.wallClockMs)),
      medianInputTokens: median(runs.map((run) => run.inputTokens)),
      medianOutputTokens: median(runs.map((run) => run.outputTokens)),
      medianPatchLines: median(runs.map((run) => run.patchLines))
    };
  };
  return {
    reportable: true,
    missingRuns: [],
    macroVbrrAt1: { direct, formproof },
    improvementPercentagePoints: (formproof - direct) * 100,
    secondary: { direct: secondary("direct"), formproof: secondary("formproof") }
  };
}

async function main(): Promise<void> {
  const [manifestPath = "benchmark/cases.json", resultsPath = "benchmark/results.json"] = process.argv.slice(2);
  const [manifest, results] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    readFile(resultsPath, "utf8").then(JSON.parse)
  ]);
  process.stdout.write(`${JSON.stringify(summarizeBenchmark(manifest, results), null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
