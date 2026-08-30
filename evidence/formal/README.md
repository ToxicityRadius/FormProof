# Formal benchmark evidence

The frozen benchmark recorded all 24 first attempts in [`benchmark/results.json`](../../benchmark/results.json). Raw trajectories remain private under the ignored `.formproof` directory.

The representative case is [`static-state-01`](static-state-01/), selected because both conditions completed before the later Codex usage-limit incident and independently reached `VERIFIED_FIXED` with passing dynamic error-state regressions:

- [`direct`](static-state-01/direct/) — sanitized baseline, repair evidence, decision, agent summary, trajectory, and provenance hashes.
- [`formproof`](static-state-01/formproof/) — the same evidence plus the scoped repair prompt and HTML report.

See [`docs/RESULTS.md`](../../docs/RESULTS.md) before interpreting the aggregate score. Seventeen later rows were affected by exhausted Codex usage or zero-token agent completion and are preserved as first attempts rather than silently rerun.
