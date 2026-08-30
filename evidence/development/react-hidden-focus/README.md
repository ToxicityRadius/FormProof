# React hidden-focus repair evidence

This package is the tracked, reviewable record of FormProof's first React keyboard/focus benchmark repair. The experiment used React 19.2.7 and Vite 8.2.2. Its component places a dormant legacy action inside an `aria-hidden` container while incorrectly leaving the button in the Tab sequence, and its Playwright regression requires the action to remain in the DOM but be skipped before activating React's visible save action entirely from the keyboard.

## Result

- Adapter: `react`
- Targeted axe rule: `aria-hidden-focus`
- Impact: serious
- Before: one rule affecting one node
- High-confidence source mapping: `src/App.tsx`
- Source repair: added `disabled` to `#legacy-export`
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
| `decision.json` | Evidence-gate result and Playwright keyboard regression outcome |
| `repair-prompt.md` | Exact scoped prompt supplied to the repair agent |
| `repair.diff` | Minimal source-level patch; reverse-applicable to reconstruct the baseline |
| `agent-summary.md` | Agent's final repair summary |
| `representative-trajectory.jsonl` | Decision-relevant Codex events in JSONL format |
| `report.html` | Human-readable before/after evidence report |
| `provenance.json` | Run identifiers, sanitization record, and SHA-256 hashes |

## Sanitization and provenance

The tracked copies replace the absolute repository root with `<FORMPROOF_REPO>`, the Windows user directory with `<USER_HOME>`, and the local Codex thread identifier with `<REDACTED_THREAD_ID>`. The representative trajectory retains agent messages, the component change, regression execution, source diagnostics, and token usage; environment-specific skill and memory reads were omitted because they do not affect the repair decision.

The raw screenshots and full unsanitized trajectory remain in the ignored local run directory. SHA-256 values in `provenance.json` cover the tracked sanitized artifacts.

## Reproduction boundary

Repository commit `72748b384fb9b9e86a576709d5720fd76ab8a173` is the clean state before this React keyboard/focus fixture and experiment were added. After checking out the completed milestone, reverse-apply `repair.diff` to reconstruct the exact hidden-focus barrier, then use the React keyboard/focus commands in the root README to repeat the experiment in a disposable worktree.
