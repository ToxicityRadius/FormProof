# Static HTML repair evidence

This package is the tracked, reviewable record of FormProof's first successful end-to-end repair. It is derived from the local run at `.formproof/runs/first-repair` and is anchored to baseline commit `23b4a118c7e85e8374af42493382f558a08e7e4a`.

## Result

- Adapter: `static`
- Targeted axe rule: `label`
- Before: one critical rule affecting one node
- Source repair: added `<label for="email">Email</label>`
- After: zero automated violations
- New violations: zero
- Regression gate: passed
- Decision: `VERIFIED_FIXED`

This is evidence for the tested automated rule and regression command. It is not a WCAG conformance certificate.

## Artifacts

| File | Purpose |
| --- | --- |
| `before.json` | Frozen pre-repair axe evidence and source mapping |
| `after.json` | Independent post-repair browser scan |
| `decision.json` | Evidence-gate result and regression outcome |
| `repair-prompt.md` | Exact scoped prompt supplied to the repair agent |
| `repair.diff` | Minimal source-level patch |
| `agent-summary.md` | Agent's final repair summary |
| `representative-trajectory.jsonl` | Decision-relevant Codex events in JSONL format |
| `report.html` | Human-readable before/after evidence report |
| `provenance.json` | Run identifiers, sanitization record, and SHA-256 hashes |

## Sanitization and provenance

The tracked copies replace the absolute repository root with `<FORMPROOF_REPO>`, the Windows user directory with `<USER_HOME>`, and the local Codex thread identifier with `<REDACTED_THREAD_ID>`. The representative trajectory retains agent messages, the source change, regression execution, diff verification, and token usage; environment-specific skill and memory reads were omitted because they contain workstation paths and do not affect the repair decision.

The raw screenshots and full unsanitized trajectory remain in the ignored local run directory. SHA-256 values in `provenance.json` cover the tracked sanitized artifacts.

## Reproduction boundary

The inaccessible fixture is preserved by baseline commit `23b4a11`. The successful repair also includes the runner compatibility correction documented in the project changelog: `--approve-for-me` is used without the mutually exclusive explicit `--sandbox` flag. Run the commands in the repository README against a disposable copy or worktree when reproducing the before-to-after experiment.
