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

The public manifest is [benchmark/cases.json](../benchmark/cases.json). Each stack family receives semantics/name, keyboard/focus, and dynamic-state/error cases. Thirteen of the 15 frozen cases are implemented: semantics/name and keyboard/focus fixtures for Static, React, Vue, Angular, and Flask, plus the Static, React, and Vue dynamic-state/error fixtures. The remaining Flask and Angular dynamic-state/error cases stay explicit pending work rather than being counted as completed results.

## Reporting rules

- Report every case, including failures and timeouts.
- Separate planned thresholds from observed results.
- Preserve the direct-prompt and FormProof trajectories.
- Include one challenging case in the video and written analysis.
- Do not call an axe score a WCAG conformance result.
