# Static error-state formal evidence

This is the sanitized representative pair for the frozen `static-state-01` first attempt. Both Direct Codex and FormProof removed the targeted `aria-valid-attr-value` barrier without introducing a new automated rule, and both passed the invalid-to-valid submission regression.

| Condition | Decision | New rules | Regression | Patch lines |
| --- | --- | ---: | --- | ---: |
| [Direct](direct/) | `VERIFIED_FIXED` | 0 | Passed | 2 |
| [FormProof](formproof/) | `VERIFIED_FIXED` | 0 | Passed | 2 |

The frozen evaluated source commit is `3d3487d5b7bb68ab7dac15e847691e0e95d6b6f8`. Artifact hashes and sanitization details are recorded in each condition's `provenance.json`.
