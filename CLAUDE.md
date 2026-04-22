# CLAUDE.md — working notes for bods-forms

## What this project is

A user-friendly web form that produces valid BODS v0.4 JSON for a single declaration: one entity, one natural-person beneficial owner, one ownership-or-control statement. Live preview + schema validation while the user types, BOVS ownership diagram + JSON download at the end.

## Stack

- Vite 8 + React 19 + TypeScript 5.9 (strict)
- Custom lightweight form engine inspired by XGovFormBuilder's form JSON (not the runner itself — that's private and Hapi/Redis-based)
- GOV.UK Design System styling **patterns** (CSS hand-written in the spirit of govuk-frontend; we do not import the full SCSS)
- bods-validator sidecar (FastAPI) for live schema validation via `/api/validate`
- @openownership/bods-dagre loaded as a UMD `<script>` from `public/lib/` — **not** imported via npm, since the prebundled file is what works with the BOVS icons

## Key design decisions

- **Deterministic statement IDs**: UUIDv5 with namespace `a6b69e28-4fa3-4a9f-b19f-8a6f3b8f9a5e`, keyed by entity name / person name / declaration ID. Means the same form state always produces the same statements.
- **Partial previews allowed**: `buildStatements` filters out any statements whose identity field isn't set yet, so the live preview shows what exists so far rather than erroring.
- **State shape is flat**: `FormState` is a flat object keyed by field `name` from the form JSON. Repeaters store arrays of objects. The assembler reads this flat state and builds structured BODS.
- **sessionStorage only**: no server persistence, no accounts. The whole thing is a single-page tool.
- **Port 5273** for dev server (bods-validator sibling project already uses 5173).

## Relationship to sibling projects

- [bods-validator](https://github.com/StephenAbbott/bods-validator) — the form's `/api/validate` proxy target. Keep this running on port 10000 during development.
- [bods-dagre](https://github.com/openownership/visualisation-tool) — source of `public/lib/bods-dagre.js` and `public/bods-images/`. Re-copy these from bods-validator's `frontend/public/` if they ever need updating.

## Things to watch for

- The `VisualisationPanel` swallows errors thrown by bods-dagre's optional properties-panel code **after** the graph has already rendered; that's intentional.
- `useFormState` stores under `bods-forms:state:v1`. If you change the `FormState` shape in an incompatible way, bump the version to avoid reading stale data.
- The `when` condition engine in `FormRunner` is deliberately tiny — equals, not-equals, in-list. Keep it that way; if a form needs richer branching, reshape the form JSON rather than growing the engine.

## Testing

There are no unit tests yet. TypeScript (`npx tsc -b`) covers a lot. Manual testing via `npm run dev` with bods-validator running.

## License

MIT. Copyright Stephen Abbott Pugh.
