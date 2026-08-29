# Evaluation protocol

## Research comparison

Compare a single direct repair prompt with the FormProof workflow using the same Codex model, repository copies, cases, tool access, and time or token cap. Freeze case sources and grader hashes before either condition runs. Do not expose private grader assertions to the repair agent.

## Primary metric

`Macro-VBRR@1` is the macro-average of first-attempt Verified Barrier Resolution Rate across stack families. A barrier counts as resolved only when:

1. The targeted automated barrier is absent after repair.
2. No new automated violation rule appears.
3. Every configured functional regression command passes.
4. The case does not require a human judgment that automation cannot establish.

## Secondary metrics

- New automated violation rate
- Failed regression-gate rate
- Correct human-review referral rate
- Median wall-clock time
- Codex token or usage information when available in the JSONL trajectory
- Patch size

## Frozen cases

The public manifest is [benchmark/cases.json](../benchmark/cases.json). Each stack family receives semantics/name, keyboard/focus, and dynamic-state/error cases. All 15 frozen cases are implemented across Static, React, Vue, Angular, and Flask. A case is counted as completed only when its tracked experiment records `VERIFIED_FIXED` with zero new automated violations and a passing regression gate.

## Reporting rules

- Report every case, including failures and timeouts.
- Separate planned thresholds from observed results.
- Preserve the direct-prompt and FormProof trajectories.
- Include one challenging case in the video and written analysis.
- Do not call an axe score a WCAG conformance result.

Record only frozen first attempts in `benchmark/results.json`, then run:

```powershell
npm run benchmark:summary
```

The command returns `reportable: false` and a complete missing-run list until both conditions have one first-attempt result for every frozen case. It reports `Macro-VBRR@1` and the secondary regression, timing, token, and patch-size summaries only after all 30 required runs are present. Development repairs and pilot runs must not be copied into the final ledger.
