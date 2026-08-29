import { describe, expect, it } from "vitest";
import { summarizeBenchmark, type BenchmarkManifest, type BenchmarkResults } from "../src/benchmark/summary.js";

const manifest: BenchmarkManifest = {
  schemaVersion: "1.0",
  primaryMetric: "Macro-VBRR@1",
  cases: [
    { id: "static-01", stack: "static" },
    { id: "react-01", stack: "react" }
  ]
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
      runs: [duplicate, duplicate]
    })).toThrow("Duplicate first-attempt result: direct:static-01");
  });

  it("rejects empty and duplicate case manifests", () => {
    expect(() => summarizeBenchmark({ ...manifest, cases: [] }, { schemaVersion: "1.0", runs: [] }))
      .toThrow("Benchmark manifest must contain cases.");
    expect(() => summarizeBenchmark({ ...manifest, cases: [manifest.cases[0]!, manifest.cases[0]!] }, { schemaVersion: "1.0", runs: [] }))
      .toThrow("Duplicate benchmark case: static-01");
  });
});
