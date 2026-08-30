import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { summarizeBenchmark, type BenchmarkManifest, type BenchmarkResults } from "../src/benchmark/summary.js";

const manifest: BenchmarkManifest = {
  schemaVersion: "1.0",
  primaryMetric: "Macro-VBRR@1",
  cases: [
    { id: "static-01", stack: "static", class: "semantics-and-names", fixturePath: "fixtures/static-label", url: "http://127.0.0.1:4173", setupCommand: "", serverCommand: "node server.mjs", regressionCommand: "npm test" },
    { id: "react-01", stack: "react", class: "semantics-and-names", fixturePath: "fixtures/react-label", url: "http://127.0.0.1:4174", setupCommand: "npm ci", serverCommand: "npm run dev", regressionCommand: "npm test" }
  ]
};

const protocol: NonNullable<BenchmarkResults["protocol"]> = {
  baseCommit: "a".repeat(40),
  frozenAt: "2026-08-30T00:00:00.000Z",
  manifestSha256: "b".repeat(64),
  fixtureSha256: { "static-01": "c".repeat(64), "react-01": "d".repeat(64) },
  model: "gpt-5.6-sol",
  reasoningEffort: "medium",
  memoryEnabled: false,
  timeoutMs: 900_000
};

function run(
  caseId: string,
  condition: "direct" | "formproof",
  decision: "VERIFIED_FIXED" | "REGRESSION_BLOCKED",
  wallClockMs: number
): BenchmarkResults["runs"][number] {
  return {
    caseId,
    condition,
    attempt: 1,
    decision,
    newViolationCount: 0,
    regressionPassed: decision === "VERIFIED_FIXED",
    wallClockMs,
    inputTokens: wallClockMs * 10,
    outputTokens: wallClockMs,
    patchLines: 1
  };
}

describe("benchmark summary", () => {
  it("refuses to report the primary metric while first-attempt runs are missing", () => {
    const results: BenchmarkResults = {
      schemaVersion: "1.0",
      protocol,
      runs: [
        run("static-01", "formproof", "VERIFIED_FIXED", 10)
      ]
    };

    expect(summarizeBenchmark(manifest, results)).toMatchObject({
      reportable: false,
      missingRuns: [
        "direct:react-01",
        "direct:static-01",
        "formproof:react-01"
      ],
      macroVbrrAt1: { direct: null, formproof: null },
      improvementPercentagePoints: null
    });
  });

  it("macro-averages stack rates only after both conditions are complete", () => {
    const results: BenchmarkResults = {
      schemaVersion: "1.0",
      protocol,
      runs: [
        run("static-01", "direct", "VERIFIED_FIXED", 10),
        run("react-01", "direct", "REGRESSION_BLOCKED", 20),
        run("static-01", "formproof", "VERIFIED_FIXED", 30),
        run("react-01", "formproof", "VERIFIED_FIXED", 50)
      ]
    };

    expect(summarizeBenchmark(manifest, results)).toMatchObject({
      reportable: true,
      missingRuns: [],
      macroVbrrAt1: { direct: 0.5, formproof: 1 },
      improvementPercentagePoints: 50,
      secondary: {
        direct: {
          newViolationRuns: 0,
          failedRegressionRuns: 1,
          medianWallClockMs: 15,
          medianInputTokens: 150,
          medianOutputTokens: 15,
          medianPatchLines: 1
        },
        formproof: {
          newViolationRuns: 0,
          failedRegressionRuns: 0,
          medianWallClockMs: 40,
          medianInputTokens: 400,
          medianOutputTokens: 40,
          medianPatchLines: 1
        }
      }
    });
  });

  it("rejects duplicate first-attempt results", () => {
    const duplicate = run("static-01", "direct", "VERIFIED_FIXED", 10);

    expect(() => summarizeBenchmark(manifest, {
      schemaVersion: "1.0",
      protocol,
      runs: [duplicate, duplicate]
    })).toThrow("Duplicate first-attempt result: direct:static-01");
  });

  it("rejects empty and duplicate case manifests", () => {
    expect(() => summarizeBenchmark({ ...manifest, cases: [] }, { schemaVersion: "1.0", protocol, runs: [] }))
      .toThrow("Benchmark manifest must contain cases.");
    expect(() => summarizeBenchmark({ ...manifest, cases: [manifest.cases[0]!, manifest.cases[0]!] }, { schemaVersion: "1.0", protocol, runs: [] }))
      .toThrow("Duplicate benchmark case: static-01");
  });

  it("keeps an unfrozen ledger non-reportable", () => {
    const completeRuns = [
      run("static-01", "direct", "VERIFIED_FIXED", 10),
      run("react-01", "direct", "VERIFIED_FIXED", 20),
      run("static-01", "formproof", "VERIFIED_FIXED", 30),
      run("react-01", "formproof", "VERIFIED_FIXED", 40)
    ];

    expect(summarizeBenchmark(manifest, { schemaVersion: "1.0", protocol: null, runs: completeRuns })).toMatchObject({
      reportable: false,
      protocolFrozen: false,
      macroVbrrAt1: { direct: null, formproof: null },
      improvementPercentagePoints: null,
      secondary: { direct: null, formproof: null }
    });
  });

  it("rejects invalid or mismatched freeze metadata", () => {
    expect(() => summarizeBenchmark(manifest, {
      schemaVersion: "1.0",
      protocol: { ...protocol, baseCommit: "not-a-commit" },
      runs: []
    })).toThrow("Invalid benchmark protocol.");
    expect(() => summarizeBenchmark(manifest, {
      schemaVersion: "1.0",
      protocol: { ...protocol, fixtureSha256: { "static-01": "c".repeat(64) } },
      runs: []
    })).toThrow("Benchmark protocol fixture hashes do not match the manifest.");
  });

  it("defines twelve executable non-Angular cases and therefore 24 required rows", () => {
    const formalManifest = JSON.parse(readFileSync("benchmark/cases.json", "utf8")) as BenchmarkManifest;
    const summary = summarizeBenchmark(formalManifest, { schemaVersion: "1.0", protocol: null, runs: [] });

    expect(formalManifest.cases).toHaveLength(12);
    expect(formalManifest.cases.every((item) => item.stack !== "angular")).toBe(true);
    expect(formalManifest.cases.every((item) => item.fixturePath && item.url && item.serverCommand && item.regressionCommand)).toBe(true);
    expect(summary.missingRuns).toHaveLength(24);
  });
});
