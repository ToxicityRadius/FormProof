# Submission copy and upload manifest

## Title

FormProof: Evidence-Gated Accessibility Repair for Solo Web Developers

## Description

FormProof is a command-line workflow for solo web developers who can find accessibility warnings but need a safer way to turn them into source repairs. It captures a Playwright and axe baseline, maps rendered findings to likely source files, pauses for explicit human approval, runs one Codex repair agent in a workspace-write sandbox, rescans the application, requires a functional regression command, and exports reviewable JSON, screenshots, trajectory events, and an accessible HTML report.

The project supports Static HTML, React/Next.js, Vue/Nuxt, Angular, and Flask/Jinja. Its synthetic development suite contains 15 verified repair experiments across semantics and names, keyboard and focus, and dynamic state and errors. The formal benchmark compares a simple Direct Codex prompt with FormProof across 12 frozen cases and preserves all 24 first attempts.

The aggregate formal result is intentionally reported with its limitation: Direct recorded 33.33% Macro-VBRR@1 and FormProof 25.00%, but Codex usage was exhausted during the sequence, affecting 17 rows. This is an infrastructure-limited ledger, not evidence that either method is generally superior. The valid representative `static-state-01` pair completed normally: both conditions made two-line repairs, added no automated violation, passed the browser regression, and reached `VERIFIED_FIXED`.

The most valuable improvement was making the regression command mandatory before FormProof can report `VERIFIED_FIXED`. The project deliberately removed a proposed multi-agent repair debate because more agent opinions do not prove a repair; deterministic rescans, behavioral tests, abstention, and qualified human review provide stronger evidence.

Repository and reproduction instructions: https://github.com/ToxicityRadius/FormProof

## Upload manifest

The source ZIP contains only tracked project files. It includes:

- Full TypeScript source, tests, synthetic fixtures, lockfiles, and build instructions
- Direct baseline instruction in `benchmark/direct-prompt.md`
- FormProof repair instruction and representative Direct/FormProof JSONL trajectories under `evidence/formal/static-state-01`
- Frozen 12-case manifest, all 24 first-attempt results, and the results analysis
- Improvement Changelog, reproduction guide, disclosures, and five-minute video script

Do not add `.git`, `node_modules`, `.venv`, `.formproof`, credentials, raw private trajectories, or local machine paths to the ZIP.
