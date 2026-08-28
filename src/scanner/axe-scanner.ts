import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { detectAdapter, mapNodeToSources } from "../adapters/index.js";
import type { AuditViolation, Impact, ScanEvidence, ViolationNode } from "../contracts.js";

export interface ScanOptions {
  url: string;
  sourceRoot: string;
  screenshotPath?: string;
}

function normalizeRoot(path: string): string {
  const decoded = decodeURIComponent(path);
  const windowsUrlPath = decoded.match(/^\/([A-Za-z]:\/.*)$/);
  return resolve(windowsUrlPath?.[1] ?? decoded);
}

function normalizeImpact(impact: string | null | undefined): Impact {
  return impact === "minor" || impact === "moderate" || impact === "serious" || impact === "critical"
    ? impact
    : "unknown";
}

export async function scanUrl(options: ScanOptions): Promise<ScanEvidence> {
  const sourceRoot = normalizeRoot(options.sourceRoot);
  const adapter = await detectAdapter(sourceRoot);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(options.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    if (options.screenshotPath) await page.screenshot({ path: options.screenshotPath, fullPage: true });

    const violations: AuditViolation[] = [];
    for (const violation of results.violations) {
      const nodes: ViolationNode[] = [];
      for (const node of violation.nodes) {
        const target = node.target.map((part: string | string[]) => typeof part === "string" ? part : part.join(" >>> "));
        nodes.push({
          target,
          html: node.html,
          failureSummary: node.failureSummary ?? "No failure summary supplied.",
          sourceCandidates: await mapNodeToSources(sourceRoot, adapter, target, node.html)
        });
      }
      violations.push({
        id: violation.id,
        impact: normalizeImpact(violation.impact),
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: [...violation.tags],
        nodes
      });
    }

    return {
      schemaVersion: "1.0",
      runId: randomUUID(),
      capturedAt: new Date().toISOString(),
      target: { url: options.url, sourceRoot, adapter: adapter.id },
      violations,
      totals: {
        violations: violations.length,
        nodes: violations.reduce((total, violation) => total + violation.nodes.length, 0)
      }
    };
  } finally {
    await browser.close();
  }
}
