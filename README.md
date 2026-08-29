# FormProof

FormProof is an evidence-gated CLI for repairing web accessibility barriers with Codex. It freezes a browser-based baseline, maps axe findings back to likely source files, requires explicit human approval, runs Codex in a workspace-write sandbox, rescans the application, applies regression gates, and produces a reviewable HTML evidence report.

FormProof reports one of three outcomes:

- `VERIFIED_FIXED`: every targeted automated barrier is absent, no new axe rule appeared, and every configured regression command passed.
- `REGRESSION_BLOCKED`: a new automated violation appeared or a regression command failed.
- `HUMAN_REVIEW_REQUIRED`: the available evidence cannot establish that the repair is correct.

FormProof does not certify WCAG conformance and does not replace testing by people with disabilities or qualified accessibility professionals.

## Current milestone

The v0.1 vertical slice includes:

- A stack-neutral evidence contract.
- Static HTML, React/Next.js, Vue/Nuxt, Angular, and Flask/Jinja source adapters.
- Playwright plus axe browser scanning.
- Source-candidate mapping by rendered element identifiers.
- Explicit human approval before Codex execution.
- JSONL Codex trajectory capture and final-message capture.
- Before/after evidence, regression decisions, screenshots, and an accessible HTML report.
- Unit, integration, and browser tests.
- Tracked `VERIFIED_FIXED` experiment packages for semantics/name and keyboard/focus repairs across Static HTML, React, Vue, Angular, and Flask/Jinja, plus Static HTML and React dynamic-state/error repairs.

All five target stack families now have verified semantics/name and keyboard/focus fixtures, while Static HTML and React have verified dynamic-state/error fixtures. The next compatibility milestone ports the confirmed error-state pattern to Vue before Flask and Angular.

## Requirements

- Node.js 22 or newer; 22.12 or newer for the included Angular fixture
- An authenticated Codex CLI installation
- Chromium installed for Playwright

## Install

```powershell
npm install
npx playwright install chromium
npm run build
```

## Run the included static fixture

Start the fixture in one PowerShell terminal:

```powershell
npm run fixture:static
```

Freeze baseline evidence in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4173 `
  --source fixtures/static-label `
  --out .formproof/runs/static-label
```

Review these artifacts before allowing any edit:

- `.formproof/runs/static-label/before.json`
- `.formproof/runs/static-label/before.png`
- `.formproof/runs/static-label/repair-prompt.md`
- `.formproof/runs/static-label/report.html`

After review, explicitly approve the repair:

```powershell
node dist/cli.js repair `
  --evidence .formproof/runs/static-label/before.json `
  --approve `
  --test "node regression.mjs"
```

## Run the included Static keyboard/focus fixture

Start the fixture in one PowerShell terminal:

```powershell
npm run fixture:static-keyboard
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4178 `
  --source fixtures/static-hidden-focus `
  --out .formproof/runs/static-hidden-focus

node dist/cli.js repair `
  --evidence .formproof/runs/static-hidden-focus/before.json `
  --approve `
  --test "node regression.mjs"
```

The fixture exposes a dormant button inside an `aria-hidden` container. Its browser regression requires that action to remain in the document but stay outside the Tab order, then activates the visible save action entirely from the keyboard.

## Run the included Static error-state fixture

Start the fixture in one PowerShell terminal:

```powershell
npm run fixture:static-state
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4183 `
  --source fixtures/static-error-state `
  --out .formproof/runs/static-error-state

node dist/cli.js repair `
  --evidence .formproof/runs/static-error-state/before.json `
  --approve `
  --test "node regression.mjs"
```

The regression requires the initial invalid email error to remain exposed through `aria-errormessage`, then verifies that correcting and submitting the address clears the invalid state, hides the error, and announces success.

## Run the included React fixture

Install the pinned fixture dependencies and start Vite:

```powershell
npm ci --prefix fixtures/react-label
npm run fixture:react
```

Then run the same evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4174 `
  --source fixtures/react-label `
  --out .formproof/runs/react-label

node dist/cli.js repair `
  --evidence .formproof/runs/react-label/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included React keyboard/focus fixture

Install the pinned dependencies and start Vite:

```powershell
npm ci --prefix fixtures/react-hidden-focus
npm run fixture:react-keyboard
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4179 `
  --source fixtures/react-hidden-focus `
  --out .formproof/runs/react-hidden-focus

node dist/cli.js repair `
  --evidence .formproof/runs/react-hidden-focus/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included React error-state fixture

Install the pinned dependencies and start Vite:

```powershell
npm ci --prefix fixtures/react-error-state
npm run fixture:react-state
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4184 `
  --source fixtures/react-error-state `
  --out .formproof/runs/react-error-state

node dist/cli.js repair `
  --evidence .formproof/runs/react-error-state/before.json `
  --approve `
  --test "npm run regression"
```

