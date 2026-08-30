# Evaluation protocol

## Research comparison

Compare a single direct repair prompt with the FormProof workflow using the same Codex model, repository copies, cases, tool access, disabled global memory, and time or token cap. Freeze case sources and grader hashes before either condition runs. Do not expose private grader assertions to the repair agent.

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

## Formal cases

The public manifest is [benchmark/cases.json](../benchmark/cases.json). It defines 12 cases across Static HTML, React, Vue, and Flask; each stack receives semantics/name, keyboard/focus, and dynamic-state/error cases. Angular remains supported and documented as development evidence, but it is excluded from the formal comparison to keep the benchmark representative of the solo-developer audience and feasible to reproduce.

The formal protocol is not frozen until the clean commit, manifest hash, fixture hashes, direct prompt, model, reasoning setting, disabled-memory state, and timeout are recorded. Existing packages under `evidence/development` predate that freeze and are not formal results. The first `static-semantics-01` pair is retained in `benchmark/pilot-results.json` as a protocol pilot because it ran before global memory was disabled; it is excluded from the formal ledger.

From a clean evaluated commit, freeze once and run one paired case at a time:

```powershell
npm run benchmark:freeze
npm run benchmark:case:dry-run -- static-semantics-01
npm run benchmark:case -- static-semantics-01
```

Each case command starts Direct Codex first and FormProof second from separate, byte-identical fixture-only workspaces. Setup is excluded from measured time; scanning, agent work, repair, rescan, and regression verification are included. The runner pins `gpt-5.6-sol`, medium reasoning, disables the Codex `memories` feature, and applies a 15-minute limit to each condition.

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

The command returns `reportable: false` and a complete missing-run list until both conditions have one first-attempt result for every frozen case. It reports `Macro-VBRR@1` and the secondary regression, timing, token, and patch-size summaries only after all 24 required runs are present. Development repairs and pilot runs must not be copied into the final ledger.
