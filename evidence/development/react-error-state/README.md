# React error-state repair evidence

This package is the tracked, reviewable record of FormProof's React dynamic-state/error benchmark repair. The fixture begins with a visible invalid email state whose `aria-errormessage` target is not exposed through an accepted announcement technique. Its browser regression preserves that state, then verifies correction, error clearing, and success announcement.

## Result

- Adapter: `react`
- Targeted axe rule: `aria-valid-attr-value`
- Impact: critical
- Before: one rule affecting one node
- High-confidence source mapping: `src/App.tsx`
- Source repair: added `role="alert"` to `#email-error`
- After: zero automated violations
- New violations: zero
- Regression gate: passed
- Decision: `VERIFIED_FIXED`

This is evidence for the tested automated rule and regression command. It is not a WCAG conformance certificate.

## Artifacts

| File | Purpose |
| --- | --- |
| `before.json` | Frozen pre-repair axe evidence and React source mapping |
| `after.json` | Independent post-repair browser scan |
| `decision.json` | Evidence-gate result and invalid-to-valid browser regression outcome |
| `repair-prompt.md` | Exact scoped prompt supplied to the repair agent |
| `repair.diff` | Minimal source-level patch; reverse-applicable to reconstruct the baseline |
| `agent-summary.md` | Agent's final repair summary |
| `representative-trajectory.jsonl` | Decision-relevant Codex events in JSONL format |
| `report.html` | Human-readable before/after evidence report |
| `provenance.json` | Run identifiers, sanitization record, and SHA-256 hashes |

## Sanitization and provenance

The tracked copies replace the absolute repository root with `<FORMPROOF_REPO>`, the Windows user directory with `<USER_HOME>`, and the local Codex thread identifier with `<REDACTED_THREAD_ID>`. The representative trajectory retains agent messages, the one-attribute source change, regression execution, source diagnostics, and token usage; environment-specific skill and memory reads were omitted because they do not affect the repair decision.

The raw screenshots and full unsanitized trajectory remain in the ignored local run directory. SHA-256 values in `provenance.json` cover the tracked sanitized artifacts.

## Reproduction boundary

Repository commit `a7a6bb2f49bd2c256b1491634573059a2425f9b5` is the clean state before this React error-state fixture and experiment were added. After checking out the completed milestone, reverse-apply `repair.diff` to reconstruct the exact error-announcement barrier, then use the React error-state commands in the root README to repeat the experiment in a disposable worktree.
