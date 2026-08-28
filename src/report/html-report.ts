import type { AuditViolation, ReportInput, ScanEvidence } from "../contracts.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? escapeHtml(value) : "#";
  } catch {
    return "#";
  }
}

function violationRows(violations: AuditViolation[]): string {
  if (violations.length === 0) return '<tr><td colspan="5">No automated violations detected.</td></tr>';

  return violations.map((violation) => {
    const sources = violation.nodes
      .flatMap((node) => node.sourceCandidates)
      .map((candidate) => `${escapeHtml(candidate.path)} (${candidate.confidence})`)
      .join("<br>") || "No source candidate";
    const targets = violation.nodes.map((node) => escapeHtml(node.target.join(" "))).join("<br>") || "No target";
    return `<tr>
      <th scope="row"><a href="${safeUrl(violation.helpUrl)}">${escapeHtml(violation.id)}</a></th>
      <td>${escapeHtml(violation.impact)}</td>
      <td>${escapeHtml(violation.help)}</td>
      <td><code>${targets}</code></td>
      <td>${sources}</td>
    </tr>`;
  }).join("\n");
}

function evidenceSection(title: string, evidence: ScanEvidence): string {
  return `<section aria-labelledby="${title.toLowerCase().replaceAll(" ", "-")}">
    <h2 id="${title.toLowerCase().replaceAll(" ", "-")}">${escapeHtml(title)}</h2>
    <dl>
      <dt>Target</dt><dd><a href="${safeUrl(evidence.target.url)}">${escapeHtml(evidence.target.url)}</a></dd>
      <dt>Adapter</dt><dd>${escapeHtml(evidence.target.adapter)}</dd>
      <dt>Rules</dt><dd>${evidence.totals.violations}</dd>
      <dt>Affected nodes</dt><dd>${evidence.totals.nodes}</dd>
    </dl>
    <div class="table-wrap"><table>
      <caption>${escapeHtml(title)} automated accessibility evidence</caption>
      <thead><tr><th scope="col">Rule</th><th scope="col">Impact</th><th scope="col">Help</th><th scope="col">Target</th><th scope="col">Source candidate</th></tr></thead>
      <tbody>${violationRows(evidence.violations)}</tbody>
    </table></div>
  </section>`;
}

export function renderHtmlReport(input: ReportInput): string {
  const statusClass = input.decision.status.toLowerCase().replaceAll("_", "-");
  const afterSection = input.after ? evidenceSection("After repair", input.after) : "";
  const gateItems = input.decision.regressionGates.length === 0
    ? "<li>No regression command recorded.</li>"
    : input.decision.regressionGates.map((gate) => `<li><strong>${escapeHtml(gate.name)}:</strong> ${gate.passed ? "passed" : "failed"} — ${escapeHtml(gate.details)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FormProof Evidence Report</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; line-height: 1.5; }
    body { max-width: 76rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .status { border: 0.25rem solid currentColor; border-radius: 0.5rem; padding: 1rem; font-weight: 700; }
    .verified-fixed { color: #0b6b32; } .regression-blocked { color: #a3261e; } .human-review-required { color: #8a5200; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; } dt { font-weight: 700; }
    .table-wrap { overflow-x: auto; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #777; padding: .5rem; text-align: left; vertical-align: top; }
    code { white-space: normal; } a { color: inherit; text-decoration-thickness: .12em; }
  </style>
</head>
<body>
  <main>
    <h1>FormProof Evidence Report</h1>
    <p class="status ${statusClass}">${escapeHtml(input.decision.status)}: ${escapeHtml(input.decision.summary)}</p>
    <p>This report covers automated evidence only. It is not a WCAG conformance certificate.</p>
    ${evidenceSection("Before repair", input.before)}
    ${afterSection}
    <section aria-labelledby="regression-gates"><h2 id="regression-gates">Regression gates</h2><ul>${gateItems}</ul></section>
  </main>
</body>
</html>`;
}
