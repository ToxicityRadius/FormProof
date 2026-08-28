```json
{
  "claim_intent_manifests": [
    {
      "manifest_version": "1.0",
      "manifest_id": "M-2026-08-29T00:00:00Z-formproof",
      "emitted_by": "report_compiler_agent",
      "emitted_at": "2026-08-29T00:00:00Z",
      "claims": [
        {
          "claim_id": "C-001",
          "claim_text": "Web accessibility barriers, including improperly labeled form controls, remain common in large-scale automated observations.",
          "intended_evidence_kind": "empirical",
          "planned_refs": ["webaim2026"]
        },
        {
          "claim_id": "C-002",
          "claim_text": "Automated accessibility tools cannot establish complete accessibility and must be combined with human judgment.",
          "intended_evidence_kind": "normative",
          "planned_refs": ["w3c_tools2026", "vigo2013"]
        },
        {
          "claim_id": "C-003",
          "claim_text": "Generative AI can improve accessibility detection or repair, but current results do not justify unsupervised conformance claims.",
          "intended_evidence_kind": "empirical",
          "planned_refs": ["he2025", "huang2024", "oyelayo2026"]
        },
        {
          "claim_id": "C-004",
          "claim_text": "FormProof is the strongest expected competition direction among the considered software-only concepts because its workflow and evaluation can map directly to the supplied rubric.",
          "intended_evidence_kind": "analytical",
          "planned_refs": ["micro1_2026"]
        },
        {
          "claim_id": "C-005",
          "claim_text": "FormProof is a workflow and evaluation contribution, not the first LLM-based web-accessibility repair system.",
          "intended_evidence_kind": "empirical",
          "planned_refs": ["accessguru2025", "fernandez2026"]
        }
      ],
      "manifest_negative_constraints": [
        {
          "constraint_id": "MNC-1",
          "rule": "Exclude hardware, firmware, IoT, robotics, device simulation, and digital-twin content."
        },
        {
          "constraint_id": "MNC-2",
          "rule": "Do not claim full WCAG conformance or replace evaluation by people with disabilities and qualified accessibility professionals."
        },
        {
          "constraint_id": "MNC-3",
          "rule": "Do not present proposed success thresholds, rubric estimates, or benchmark design as measured results or judge predictions."
        },
        {
          "constraint_id": "MNC-4",
          "rule": "Do not claim that FormProof is the first or academically novel accessibility repair agent."
        }
      ]
    }
  ]
}
```

# FormProof: Universal Web Accessibility Repair Research and Experiment Design Brief

**Date:** 2026-08-29

**Mode:** Quick research brief

**Decision:** Proceed with FormProof as the primary Frontier Engineering Challenge concept

**AI disclosure:** Codex assisted with source discovery, source checking, synthesis, and drafting. The author retains responsibility for verifying the implementation, benchmark results, citations, and competition submission.

## Executive summary

**FormProof** is a framework-agnostic, evidence-gated coding agent for repairing accessibility barriers across web interfaces. It is intended for individual developers, teams, public institutions, schools, nonprofits, and businesses maintaining static sites, server-rendered applications, or modern JavaScript applications. Scanners can report accessibility warnings, but maintainers still have to locate the responsible source, choose a correct repair, preserve behavior, and prove that the barrier is gone without introducing a regression. FormProof proposes a minimal source patch, requires human approval, runs independent accessibility, interaction, and regression checks, and returns one of three honest outcomes: `VERIFIED_FIXED`, `REGRESSION_BLOCKED`, or `HUMAN_REVIEW_REQUIRED`.

This is the strongest current software-only choice for the supplied competition. It has a specific user, visible end-to-end behavior, purposeful agent decisions, a fair baseline, deterministic evidence, and a defensible failure boundary. That judgment is a design assessment against the official rubric, not a measured score or prediction of judging results (micro1, 2026, pp. 1–7). <!--ref:micro1_2026--><!--anchor:page:1-7-->

## Problem and user

**Users:** anyone who builds or maintains a website or web application, from a solo developer to a large organization. The target architecture covers static HTML, server-rendered templates, content-driven sites, and component frameworks through replaceable source adapters.

**End beneficiaries:** all website users, including people who rely on screen readers, keyboards, voice input, magnification, captions, reduced motion, clearer language, or other accessibility support. FormProof tests multiple disability-related interaction needs without claiming that automated checks represent every person's experience.

