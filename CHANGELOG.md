# Improvement changelog

This file records retained changes and discarded experiments so the final competition submission can explain why each agent capability exists.

## 0.1.0 — benchmark-first vertical slice

### Retained

- One primary Codex repair agent plus deterministic browser and regression gates.
- A stack-neutral evidence contract with replaceable source adapters.
- Static HTML, React/Next.js, and Flask/Jinja adapter detection.
- Explicit `--approve` gating before any Codex-written patch.
- `codex exec --json` trajectory capture under `workspace-write` sandboxing.
- `VERIFIED_FIXED`, `REGRESSION_BLOCKED`, and `HUMAN_REVIEW_REQUIRED` outcomes.
- Standalone HTML and JSON evidence artifacts for reproduction and judging.

### Removed or deferred

- **OpenAI API runtime:** removed from the first build to avoid separate API credentials and usage costs.
- **Multi-agent repair debate:** removed because additional agents do not prove reliability; deterministic verification is the acceptance authority.
- **Full dashboard:** deferred until the CLI and evidence contract pass the frozen benchmark.
- **Vue and Angular source adapters:** deferred until the Static, React, and Flask reference adapters are stable.
- **Automatic remote deployment:** excluded because a repair should not publish consequential changes without a separate human-controlled release process.

### Failures that changed the implementation

- Playwright and axe initially installed incompatible `playwright-core` versions. The dependency was aligned before browser work continued.
- Windows `file:` URL paths initially retained percent encoding and caused adapter detection to return `unknown`. Root normalization now decodes and resolves Windows paths before scanning.
- The sandbox blocked Vitest's compiler subprocess. Verification commands now document when the local test runner needs its normal process permissions.
