# Submission disclosures

## AI use

- ChatGPT/Codex assisted with design, implementation, tests, documentation, and evaluation orchestration.
- Formal repair attempts used `gpt-5.6-sol`, medium reasoning, and disabled Codex memory; exact first-attempt events are preserved in raw JSONL trajectories.
- AI output was accepted only through axe rescans and configured functional regression gates. No result is presented as WCAG conformance.

## Third-party software

- Runtime: Node.js 22+, Playwright, and `@axe-core/playwright`.
- Synthetic fixtures: React/React DOM, Vue, Angular, Vite, Flask, and their locked transitive dependencies.
- Exact versions are recorded in the root and fixture lockfiles or Flask requirement files. Their upstream licenses remain controlling.

## Data, credentials, and background material

- Benchmark forms and data are synthetic; no personal or production data is required.
- No credentials are included in the repository or exported representative evidence.
- No FormProof source, fixture, benchmark, or evidence package is identified as pre-competition participant background IP. Git history records the competition work from the initial evidence-gated MVP through the formal export.
- Pre-existing components are the publicly distributed development tools, AI service, frameworks, libraries, browser, and accessibility engine listed above; their own licences and service terms remain controlling.
- Competition additions are the FormProof workflow and CLI, adapters, synthetic fixtures, tests, benchmark protocol and ledger, evidence packages, documentation, and Improvement Changelog in this repository.
- The submitter must still confirm that no material added outside this repository changes this inventory before upload.

## Human and consequential-action boundaries

- FormProof edits only a local workspace after explicit approval. It does not deploy or publish repaired code.
- A configured regression command is required before `VERIFIED_FIXED`; a clean automated scan alone remains `HUMAN_REVIEW_REQUIRED`.
- Claims that can significantly affect people, including WCAG conformance or real assistive-technology usability, remain decisions for a qualified human reviewer.