**Problem:** developers can discover accessibility warnings but cannot efficiently convert them into verified source-level repairs across different stacks and interaction patterns. The difficult work is not merely changing markup. A maintainer may need to trace a failure through templates, components, routing, state, labels, media, navigation, dialogs, validation, focus management, keyboard behavior, and existing tests, then decide whether automation has enough evidence to accept the patch.

This problem is meaningful. WebAIM's automated scan of one million home pages reported detected WCAG failures on 95.9% of pages (WebAIM, 2026). <!--ref:webaim2026--><!--anchor:quote:95.9%25%20of%20home%20pages%20had%20detected%20WCAG%202%20failures.--> One third of the form inputs in the same sample were not properly labeled (WebAIM, 2026). <!--ref:webaim2026--><!--anchor:quote:One%20third%20%2833.1%25%29%20of%20those%20form%20inputs%20were%20not%20properly%20labeled.--> W3C's form guidance identifies labels, instructions, validation, notifications, and multi-page progress as recurring implementation concerns (W3C WAI, 2026b). <!--ref:w3c_forms2026--><!--anchor:section:What%20makes%20a%20form%20accessible--> W3C also states that tools cannot check every accessibility aspect and that human judgment is required (W3C WAI, 2026a). <!--ref:w3c_tools2026--><!--anchor:quote:Tools%20cannot%20check%20all%20accessibility%20aspects%20automatically.%20Human%20judgement%20is%20required.--> A six-tool benchmark reached the same conclusion about the harm of sole reliance on automated testing (Vigo et al., 2013). <!--ref:vigo2013--><!--anchor:section:Abstract--> A systematic review of 92 studies found substantial emphasis on automated testing but continuing gaps in accessibility engineering methods and coverage across disabilities (Ara et al., 2024). <!--ref:ara2024--><!--anchor:section:Abstract-->

## Research question

> To what extent does a framework-agnostic, verification-gated coding agent improve verified accessibility-barrier resolution across representative web stacks and interaction patterns compared with a single-prompt coding agent on a fixed suite of synthetic cases?

The project does **not** ask whether an agent can certify a site as WCAG conformant. WCAG 2.2 defines testable success criteria but does not cover every user need (W3C, 2024). <!--ref:wcag22--><!--anchor:section:0.2%20WCAG%202%20Layers%20of%20Guidance--> FormProof therefore measures resolution of seeded, testable barriers and routes other judgments to a qualified human.

## Proposed solution

FormProof should use one primary coding agent, a normalized evidence contract, replaceable framework adapters, and deterministic verification tools. Additional agents should be retained only if an ablation shows that they improve the primary metric.

1. **Inspect:** run the target locally in a sandbox, detect its stack and test commands, map pages and interaction states, and freeze baseline evidence.
2. **Normalize:** convert rendered DOM, accessibility-tree, source-map, route, and test information into a stack-neutral evidence contract. Framework adapters translate between this contract and HTML, templates, JSX/TSX, Vue single-file components, Angular templates, or equivalent source files.
3. **Triage:** create an issue ledger linking each suspected barrier to the rendered element, source location, relevant WCAG criterion, affected interaction, and an executable or human-review check.
4. **Propose:** generate the smallest source-level patch and an explanation of its expected behavior. A human approves or rejects the change before application.
5. **Verify:** rerun automated rule checks, Playwright keyboard, focus, navigation, media, dialog, and validation assertions, plus the application's existing functional tests. Playwright supports integrating axe rules into repeatable tests but explicitly notes that automated testing cannot detect every violation (Microsoft, 2026a). <!--ref:playwright_a11y2026--><!--anchor:quote:Automated%20accessibility%20tests%20can%20detect%20some%20common%20accessibility%20problems%20such%20as%20missing%20or%20invalid%20properties.-->
6. **Decide:** emit `VERIFIED_FIXED` only when every relevant gate passes. Emit `REGRESSION_BLOCKED` when another test fails, and `HUMAN_REVIEW_REQUIRED` when the available checks cannot establish correctness.
7. **Package evidence:** save the approved diff, before-and-after reports, exact commands, result ledger, limitations, and representative agent trajectory.

