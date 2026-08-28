import { describe, expect, it } from "vitest";
import { renderHtmlReport } from "../src/report/html-report.js";
import type { Decision, ScanEvidence } from "../src/contracts.js";

const evidence: ScanEvidence = {
  schemaVersion: "1.0",
  runId: "report-test",
  capturedAt: "2026-08-29T00:00:00.000Z",
  target: { url: "https://example.test/?q=<unsafe>", sourceRoot: "C:/fixture", adapter: "static" },
  violations: [
    {
      id: "label",
      impact: "critical",
      description: "Input <label> is missing",
      help: "Forms need labels",
      helpUrl: "https://deque.example/label",
      tags: ["wcag2a"],
      nodes: [
        {
          target: ["#email"],
          html: "<input id=\"email\">",
          failureSummary: "Fix the missing label",
          sourceCandidates: [{ path: "index.html", confidence: "high", reason: "id match" }]
        }
      ]
    }
  ],
  totals: { violations: 1, nodes: 1 }
};

const decision: Decision = {
  status: "HUMAN_REVIEW_REQUIRED",
  summary: "Verification is incomplete.",
  unresolvedViolationIds: ["label"],
  newViolationIds: [],
  regressionGates: []
};

describe("renderHtmlReport", () => {
  it("renders an accessible evidence summary and escapes untrusted content", () => {
    const html = renderHtmlReport({ before: evidence, decision });

    expect(html).toContain("FormProof Evidence Report");
    expect(html).toContain("HUMAN_REVIEW_REQUIRED");
    expect(html).toContain("index.html");
    expect(html).not.toContain("?q=<unsafe>");
    expect(html).toContain("?q=&lt;unsafe&gt;");
    expect(html).toContain('<table');
    expect(html).toContain('<th scope="col">');
  });

  it("renders before-and-after evidence with passed and failed regression gates", () => {
    const after: ScanEvidence = {
      ...evidence,
      violations: [],
      totals: { violations: 0, nodes: 0 }
    };
    const html = renderHtmlReport({
      before: evidence,
      after,
      decision: {
        ...decision,
        status: "REGRESSION_BLOCKED",
        regressionGates: [
          { name: "unit tests", passed: true, details: "15 passed" },
          { name: "build", passed: false, details: "type <error>" }
        ]
      }
    });

    expect(html).toContain("After repair");
    expect(html).toContain("No automated violations detected.");
    expect(html).toContain("unit tests:</strong> passed");
    expect(html).toContain("build:</strong> failed");
    expect(html).toContain("type &lt;error&gt;");
  });

  it("blocks non-http and malformed evidence links and handles nodes without mappings", () => {
    const unsafe: ScanEvidence = {
      ...evidence,
      target: { ...evidence.target, url: "not a URL" },
      violations: [{
        ...evidence.violations[0]!,
        helpUrl: "javascript:alert(1)",
        nodes: []
      }]
    };

    const html = renderHtmlReport({ before: unsafe, decision });
    expect(html).toContain('href="#"');
    expect(html).toContain("No target");
    expect(html).toContain("No source candidate");
  });
});
