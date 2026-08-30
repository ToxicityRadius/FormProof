# Formal benchmark results

## Recorded result

The corrected protocol froze commit `3d3487d5b7bb68ab7dac15e847691e0e95d6b6f8`, disabled Codex memory, and recorded all 24 first attempts. The summary is structurally reportable:

| Metric | Direct | FormProof |
| --- | ---: | ---: |
| Macro-VBRR@1 | 33.33% | 25.00% |
| Failed regression rows | 5 | 6 |
| New-violation rows | 0 | 0 |

The mechanical difference is **-8.33 percentage points** for FormProof.

## Validity limitation

This is not a clean capability comparison. Codex usage was exhausted during `react-semantics-01/formproof`; 11 rows then recorded explicit agent errors and the six Flask rows completed with zero tokens and no patch. The affected rows remain in the ledger because the frozen protocol forbids rerunning or overwriting first attempts.

Only seven rows completed normal agent work before exhaustion: all six Static rows and `react-semantics-01/direct`. React FormProof also encountered a sandboxed Chromium `EPERM` before the usage-limit failure. Report the aggregate metric as an infrastructure-limited first-run result, not evidence that either repair method is generally superior.

## Representative case

Use `static-state-01` in the written analysis and video. Both conditions completed before the incident, made two-line repairs, produced zero new automated rules, passed the dynamic error-state regression, and reached `VERIFIED_FIXED`. Sanitized evidence is under [`evidence/formal/static-state-01`](../evidence/formal/static-state-01/).