The boundary is important because recent research shows both promise and risk. GenA11y reported strong issue-detection precision and recall across 37 WCAG criteria, but it studied detection rather than verified source repair (He et al., 2025). <!--ref:he2025--><!--anchor:section:Abstract--> A peer-reviewed component benchmark found that generated code frequently needed follow-up prompting and human intervention (Abu Doush & Kassem, 2025). <!--ref:abudoush2025--><!--anchor:section:Abstract--> A smaller study of six generated websites also concluded that human oversight was necessary (Panchanadikar et al., 2025). <!--ref:panchanadikar2025--><!--anchor:section:Abstract--> ACCESS reported a reduction in automatically detected violations after DOM correction, but it is a preprint and its outcome is not equivalent to full accessibility (Huang et al., 2024). <!--ref:huang2024--><!--anchor:section:Abstract--> A 2026 preprint found that LLM patches often improved compliance while fewer than 26% fully resolved the instance; about 30% made structural changes, and iterative refinement increased cost without improving remediation in that study (Oyelayo et al., 2026). <!--ref:oyelayo2026--><!--anchor:section:Abstract-->

## Fair benchmark

Create 15 synthetic, local, self-contained cases stratified across five stack families: static HTML, React or Next.js, Vue or Nuxt, Angular, and server-rendered templates such as Flask, Django, Laravel, or Express. Each family receives the same three barrier classes: semantics and names, keyboard and focus behavior, and dynamic state or error communication. Add cross-suite checks for contrast, media alternatives, headings and landmarks, dialogs, navigation, data tables, and responsive reflow. Include at least two cases whose correct outcome is human review and one coupled case where a naive repair breaks behavior.

**Primary metric:** macro-averaged Verified Barrier Resolution Rate at first attempt (`Macro-VBRR@1`). Calculate `VBRR@1` within each stack family, then average the five family scores so that one easy framework cannot dominate the result. A seeded barrier counts as resolved only when all relevant regression gates pass.

**Secondary measures:** accepted regressions, false fixes, correct human-review referrals, median completion time, token or API cost, and patch size.

**Baseline:** the same model receives the same repositories, cases, tools, time or token cap, and a single direct prompt to repair accessibility issues. The FormProof condition receives the structured workflow and framework adapters but no privileged test answers. Cases and hidden assertions are frozen before both runs. Run each condition on the same 15 cases, report per-stack and overall results, preserve complete outcomes, and include one challenging trajectory, as the brief recommends (micro1, 2026, pp. 3–5). <!--ref:micro1_2026--><!--anchor:page:3-5-->

**Pre-registered targets, not results:** at least 80% `VBRR@1`, at least a 20-percentage-point improvement over baseline, zero accepted regressions, and correct escalation for every designated human-review case.

## Competition fit and prior-art boundary

FormProof maps cleanly to the rubric: the bottleneck remains specific even though the users and stacks are broad; the inspect-normalize-triage-propose-verify-decision loop demonstrates purposeful agent engineering; repaired interfaces and evidence reports create a visible end-to-end demo; the frozen, stratified benchmark enables measured improvement; and local fixtures support clean reproduction. The changelog can show discarded prompts, adapters, or agent roles, satisfying the requirement to explain what was removed as well as what remained (micro1, 2026, pp. 2–6). <!--ref:micro1_2026--><!--anchor:page:2-6-->

The contribution must be framed honestly. AccessGuru already combines automated testing, LLM-based semantic analysis, repair, and feedback (Fathallah et al., 2025). <!--ref:accessguru2025--><!--anchor:section:Abstract--> Recent work also studies automated source-level remediation for static and Angular projects (Fernández-Navarro & Chicano, 2026). <!--ref:fernandez2026--><!--anchor:section:Abstract--> FormProof's differentiator is therefore not “AI fixes accessibility.” It is the stack-neutral evidence contract, adapter architecture, stratified benchmark, independent acceptance gates, explicit abstention states, fair baseline, and reproducible evidence package.

**Hot take:** A scanner score is not accessibility, and more agent loops are not reliability. An accessibility agent earns the right to say “fixed” only when independent behavior tests pass; otherwise, it stops.

## Limitations and safeguards

Synthetic cases may reward benchmark-specific behavior and do not represent the full experience of people with disabilities. Five stack families are broad but cannot prove compatibility with every framework, plugin, browser, assistive technology, language, or custom component. Axe and Playwright cover only machine-testable subsets. The experiment should make no full-site conformance claim, should not use personal data, and should not treat disabled people as a monolithic group. A later user study would require accessible participation procedures and institutional ethics review; it is not part of the initial hackathon benchmark.

“For all” is an architectural goal: any local web application can integrate through the adapter contract, and the first benchmark provides representative coverage across the five stack families. It does not mean that every possible stack is already tested or that FormProof certifies legal compliance. Remote automatic deployment and any physical-device domain remain out of scope.

