# Submission runbook

## Freeze before evaluation

- Confirm the working tree is clean and record the commit hash.
- Use `gpt-5.6-sol` with medium reasoning for every formal baseline and FormProof run.
- Require frozen metadata to record `memoryEnabled: false`; the runner must pass `--disable memories` to both conditions.
- Keep `benchmark/cases.json`, every fixture, regression command, direct prompt, model, and reasoning setting unchanged across both conditions.
- Run each of the 12 cases once with `benchmark/direct-prompt.md` and once with FormProof.
- Record every first attempt, including failures and timeouts, in `benchmark/results.json`.
- Keep protocol pilots in `benchmark/pilot-results.json`; never copy them into the formal ledger.
- Run `npm run benchmark:summary`; do not publish a primary score while it reports `reportable: false`.
- Preserve raw trajectories privately, then sanitize the representative trajectories before submission.

```powershell
npm run benchmark:freeze
npm run benchmark:case:dry-run -- static-semantics-01
npm run benchmark:case -- static-semantics-01
```

Repeat the paired case command for each manifest ID. Do not rerun or overwrite a recorded case-condition attempt.

## Five-minute demo

| Time | Show |
| --- | --- |
| 0:00–0:30 | The inaccessible local form and the user problem |
| 0:30–1:10 | `formproof inspect`, the baseline axe finding, and source-candidate mapping |
| 1:10–1:35 | The explicit approval boundary and scoped repair prompt |
| 1:35–2:35 | `formproof repair --approve --test ...` and the minimal source diff |
| 2:35–3:20 | Independent rescan, regression gate, and `VERIFIED_FIXED` report |
| 3:20–4:00 | A clean scan that remains `HUMAN_REVIEW_REQUIRED` |
| 4:00–4:35 | The 12 frozen benchmark cases and completed comparison summary |
| 4:35–5:00 | Reproduction command, limitations, and no-conformance disclaimer |

## Final package

- Repository or archive at the exact evaluated commit
- README reproduction steps and Node/Chromium/Codex requirements
- Improvement changelog, including discarded experiments
- Completed comparison ledger and generated summary
- Up-to-five-minute video
- Accepted representative trajectory files in the organizer's required format
- AI, dependency, third-party material, and background-IP disclosures
- Final secret and personal-path review

## Dashboard-only checks

Confirm the deadline and timezone, repository visibility, upload-size limits, required form fields, accepted trajectory format, video-hosting rules, and whether deployment is required in the logged-in organizer dashboard or released brief. Do not infer these values from public search results.
