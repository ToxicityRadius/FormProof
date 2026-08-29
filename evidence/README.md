# Verified experiment evidence

Each directory contains sanitized, tracked artifacts from one FormProof before-to-after repair experiment. Raw local screenshots and unsanitized trajectories remain under the ignored `.formproof/runs` directory.

| Experiment | Adapter | Target rule | Decision | Regression gate |
| --- | --- | --- | --- | --- |
| [Static label](static-label/README.md) | Static HTML | `label` | `VERIFIED_FIXED` | Form structure preserved |
| [Static hidden focus](static-hidden-focus/README.md) | Static HTML | `aria-hidden-focus` | `VERIFIED_FIXED` | Hidden action excluded; keyboard save preserved |
| [React label](react-label/README.md) | React/Vite | `label` | `VERIFIED_FIXED` | Submission behavior preserved |
| [React hidden focus](react-hidden-focus/README.md) | React/Vite | `aria-hidden-focus` | `VERIFIED_FIXED` | Hidden action excluded; keyboard save preserved |
| [Flask label](flask-label/README.md) | Flask/Jinja | `label` | `VERIFIED_FIXED` | Integration and submission behavior preserved |
| [Flask hidden focus](flask-hidden-focus/README.md) | Flask/Jinja | `aria-hidden-focus` | `VERIFIED_FIXED` | Integration, hidden action exclusion, and keyboard save preserved |
| [Vue label](vue-label/README.md) | Vue/Vite | `label` | `VERIFIED_FIXED` | Submission behavior preserved |
| [Vue hidden focus](vue-hidden-focus/README.md) | Vue/Vite | `aria-hidden-focus` | `VERIFIED_FIXED` | Hidden action excluded; keyboard save preserved |
| [Angular label](angular-label/README.md) | Angular | `label` | `VERIFIED_FIXED` | Submission behavior preserved |
| [Angular hidden focus](angular-hidden-focus/README.md) | Angular | `aria-hidden-focus` | `VERIFIED_FIXED` | Hidden action excluded; keyboard save preserved |

These packages report evidence for their automated rule and configured regression command. They are not WCAG conformance certificates.
