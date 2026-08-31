# Improvement changelog

This file records retained changes and discarded experiments so the final competition submission can explain why each agent capability exists.

## Evidence-linked iteration ledger

| Iteration | Evidence that guided the next decision | Decision |
| --- | --- | --- |
| Evidence-gated MVP (`23b4a11`) | The [architecture contract](docs/ARCHITECTURE.md) separated automated evidence from human judgment. | Keep one repair agent behind explicit approval, then let deterministic verification decide the outcome. |
| First Static repair (`c01ee0b`) | The [Static semantics package](evidence/development/static-label/) reached `VERIFIED_FIXED` with a minimal patch. | Retain the evidence schema and test whether source mapping transfers across stacks. |
| Cross-stack semantics (`53ce433`–`bfecbb0`) | React, Flask, Vue, and Angular packages under [development evidence](evidence/development/) independently passed their regressions. | Keep stack adapters thin and reuse the same evidence contract. |
| Keyboard/focus expansion (`72748b3`–`22b43d2`) | Five `*-hidden-focus` packages confirmed the barrier through both axe and browser Tab behavior. Rejected candidates were not reproducible in both. | Retain `aria-hidden-focus`; reject positive `tabindex`, `scrollable-region-focusable`, and incomplete `bypass` evidence. |
| Dynamic-state expansion (`a7a6bb2`–`eecf6ff`) | Five `*-error-state` packages tested invalid-to-valid behavior. The first Angular attempt cleared axe but was [regression blocked](evidence/development/angular-error-state/). | Make the regression command mandatory and wait for observable UI state before accepting the repair. |
| Fair-comparison gate (`7d88c28`) | Development experiments were produced while the protocol changed, so they could not support a fair aggregate claim. | Separate development evidence from a frozen formal ledger and withhold metrics until all 24 rows exist. |
| Formal harness and pilot (`fc3457f`–`ffcb061`) | The [pilot ledger](benchmark/pilot-results.json) exposed protocol and command-line issues before scoring. | Preserve the pilot separately and run each condition once in isolated copies. |
| Memory-isolation correction (`3d3487d`) | The pilot Direct agent could inherit unrelated global memory, violating condition isolation. | Disable Codex memory for both conditions, freeze a new protocol, and restart the official ledger empty. |
| Formal first attempts (`af826d7`) | The [24-row ledger](benchmark/results.json) preserved usage exhaustion and sandbox failures instead of hiding them. | Do not rerun failures; label the aggregate infrastructure-limited. |
| Representative export (`ea734eb`) | Only `static-state-01` completed normally in both conditions and passed the same behavioral gate. | Export its sanitized [Direct and FormProof evidence](evidence/formal/static-state-01/) for the video and trajectory review. |

## Post-benchmark reliability fixes

- Reject unsuccessful HTTP responses (or missing responses) before scanning, so an error page cannot stand in for a repaired application.
- Invalidate previous repair decisions and reports before agent execution, remove stale after-scan artifacts, and record agent or verification exceptions as `HUMAN_REVIEW_REQUIRED` while preserving the command failure.
- These fixes have dedicated regression tests and do not change the frozen protocol, results, or retained benchmark evidence.

## 0.1.0 — benchmark-first vertical slice

### Retained

