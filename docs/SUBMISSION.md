# Submission runbook

## Current status

- [x] Corrected protocol frozen at `3d3487d5b7bb68ab7dac15e847691e0e95d6b6f8`.
- [x] All 24 first attempts preserved and committed separately.
- [x] Summary generated and infrastructure limitation documented in [RESULTS.md](RESULTS.md).
- [x] Representative Direct/FormProof trajectories sanitized for `static-state-01`.
- [x] Reproduction guide, changelog, and [disclosure inventory](DISCLOSURES.md) present.
- [x] Dashboard fields confirmed: title, formatted description, video URL, and source ZIP no larger than 50 MB.
- [x] Trajectory requirement confirmed without a mandated container format; sanitized JSONL, prompts, summaries, tool responses, retries, and the approval checkpoint are included.
- [ ] Record and host the five-minute video.
- [ ] Upload the final source ZIP and paste the title, description, and video URL.

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

## Five-minute video script

Use the valid `static-state-01` pair; do not use an infrastructure-failed React, Vue, or Flask row as the product demonstration.

| Time | Screen | Narration target |
| --- | --- | --- |
| 0:00–0:35 | The synthetic invalid-email form, then the README opening | Solo developers can find accessibility warnings, but locating the source, constraining an AI edit, and proving behavior still works is the bottleneck. |
| 0:35–1:00 | `benchmark/direct-prompt.md` and the Direct trajectory | The simple baseline gives Codex the page, a broad repair instruction, and the same regression command, without FormProof's evidence package or approval boundary. |
| 1:00–1:35 | Run or replay `inspect`; show `before.json`, screenshot, and `#email` mapped to `index.html` | FormProof freezes one critical `aria-valid-attr-value` finding and maps the rendered element to a high-confidence source candidate. |
| 1:35–2:00 | `repair-prompt.md`, then pause on `--approve` | Repository text and evidence are treated as untrusted. The developer reviews the target, prompt, and source scope before the agent can edit. |
| 2:00–2:45 | Run or replay `repair --approve --test "node regression.mjs"`; show the two-line diff and trajectory tool events | The agent makes the smallest patch. FormProof then rescans independently and runs the existing invalid-to-valid browser flow. |
| 2:45–3:15 | `decision.json` and `report.html` | The target is absent, no new automated rule appeared, the regression passed, and the result is `VERIFIED_FIXED`; this is evidence, not WCAG certification. |
| 3:15–3:45 | Representative pair README or both decisions | In this valid pair, Direct and FormProof both changed two lines and passed. Direct took about 5.2 minutes; FormProof took about 2.7 minutes. One case is illustrative, not a general superiority claim. |
| 3:45–4:15 | Improvement Changelog: mandatory regression gate and Angular blocked attempt | The biggest improvement was requiring a regression command. It caught a repair that cleared axe but initially failed the asynchronous browser behavior, preventing a false `VERIFIED_FIXED`. |
| 4:15–4:35 | Changelog removed/deferred section | The multi-agent repair debate was removed: more agent opinions add cost but do not prove correctness; deterministic checks are the acceptance authority. |
| 4:35–4:50 | `npm run benchmark:summary` and `docs/RESULTS.md` | Show Direct 33.33% and FormProof 25.00%, then immediately disclose that usage exhaustion affected 17 rows, so this is an infrastructure-limited ledger. |
| 4:50–5:00 | `docs/REPRODUCTION.md`, trajectories, and disclosures | Close with the exact clean-machine commands, synthetic-data statement, human-review boundary, and repository link. |

Record at 1080p with the terminal and text enlarged enough to read. Prefer a rehearsed artifact replay over rerunning the frozen benchmark; the representative package already preserves the actual prompts, tool responses, retry context, approval checkpoint, diff, and decisions.

## Final package

- Repository or archive at the exact evaluated commit
- README reproduction steps and Node/Chromium/Codex requirements
- Improvement changelog, including discarded experiments
- Completed comparison ledger and generated summary
- Up-to-five-minute video
- Accepted representative trajectory files in the organizer's required format
- AI, dependency, third-party material, and background-IP disclosures
- Final secret and personal-path review

## Confirmed dashboard fields

- Required title
- Required formatted description with links
- Required video URL; no additional video rule beyond the challenge's five-minute maximum
- Required source-code upload, maximum 50 MB

The challenge text asks for representative trajectories for every agent but does not prescribe a file container. The tracked Direct and FormProof JSONL packages therefore remain the submission format unless the organizer supplies a later clarification.