The regression preserves the initial React-rendered invalid state and error reference, then verifies correction, error clearing, and success announcement.

## Run the included Vue fixture

Install the pinned fixture dependencies and start Vite:

```powershell
npm ci --prefix fixtures/vue-label
npm run fixture:vue
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4176 `
  --source fixtures/vue-label `
  --out .formproof/runs/vue-label

node dist/cli.js repair `
  --evidence .formproof/runs/vue-label/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included Vue keyboard/focus fixture

Install the pinned dependencies and start Vite:

```powershell
npm ci --prefix fixtures/vue-hidden-focus
npm run fixture:vue-keyboard
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4180 `
  --source fixtures/vue-hidden-focus `
  --out .formproof/runs/vue-hidden-focus

node dist/cli.js repair `
  --evidence .formproof/runs/vue-hidden-focus/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included Angular fixture

Install the pinned Angular 21 dependencies and start the development server:

```powershell
npm ci --prefix fixtures/angular-label
npm run fixture:angular
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4177 `
  --source fixtures/angular-label `
  --out .formproof/runs/angular-label

node dist/cli.js repair `
  --evidence .formproof/runs/angular-label/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included Angular keyboard/focus fixture

Install the pinned Angular 21 dependencies and start the development server:

```powershell
npm ci --prefix fixtures/angular-hidden-focus
npm run fixture:angular-keyboard
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4182 `
  --source fixtures/angular-hidden-focus `
  --out .formproof/runs/angular-hidden-focus

node dist/cli.js repair `
  --evidence .formproof/runs/angular-hidden-focus/before.json `
  --approve `
  --test "npm run regression"
```

## Run the included Flask fixture

Create the isolated Python environment, install the fully pinned dependencies, and start Flask:

```powershell
python -m venv fixtures/flask-label/.venv
fixtures/flask-label/.venv/Scripts/python.exe -m pip install `
  -r fixtures/flask-label/requirements.txt
npm run fixture:flask
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4175 `
  --source fixtures/flask-label `
  --out .formproof/runs/flask-label

node dist/cli.js repair `
  --evidence .formproof/runs/flask-label/before.json `
  --approve `
  --test "node regression.mjs"
```

The fixture enables Jinja template auto-reload so the post-repair scan observes the source edit without restarting Flask. Its regression command runs the Flask test-client suite before the Playwright submission flow.

## Run the included Flask keyboard/focus fixture

Create the isolated Python environment, install the fully pinned dependencies, and start Flask:

```powershell
python -m venv fixtures/flask-hidden-focus/.venv
fixtures/flask-hidden-focus/.venv/Scripts/python.exe -m pip install `
  -r fixtures/flask-hidden-focus/requirements.txt
npm run fixture:flask-keyboard
```

Then run the evidence-gated workflow in another terminal:

```powershell
node dist/cli.js inspect `
  --url http://127.0.0.1:4181 `
  --source fixtures/flask-hidden-focus `
  --out .formproof/runs/flask-hidden-focus

node dist/cli.js repair `
  --evidence .formproof/runs/flask-hidden-focus/before.json `
  --approve `
  --test "node regression.mjs"
```

This regression runs the Flask test-client suite before checking hidden-focus exclusion and save behavior entirely from the keyboard.

The official Codex CLI supports non-interactive execution, JSONL event output, approval-reviewed workspace-write execution, and final-message capture. FormProof uses `--approve-for-me`, which routes requests through that workspace-write review path; it does not combine the flag with the mutually exclusive explicit `--sandbox` option and never uses the dangerous sandbox-bypass flag.

## Use with another local application

1. Start the target application locally.
2. Run `formproof inspect` with its URL and source directory.
3. Review the frozen evidence and proposed prompt.
4. Run `formproof repair --approve` only if the target and proposed scope are correct.
5. Inspect `decision.json`, `after.json`, `trajectory.jsonl`, and `report.html`.

The target application must remain available at the same URL during repair and verification. Commands passed through `--test` execute locally in the target repository and must be treated as trusted input.

## Development verification

```powershell
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Repository map

```text
src/adapters/       Stack detection and source-candidate mapping
src/agent/          Sandboxed Codex CLI runner and repair prompt
src/core/           Verification decision and inspect/repair workflows
src/report/         Accessible standalone HTML evidence report
src/scanner/        Playwright and axe scanner
fixtures/           Synthetic adapter and browser fixtures
evidence/           Sanitized, tracked experiment artifacts and trajectories
benchmark/          Frozen benchmark manifest and evaluation protocol
research/           Evidence-backed problem and experiment design
```

See [Architecture](docs/ARCHITECTURE.md), [Evaluation](docs/EVALUATION.md), [Trajectory handling](docs/TRAJECTORIES.md), and the [verified experiment index](evidence/README.md) for the competition evidence contract.