- The frozen benchmark preserves all 24 first attempts, including infrastructure failures; `static-state-01` is exported as the valid sanitized representative pair.
- Formal benchmark agents now run with Codex global memory disabled; the pre-correction `static-semantics-01` pair is retained only as a protocol pilot and the official ledger restarts empty.
- `repair` now requires a regression command and rejects empty or unknown target rule IDs, so `VERIFIED_FIXED` cannot be produced without evidence for the requested repair.
- A benchmark summary gate withholds `Macro-VBRR@1` and secondary metrics until all 24 formal first-attempt results are present.
- `inspect` persists its `HUMAN_REVIEW_REQUIRED` decision even when automation finds no violations, making the abstention boundary reviewable.
- One primary Codex repair agent plus deterministic browser and regression gates.
- A stack-neutral evidence contract with replaceable source adapters.
- Static HTML, React/Next.js, Vue/Nuxt, Angular, and Flask/Jinja adapter detection.
- Explicit `--approve` gating before any Codex-written patch.
- `codex exec --json` trajectory capture under `workspace-write` sandboxing.
- `VERIFIED_FIXED`, `REGRESSION_BLOCKED`, and `HUMAN_REVIEW_REQUIRED` outcomes.
- Standalone HTML and JSON evidence artifacts for reproduction and judging.

### Development experiments

These 15 experiments were completed while the fixtures and protocol were still changing. They remain useful implementation evidence but are excluded from the 12-case formal benchmark.

- Static HTML `label` repair: `VERIFIED_FIXED` with zero new automated violations and a passing structural regression gate.
- React `label` repair: `VERIFIED_FIXED` with zero new automated violations and a passing Playwright submission-flow regression gate.
- Flask/Jinja `label` repair: `VERIFIED_FIXED` with zero new automated violations and a passing Flask integration plus Playwright submission-flow regression gate.
- Vue `label` repair: `VERIFIED_FIXED` with zero new automated violations and a passing Playwright submission-flow regression gate.
- Angular `label` repair: `VERIFIED_FIXED` with zero new automated violations and a passing Playwright submission-flow regression gate.
- Static HTML `aria-hidden-focus` repair: `VERIFIED_FIXED` with zero new automated violations and a passing Playwright hidden-focus plus keyboard-save regression gate.
- React `aria-hidden-focus` repair: `VERIFIED_FIXED` with high-confidence `src/App.tsx` mapping, zero new automated violations, and a passing Playwright hidden-focus plus keyboard-save regression gate.
- Vue `aria-hidden-focus` repair: `VERIFIED_FIXED` with high-confidence `src/App.vue` mapping, zero new automated violations, and a passing Playwright hidden-focus plus keyboard-save regression gate.
- Flask/Jinja `aria-hidden-focus` repair: `VERIFIED_FIXED` with high-confidence `templates/index.html` mapping, zero new automated violations, and passing Flask integration plus Playwright hidden-focus and keyboard-save regression gates.
- Angular `aria-hidden-focus` repair: `VERIFIED_FIXED` with high-confidence `src/app/app.html` mapping, zero new automated violations, and a passing Playwright hidden-focus plus keyboard-save regression gate.
- Static HTML `aria-valid-attr-value` repair: `VERIFIED_FIXED` with high-confidence `index.html` mapping, a one-attribute error association, zero new automated violations, and a passing invalid-to-valid submission regression gate.
- React `aria-valid-attr-value` repair: `VERIFIED_FIXED` with high-confidence `src/App.tsx` mapping, a one-attribute live error repair, zero new automated violations, and a passing invalid-to-valid submission regression gate.
- Vue `aria-valid-attr-value` repair: `VERIFIED_FIXED` with high-confidence `src/App.vue` mapping, a one-attribute live error repair, zero new automated violations, and a passing invalid-to-valid submission regression gate.
- Flask/Jinja `aria-valid-attr-value` repair: `VERIFIED_FIXED` with high-confidence template mapping, a one-attribute error association, zero new automated violations, and passing integration plus invalid-to-valid browser regression gates.
- Angular `aria-valid-attr-value` repair: `VERIFIED_FIXED` with high-confidence `src/app/app.html` mapping, a one-attribute live error repair, zero new automated violations, and a passing asynchronous invalid-to-valid regression gate.

### Removed or deferred

