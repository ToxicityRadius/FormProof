# Clean-environment reproduction guide

These commands are for Windows PowerShell. The repository contains synthetic fixtures and the recorded benchmark ledger; no private or production data is required.

## Tested environment

- Windows 11
- Node.js `22.15.0` and npm `11.12.1`; Node.js `22.12+` is required for all included fixtures
- Codex CLI `0.151.0-alpha.7.2`, authenticated to a plan with available usage
- Playwright `1.62.1`, `@axe-core/playwright` `4.13.0`, TypeScript `7.0.2`, and Vitest `4.1.11`
- Git and internet access for the initial clone, package install, Chromium download, and live Codex repair

No environment variables or API keys are required. FormProof uses the authenticated Codex CLI, so live repair and benchmark commands consume the user's Codex plan allowance but do not create a separate OpenAI API charge.

## Setup from a clean machine

```powershell
git clone https://github.com/ToxicityRadius/FormProof.git
Set-Location FormProof
npm ci
npx playwright install chromium
npm run build
```

Expect `dist/cli.js` after the build. Package and Chromium installation usually take a few minutes depending on the network; the verified local build takes about two seconds.

## Reproduce one FormProof solution

Start the synthetic error-state fixture in terminal 1:

```powershell
npm run fixture:static-state
```

In terminal 2, capture the baseline:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4183 `
  --source fixtures/static-error-state `
  --out .formproof/runs/static-state-demo
```

Expect one `aria-valid-attr-value` finding mapped to `fixtures/static-error-state/index.html`, plus `before.json`, `before.png`, `repair-prompt.md`, `decision.json`, and `report.html`. Review those files before authorizing an edit.

Run the approved repair:

```powershell
node dist/cli.js repair `
  --evidence .formproof/runs/static-state-demo/before.json `
  --approve `
  --test "node regression.mjs"
```

Expect a minimal source patch, zero remaining or new automated violations, a passing invalid-to-valid browser regression, and `VERIFIED_FIXED`. A live run modifies the synthetic fixture; use a disposable clone if the original checkout must remain clean. The recorded representative FormProof run took about 2.7 minutes, although Codex time varies.

## Reproduce the simple baseline and paired evaluation

The Direct baseline receives only [`benchmark/direct-prompt.md`](../benchmark/direct-prompt.md), the local URL, and the regression command. FormProof receives the scanned evidence, mapped source candidates, target rule IDs, and the same regression command after a human approval checkpoint.

The submitted ledger must not be overwritten. To run a fresh representative pair, use a separate checkout of the exact frozen protocol commit:

```powershell
git worktree add ..\FormProof-evaluation 3d3487d5b7bb68ab7dac15e847691e0e95d6b6f8
Set-Location ..\FormProof-evaluation
npm ci
npx playwright install chromium
npm run benchmark:case:dry-run -- static-state-01
npm run benchmark:case -- static-state-01
npm run benchmark:summary
```

The case command creates isolated Direct and FormProof workspaces, runs each condition once, and appends the outcomes to `benchmark/results.json`. On the submitted run, Direct took about 5.2 minutes and FormProof about 2.7 minutes for this pair; both changed two lines, introduced no new automated violation, passed the regression, and returned `VERIFIED_FIXED`. A fresh run consumes Codex plan usage and may differ because the agent service is nondeterministic.

## Reproduce the submitted evaluation without new agent usage

```powershell
npm run benchmark:summary
```

Expect `reportable: true`, no missing runs, Direct `Macro-VBRR@1` of `0.3333`, FormProof `0.25`, and a mechanical difference of `-8.33` percentage points. This is an infrastructure-limited first-run result, not a clean capability comparison: usage exhaustion affected 17 of 24 rows. The checked-in 24-row run took about 37.2 minutes wall-clock in total.

## Verify the project

```powershell
npm run typecheck
npm test
npm run test:coverage
npm run build
npm audit --audit-level=high
```

The original submission checkpoint passed 102 tests, typecheck, build, and the dependency audit with zero known vulnerabilities. The post-benchmark reliability fixes passed 107 tests, typecheck, and build; they are not part of the frozen evaluation, and its protocol, results, fixtures, and evidence remain unchanged. Automated checks do not establish WCAG conformance; representative assistive-technology review remains a qualified-human responsibility.
