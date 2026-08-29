# Improvement changelog

This file records retained changes and discarded experiments so the final competition submission can explain why each agent capability exists.

## 0.1.0 — benchmark-first vertical slice

### Retained

- One primary Codex repair agent plus deterministic browser and regression gates.
- A stack-neutral evidence contract with replaceable source adapters.
- Static HTML, React/Next.js, Vue/Nuxt, Angular, and Flask/Jinja adapter detection.
- Explicit `--approve` gating before any Codex-written patch.
- `codex exec --json` trajectory capture under `workspace-write` sandboxing.
- `VERIFIED_FIXED`, `REGRESSION_BLOCKED`, and `HUMAN_REVIEW_REQUIRED` outcomes.
- Standalone HTML and JSON evidence artifacts for reproduction and judging.

### Verified experiments

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

### Removed or deferred

- **OpenAI API runtime:** removed from the first build to avoid separate API credentials and usage costs.
- **Multi-agent repair debate:** removed because additional agents do not prove reliability; deterministic verification is the acceptance authority.
- **Full dashboard:** deferred until the CLI and evidence contract pass the frozen benchmark.
- **Remaining dynamic-state/error fixture:** the Angular port remains planned after validating the pattern in Static HTML, React, Vue, and Flask.
- **Axe incomplete/manual-review findings:** deferred to a separate evidence-contract change so uncertain results are surfaced without being counted as confirmed violations.
- **Automatic remote deployment:** excluded because a repair should not publish consequential changes without a separate human-controlled release process.

### Failures that changed the implementation

- Vite 8.0.10 reported a high-severity Windows `server.fs.deny` path-bypass advisory during the React fixture install. The fixture is pinned to the non-major patched release 8.2.2 and its audit returns zero vulnerabilities.

- The first real repair exposed a Codex CLI conflict: `--approve-for-me` cannot be combined with an explicit `--sandbox workspace-write`. The runner now uses `--approve-for-me` alone because it already routes execution through the workspace-write approval path.

- Playwright and axe initially installed incompatible `playwright-core` versions. The dependency was aligned before browser work continued.
- Windows `file:` URL paths initially retained percent encoding and caused adapter detection to return `unknown`. Root normalization now decodes and resolves Windows paths before scanning.
- The sandbox blocked Vitest's compiler subprocess. Verification commands now document when the local test runner needs its normal process permissions.
- Flask's non-debug template cache initially made the immediate after-scan report the already-repaired label as unresolved. The fixture now enables Jinja template auto-reload, and the clean single-run experiment records the edit and `VERIFIED_FIXED` decision together.
- The Flask regression launcher originally hid a sandbox-blocked child process as `undefinedundefined`. It now reports the underlying spawn error while preserving the same unit and browser checks.
- The reusable evidence exporter initially retained only commands containing `regression.mjs`, which omitted package-script gates such as `npm run regression`. Its representative-trajectory filter now retains either form.
- Angular 22.1 required Node 22.22.3 or newer, but the experiment host runs Node 22.15.0. The fixture was moved to the newest compatible Angular 21.2.22 release line with TypeScript 5.9.3; its production build and package audit pass without engine warnings or known vulnerabilities.
- Positive `tabindex` was rejected for the keyboard/focus benchmark because axe classifies it as a best-practice rule outside FormProof's frozen WCAG tag set.
- `scrollable-region-focusable` was rejected because the installed Chromium automatically made the test scroller keyboard-focusable, so neither the browser regression nor axe could reproduce a barrier.
- `bypass` was rejected for automatic repair because axe returned it as incomplete/manual-review evidence rather than a confirmed violation. The retained `aria-hidden-focus` case fails independently in axe and the browser Tab sequence.