- **OpenAI API runtime:** removed from the first build to avoid separate API credentials and usage costs.
- **Multi-agent repair debate:** removed because additional agents do not prove reliability; deterministic verification is the acceptance authority.
- **Full dashboard:** deferred until the CLI and evidence contract pass the frozen benchmark.
- **Axe incomplete/manual-review findings:** deferred to a separate evidence-contract change so uncertain results are surfaced without being counted as confirmed violations.
- **Automatic remote deployment:** excluded because a repair should not publish consequential changes without a separate human-controlled release process.
- **Angular formal cases:** removed from the scored benchmark to keep the 12-case comparison focused on the four stacks most representative of the solo-developer audience. Angular support and development evidence remain in the repository.

### Failures that changed the implementation

- Codex usage was exhausted during the formal sequence. Eleven rows recorded explicit agent errors and six later Flask rows completed with zero tokens; the ledger is preserved unchanged and the aggregate score is labeled infrastructure-limited rather than treated as a clean capability comparison.
- The formal React FormProof attempt exposed sandboxed Chromium `EPERM` inside the repair agent. The failure remains part of the frozen first attempt and is not silently retried.

- Vite 8.0.10 reported a high-severity Windows `server.fs.deny` path-bypass advisory during the React fixture install. The fixture is pinned to the non-major patched release 8.2.2 and its audit returns zero vulnerabilities.

- The first real repair exposed a Codex CLI conflict: `--approve-for-me` cannot be combined with an explicit `--sandbox workspace-write`. The runner now uses `--approve-for-me` alone because it already routes execution through the workspace-write approval path.

- Playwright and axe initially installed incompatible `playwright-core` versions. The dependency was aligned before browser work continued.
- Windows `file:` URL paths initially retained percent encoding and caused adapter detection to return `unknown`. Root normalization now decodes and resolves Windows paths before scanning.
- The sandbox blocked Vitest's compiler subprocess. Verification commands now document when the local test runner needs its normal process permissions.
- Flask's non-debug template cache initially made the immediate after-scan report the already-repaired label as unresolved. The fixture now enables Jinja template auto-reload, and the clean single-run experiment records the edit and `VERIFIED_FIXED` decision together.
- The Flask regression launcher originally hid a sandbox-blocked child process as `undefinedundefined`. It now reports the underlying spawn error while preserving the same unit and browser checks.
- The reusable evidence exporter initially retained only commands containing `regression.mjs`, which omitted package-script gates such as `npm run regression`. Its representative-trajectory filter now retains either form.
- Angular 22.1 required Node 22.22.3 or newer, but the experiment host runs Node 22.15.0. The fixture was moved to the newest compatible Angular 21.2.22 release line with TypeScript 5.9.3; its production build and package audit pass without engine warnings or known vulnerabilities.
- The first Angular error-state repair cleared axe but was correctly `REGRESSION_BLOCKED` because the browser gate inspected bound state before Angular rendered the success update. The gate now waits for the exact success text before checking cleared error state, and a fresh baseline-to-repair run records `VERIFIED_FIXED`.
- Positive `tabindex` was rejected for the keyboard/focus benchmark because axe classifies it as a best-practice rule outside FormProof's frozen WCAG tag set.
- `scrollable-region-focusable` was rejected because the installed Chromium automatically made the test scroller keyboard-focusable, so neither the browser regression nor axe could reproduce a barrier.
- `bypass` was rejected for automatic repair because axe returned it as incomplete/manual-review evidence rather than a confirmed violation. The retained `aria-hidden-focus` case fails independently in axe and the browser Tab sequence.

## Main failure mode and hot take

The main failure mode was evaluation infrastructure, not an observed accessibility regression: Codex usage was exhausted partway through the frozen sequence, affecting 17 of 24 rows and making the aggregate unsuitable as a clean capability comparison. The ledger keeps those first attempts unchanged so the limitation remains auditable.

**Hot take:** a convincing agent patch is not evidence. A smaller system that can abstain, requires human approval, and refuses `VERIFIED_FIXED` without an independent rescan and behavioral regression is more useful than adding another planning or reviewer agent.
