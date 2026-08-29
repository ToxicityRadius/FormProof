# Verified experiment evidence

Each directory contains sanitized, tracked artifacts from one FormProof before-to-after repair experiment. Raw local screenshots and unsanitized trajectories remain under the ignored `.formproof/runs` directory.

| Experiment | Adapter | Target rule | Decision | Regression gate |
| --- | --- | --- | --- | --- |
| [Static label](static-label/README.md) | Static HTML | `label` | `VERIFIED_FIXED` | Form structure preserved |
| [React label](react-label/README.md) | React/Vite | `label` | `VERIFIED_FIXED` | Submission behavior preserved |
| [Flask label](flask-label/README.md) | Flask/Jinja | `label` | `VERIFIED_FIXED` | Integration and submission behavior preserved |

These packages report evidence for their automated rule and configured regression command. They are not WCAG conformance certificates.
