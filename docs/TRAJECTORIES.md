# Trajectory handling

FormProof passes `--json` to `codex exec` and stores stdout as `trajectory.jsonl`. It also passes `--output-last-message` so the final natural-language summary is stored separately from the event stream.

For every evaluated case, preserve:

- Exact prompt
- Model and reasoning setting
- Start and end timestamps
- JSONL events
- Final message
- Commands and exit codes
- Approval decision
- Before and after evidence
- Final FormProof decision

Do not assume that a screenshot or copied chat transcript satisfies the organizer's trajectory format. Convert or package trajectories only after the organizer's accepted submission format is confirmed.

Before sharing a trajectory, inspect it for secrets, private paths, personal data, and unrelated repository content. Never place credentials in prompts or fixtures.

The tracked packages under `evidence/development` are development experiments, not formal attempts. Keep raw formal trajectories private under `.formproof` and export only sanitized representative artifacts to `evidence/formal` after all 24 first-attempt results are recorded.
