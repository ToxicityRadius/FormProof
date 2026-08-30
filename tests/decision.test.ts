import { describe, expect, it } from "vitest";
import { decideOutcome } from "../src/core/decision.js";
import type { ScanEvidence } from "../src/contracts.js";

function evidence(ids: string[]): ScanEvidence {
  return {
    schemaVersion: "1.0",
    runId: "test-run",
    capturedAt: "2026-08-29T00:00:00.000Z",
    target: {
      url: "http://127.0.0.1:4173",
      sourceRoot: "C:/fixture",
      adapter: "static"
    },
    violations: ids.map((id) => ({
      id,
      impact: "serious",
      description: `${id} description`,
      help: `${id} help`,
      helpUrl: `https://example.test/${id}`,
      tags: ["wcag2a"],
      nodes: []
    })),
    totals: {
      violations: ids.length,
      nodes: ids.length
    }
  };
}

describe("decideOutcome", () => {
  it("returns VERIFIED_FIXED only when every target is absent and gates pass", () => {
    const result = decideOutcome({
      before: evidence(["label"]),
      after: evidence([]),
      targetViolationIds: ["label"],
      regressionGates: [{ name: "existing tests", passed: true, details: "12 passed" }]
    });

    expect(result.status).toBe("VERIFIED_FIXED");
  });

  it("requires human review when no regression gate is provided", () => {
    const result = decideOutcome({
      before: evidence(["label"]),
      after: evidence([]),
      targetViolationIds: ["label"],
      regressionGates: []
    });

    expect(result.status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.summary).toContain("regression gate");
  });

  it("blocks a repair when a regression gate fails", () => {
    const result = decideOutcome({
      before: evidence(["label"]),
      after: evidence([]),
      targetViolationIds: ["label"],
      regressionGates: [{ name: "existing tests", passed: false, details: "1 failed" }]
    });

    expect(result.status).toBe("REGRESSION_BLOCKED");
  });

  it("requires human review when automated evidence is incomplete", () => {
    const result = decideOutcome({
      before: evidence(["label"]),
      after: evidence(["label"]),
      targetViolationIds: ["label"],
      regressionGates: [{ name: "existing tests", passed: true, details: "12 passed" }]
    });

    expect(result.status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.unresolvedViolationIds).toEqual(["label"]);
  });

  it("never accepts new accessibility violations", () => {
    const result = decideOutcome({
      before: evidence(["label"]),
      after: evidence(["color-contrast"]),
      targetViolationIds: ["label"],
      regressionGates: []
    });

    expect(result.status).toBe("REGRESSION_BLOCKED");
    expect(result.newViolationIds).toEqual(["color-contrast"]);
  });
});
