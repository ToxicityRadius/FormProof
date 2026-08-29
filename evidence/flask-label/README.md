# Flask repair evidence

This package is the tracked, reviewable record of FormProof's first Flask/Jinja repair. The experiment used Python 3.11.9 and Flask 3.1.3, with Flask test-client integration tests plus a real Playwright regression that types a display name, submits the form, and verifies the resulting status message.

## Result

- Adapter: `flask`
- Targeted axe rule: `label`
- Before: one critical rule affecting one node
- High-confidence source mapping: `templates/index.html`
- Source repair: added `<label for="display-name">Display name</label>`
- After: zero automated violations
- New violations: zero
- Regression gate: passed
- Decision: `VERIFIED_FIXED`

This is evidence for the tested automated rule and regression command. It is not a WCAG conformance certificate.

## Artifacts

| File | Purpose |
| --- | --- |
| `before.json` | Frozen pre-repair axe evidence and Flask source mapping |
| `after.json` | Independent post-repair browser scan |
| `decision.json` | Evidence-gate result and combined integration/browser regression outcome |
| `repair-prompt.md` | Exact scoped prompt supplied to the repair agent |
| `repair.diff` | Minimal source-level patch; reverse-applicable to reconstruct the baseline |
| `agent-summary.md` | Agent's final repair summary |
| `representative-trajectory.jsonl` | Decision-relevant Codex events in JSONL format |
| `report.html` | Human-readable before/after evidence report |
| `provenance.json` | Run identifiers, sanitization record, and SHA-256 hashes |

## Sanitization and provenance

The tracked copies replace the absolute repository root with `<FORMPROOF_REPO>`, the Windows user directory with `<USER_HOME>`, and the local Codex thread identifier with `<REDACTED_THREAD_ID>`. The representative trajectory retains agent messages, the source change, the initial sandbox-blocked regression, direct unit-test diagnosis, the permission-aware successful retry, final diff verification, and token usage; environment-specific skill and memory reads were omitted because they do not affect the repair decision.

The raw screenshots and full unsanitized trajectory remain in the ignored local run directory. SHA-256 values in `provenance.json` cover the tracked sanitized artifacts.

## Reproduction boundary

Repository commit `53ce433ea200d8cfb59d8b1d173a4efe120a11ad` is the clean state before the runnable Flask experiment was added. After checking out the completed milestone, reverse-apply `repair.diff` to reconstruct the exact inaccessible Jinja template, then use the Flask commands in the root README to repeat the experiment in a disposable worktree.