## Search and evidence notes

Searches conducted on 2026-08-28 and 2026-08-29 covered W3C guidance, official testing documentation, large-scale empirical accessibility data, peer-reviewed accessibility-engineering and generative-AI studies, and recent preprints. The corpus favors 2023–2026 evidence because agentic repair is changing quickly. Preprints are included only as emerging evidence and are labeled accordingly. The strongest unresolved evidence gap is direct evaluation with small development teams and people with disabilities.

## References

Abu Doush, I., & Kassem, R. (2025). Can generative AI create accessible web code? A benchmark analysis of AI-generated HTML against accessibility standards. *Universal Access in the Information Society, 24*, 3483–3506. https://doi.org/10.1007/s10209-025-01250-2

Ara, J., Sik-Lanyi, C., & Kelemen, A. (2024). Accessibility engineering in web evaluation process: A systematic literature review. *Universal Access in the Information Society, 23*, 653–686. https://doi.org/10.1007/s10209-023-00967-2

Fathallah, N., Hernández, D., & Staab, S. (2025). AccessGuru: Leveraging LLMs to detect and correct web accessibility violations in HTML code. *arXiv* [Preprint]. https://arxiv.org/abs/2507.19549

Fernández-Navarro, C., & Chicano, F. (2026). Automated LLM-based accessibility remediation: From conventional websites to Angular single-page applications. *arXiv* [Preprint]. https://arxiv.org/abs/2602.17887

He, Z., Huq, S. F., & Malek, S. (2025). Enhancing web accessibility: Automated detection of issues with generative AI. *Proceedings of the ACM on Software Engineering, 2*(FSE), Article FSE101, 2264–2287. https://doi.org/10.1145/3729371

Huang, C., Ma, A., Vyasamudri, S., Puype, E., Kamal, S., Belza Garcia, J., Cheema, S., & Lutz, M. (2024). ACCESS: Prompt engineering for automated web accessibility violation corrections. *arXiv* [Preprint]. https://doi.org/10.48550/arXiv.2401.16450

Microsoft. (2026a). Accessibility testing. *Playwright documentation*. https://playwright.dev/docs/accessibility-testing

micro1. (2026). *Agentic Workflows Hackathon: Frontier Engineering Challenge brief* [Competition brief supplied by the user].

Oyelayo, O., Abushaqra, G., Asadi, P., Dey, D., & Costa, D. E. (2026). LLM based web accessibility repair: An empirical study of detection, remediation, and cost. *arXiv* [Preprint]. https://arxiv.org/abs/2605.27716

Panchanadikar, R., Bhosekar, M. S., & Dixon, E. (2025). Can generative AI create accessible websites? In *Proceedings of the 27th International ACM SIGACCESS Conference on Computers and Accessibility* (Article 95, pp. 1–6). ACM. https://doi.org/10.1145/3663547.3759755

Vigo, M., Brown, J., & Conway, V. (2013). Benchmarking web accessibility evaluation tools: Measuring the harm of sole reliance on automated tests. In *Proceedings of the 10th International Cross-Disciplinary Conference on Web Accessibility* (Article 1, pp. 1–10). ACM. https://doi.org/10.1145/2461121.2461124

WebAIM. (2026). *The WebAIM Million: The 2026 report on the accessibility of the top 1,000,000 home pages*. https://webaim.org/projects/million/

World Wide Web Consortium. (2024). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/

World Wide Web Consortium Web Accessibility Initiative. (2026a). *Selecting web accessibility evaluation tools*. https://www.w3.org/WAI/test-evaluate/tools/selecting/

World Wide Web Consortium Web Accessibility Initiative. (2026b). *Forms tutorial*. https://www.w3.org/WAI/tutorials/forms/

## Reproducibility and ethics status

- **Ethics:** Cleared for a synthetic-code benchmark. No human subjects or personal data are included. Dual-use risk is low.
- **Source integrity:** Core claims were checked against the official challenge brief, W3C guidance, official Playwright documentation, primary publication pages, or original preprint records. Preprints are not treated as settled evidence.
- **Reproducibility:** The implementation should record tool versions, model and reasoning settings, prompts, test seeds, case hashes, commands, environment setup, complete outcomes, and rejected experiments.
- **Human oversight:** Required before applying patches and whenever FormProof returns `HUMAN_REVIEW_REQUIRED`. Human oversight remains necessary even when all automated gates pass.
