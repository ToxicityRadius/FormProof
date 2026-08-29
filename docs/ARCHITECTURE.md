# Architecture

FormProof separates probabilistic repair from deterministic acceptance.

```text
local app + source
        |
        v
Playwright + axe scan -----> normalized evidence contract
        |                              |
        |                              v
        |                     framework source adapter
        |                              |
        v                              v
frozen before.json ------------> scoped repair prompt
                                       |
                              human --approve gate
                                       |
                                       v
                            sandboxed codex exec run
                                       |
                                       v
                           rescan + regression command
                                       |
                                       v
                VERIFIED_FIXED / REGRESSION_BLOCKED /
                       HUMAN_REVIEW_REQUIRED
```

## Trust boundaries

- The target repository and rendered page are untrusted input.
- Only the human-selected repository is writable.
- Codex runs through `--approve-for-me`, which enforces the approval-reviewed `workspace-write` path. FormProof never combines it with the mutually exclusive explicit `--sandbox` option or enables the dangerous sandbox bypass.
- `--test` is a local shell command supplied by the operator and must be reviewed as trusted input.
- Axe results are evidence for machine-testable rules, not proof of complete accessibility.
- New violations or failed regression commands block acceptance.

## Adapter contract

Adapters detect a source family and define the source extensions used for candidate mapping. The scanner is framework-neutral because it evaluates rendered browser output. Current reference adapters are:

| Adapter | Detection evidence | Source types |
|---|---|---|
| Static HTML | `.html` or `.htm` files | HTML |
| React / Next.js | `react` or `next` package dependency | TSX, JSX, TS, JS, HTML |
| Vue / Nuxt | `vue` or `nuxt` package dependency | Vue SFC, TS, JS, HTML |
| Flask / Jinja | Flask dependency metadata | HTML, Jinja, Python |

Candidate mapping uses stable rendered identifiers such as `id` and `name`. A candidate is advisory: Codex must still inspect the source and the verification gates decide whether its patch is accepted.

## Evidence artifacts

| Artifact | Purpose |
|---|---|
| `before.json` | Frozen baseline scan |
| `before.png` | Visible baseline state |
| `repair-prompt.md` | Exact scoped instruction sent to Codex |
| `trajectory.jsonl` | Machine-readable Codex events |
| `agent-summary.txt` | Codex final message |
| `after.json` | Post-repair scan |
| `after.png` | Visible post-repair state |
| `decision.json` | Gate inputs and final status |
| `report.html` | Human-readable evidence package |
