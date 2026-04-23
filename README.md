# BODS Forms — Beneficial Ownership Declaration

A user-friendly web form that walks a declarant through the minimum information needed to produce a valid [Beneficial Ownership Data Standard (BODS)](https://standard.openownership.org/en/0.4.0/) v0.4 publication: one entity statement plus one person statement and one ownership-or-control statement for each beneficial owner declared.

**Live demo: [bods-forms.onrender.com](https://bods-forms.onrender.com/)**

Part of the [BODS Interoperability Toolkit](https://github.com/StephenAbbott/bods-interoperability-toolkit).

![BODS](https://img.shields.io/badge/BODS-0.4.0-652eb1) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Two-step declaration flow** — Entity → Beneficial owners, with a check-your-answers summary step.
- **Multiple beneficial owners** — Add any number of natural people; each card captures identity and ownership/control details, producing a person statement plus a relationship statement per person.
- **Live BODS preview** — As the user fills in the form, a sidebar shows the BODS 0.4 JSON being produced and validates it live against the BODS schema via [bods-validator](https://github.com/StephenAbbott/bods-validator) (lib-cove-bods).
- **BOVS ownership diagram** — On the summary step, the declaration is rendered as an ownership diagram using [@openownership/bods-dagre](https://github.com/openownership/visualisation-tool), implementing the [Beneficial Ownership Visualisation System (BOVS)](https://www.openownership.org/en/publications/beneficial-ownership-visualisation-system/).
- **JSON download** — Download the full BODS 0.4 publication as a single JSON file.
- **Repeater fields** — Capture multiple identifiers, nationalities, and tax residencies, as recommended by FATF and by Open Ownership's form-design guidance.
- **GOV.UK Design System patterns** — Accessible, progressive, one-thing-per-page form UX, inspired by [XGovFormBuilder](https://github.com/XGovFormBuilder/digital-form-builder) and the [GOV.UK Design System](https://design-system.service.gov.uk/).
- **Session-only storage** — Nothing is sent anywhere except the local BODS validator. Form state lives in the browser's `sessionStorage` and is discarded on reset.

## Quick start

### Prerequisites

- Node.js 20+
- A running [bods-validator](https://github.com/StephenAbbott/bods-validator) on port 10000 (or any port exposed as `/api/validate`)

### Develop

```bash
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5273`. Requests to `/api/validate` are proxied to `http://localhost:10000` by default; override with `VALIDATOR_URL`:

```bash
VALIDATOR_URL=http://localhost:8000 npm run dev
```

### Run everything with Docker

```bash
docker compose up --build
```

This builds bods-validator from the sibling `../bods-validator` checkout, then serves the forms app on `http://localhost:8080`. The forms container's nginx proxies `/api/validate` to the validator service.

### Build for production

```bash
npm run build
npm run preview
```

### Deploy to Render (free static hosting)

This repo ships with a [`render.yaml`](render.yaml) Blueprint. The live demo at **[bods-forms.onrender.com](https://bods-forms.onrender.com/)** is deployed from it. To deploy your own copy:

1. **New → Blueprint** in Render and connect your fork; Render reads `render.yaml` and provisions a free static site.
2. Build command `npm ci && npm run build` publishes `./dist`; a SPA rewrite rule serves `/index.html` for all non-asset paths.
3. **(Optional) Live validation** — by default the hosted site shows "Validator unreachable" because there's no validator. To enable validation, deploy a [bods-validator](https://github.com/StephenAbbott/bods-validator) instance somewhere and set the `VITE_VALIDATOR_URL` env var in Render to its public validate endpoint (e.g. `https://your-validator.example.com/api/validate`). This is a build-time var so Render will rebuild on change.

The form itself (step flow, JSON download, BOVS diagram) works without a validator — validation is additive.

## Architecture

```
bods-forms/
├── form-definitions/
│   └── bods-declaration.ts        # 3-step form schema (XGovFormBuilder-inspired JSON)
├── src/
│   ├── bods/
│   │   ├── types.ts               # BODS v0.4 TypeScript types
│   │   └── assembler.ts           # Form state → BODS statements (deterministic UUIDv5 IDs)
│   ├── form-engine/
│   │   ├── FormRunner.tsx         # Renders steps, radios, checkboxes, repeaters
│   │   └── useFormState.ts        # sessionStorage-backed state hook
│   ├── components/
│   │   ├── LivePreview.tsx        # Debounced validator sidebar
│   │   ├── SummaryStep.tsx        # Check-your-answers + download
│   │   └── VisualisationPanel.tsx # Renders bods-dagre ownership diagram
│   └── App.tsx                    # Routing (landing → form → summary)
├── public/
│   ├── lib/bods-dagre.js          # Prebundled visualisation library
│   └── bods-images/               # BOVS SVG icons (person, organisation, etc.)
├── docker-compose.yml             # Forms + validator sidecar
└── Dockerfile                     # Production build (nginx serving built assets)
```

**Form definition** is a JSON-like TypeScript object: each `step` has `components` (text, radios, checkboxes, partial-date, repeater), with optional `when` conditions to show/hide based on other answers. Field `name`s map 1:1 into a flat `FormState`, which the assembler then turns into BODS statements.

**BODS IDs** are deterministic UUIDv5 values derived from the declaration ID and the entity/person identity, so the same form input always produces the same statement IDs — useful for testing and for republishing.

## Why these inputs?

The form captures what's needed for a BODS 0.4 publication that's useful to an AML-style data consumer, following [Open Ownership's form-design guidance for regulators](https://www.openownership.org/en/publications/beneficial-ownership-declaration-forms-guide-for-regulators-and-designers/) and [FATF Recommendation 24](https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Guidance-Beneficial-Ownership-Legal-Persons.html):

- **Multiple entity identifiers** — LEI, national company number, tax ID etc., keyed by [org-id.guide](https://org-id.guide/) schemes.
- **Multiple person identifiers** — passport, national ID, tax ID. Listing more than one makes matching the same person across registers possible.
- **Nationalities and tax residencies separately** — critical for sanctions and tax-risk screening.
- **Generic BODS-native interest types** — shareholding, voting rights, appointment of board, other influence or control. Not scoped to UK PSC's five conditions.
- **Direct / indirect ownership** and start date — required to reason about chains of ownership.

## Resources

- [BODS 0.4 Standard](https://standard.openownership.org/en/0.4.0/)
- [BODS concepts](https://standard.openownership.org/en/0.4.0/standard/concepts.html)
- [bods-validator](https://github.com/StephenAbbott/bods-validator) — FastAPI wrapper around lib-cove-bods
- [BODS Visualisation Library / bods-dagre](https://github.com/openownership/visualisation-tool)
- [BOVS](https://www.openownership.org/en/publications/beneficial-ownership-visualisation-system/) — colour, iconography, layout
- [XGovFormBuilder / digital-form-builder](https://github.com/XGovFormBuilder/digital-form-builder) — form JSON schema inspiration
- [GOV.UK Design System](https://design-system.service.gov.uk/) — accessibility patterns
- [Open Ownership form-design guide](https://www.openownership.org/en/publications/beneficial-ownership-declaration-forms-guide-for-regulators-and-designers/)

## Acknowledgements

Built on open tooling from [Open Ownership](https://www.openownership.org/): bods-validator (lib-cove-bods), bods-dagre, BOVS. UI patterns borrowed from the [UK GOV.UK Design System](https://design-system.service.gov.uk/) and [XGovFormBuilder](https://github.com/XGovFormBuilder/digital-form-builder).

## License

MIT
