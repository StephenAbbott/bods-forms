import { useEffect, useMemo, useState } from "react";
import FormRunner from "./form-engine/FormRunner";
import { useFormState } from "./form-engine/useFormState";
import { buildStatements, newDeclarationId } from "./bods/assembler";
import LivePreview from "./components/LivePreview";
import SummaryStep from "./components/SummaryStep";
import { declarationForm } from "../form-definitions/bods-declaration";

type RoutePage =
  | { kind: "landing" }
  | { kind: "form"; stepIndex: number }
  | { kind: "summary" };

function validateStep(stepIndex: number, state: Record<string, unknown>): Record<string, string> {
  const errs: Record<string, string> = {};
  const step = declarationForm.steps[stepIndex];
  for (const c of step.components) {
    if (c.type === "paragraph") continue;
    if (c.type === "beneficial-owners") {
      const owners = (state[c.name] as Array<Record<string, unknown>> | undefined) ?? [];
      if (c.required && owners.length === 0) {
        errs[c.name] = "Add at least one beneficial owner.";
        continue;
      }
      owners.forEach((bo, i) => {
        if (!bo.givenName) errs[`beneficialOwners[${i}].givenName`] = "Given name is required";
        if (!bo.familyName) errs[`beneficialOwners[${i}].familyName`] = "Family name is required";
        const interests = bo.interestTypes as unknown[] | undefined;
        if (!interests || interests.length === 0) {
          errs[`beneficialOwners[${i}].interestTypes`] = "Select at least one type of interest";
        }
      });
      continue;
    }
    if (!c.required) continue;
    const v = state[c.name];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
      errs[c.name] = `${c.title ?? c.name} is required`;
    }
  }
  return errs;
}

export default function App() {
  const [page, setPage] = useState<RoutePage>({ kind: "landing" });
  const { state, setState, reset } = useFormState();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [declarationId] = useState<string>(() => newDeclarationId());

  const statements = useMemo(
    () => buildStatements(state, declarationId),
    [state, declarationId]
  );

  // Scroll to top on step change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const start = () => setPage({ kind: "form", stepIndex: 0 });

  const handleNext = () => {
    if (page.kind !== "form") return;
    const errs = validateStep(page.stepIndex, state as Record<string, unknown>);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (page.stepIndex < declarationForm.steps.length - 1) {
      setPage({ kind: "form", stepIndex: page.stepIndex + 1 });
    } else {
      setPage({ kind: "summary" });
    }
  };

  const handleBack = () => {
    if (page.kind === "summary") {
      setPage({ kind: "form", stepIndex: declarationForm.steps.length - 1 });
    } else if (page.kind === "form" && page.stepIndex > 0) {
      setPage({ kind: "form", stepIndex: page.stepIndex - 1 });
    } else {
      setPage({ kind: "landing" });
    }
  };

  const editStep = (idx: number) => setPage({ kind: "form", stepIndex: idx });

  const handleReset = () => {
    reset();
    setErrors({});
    setPage({ kind: "landing" });
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-header__tag">BODS 0.4</span>
          <a href="/" className="app-header__title" onClick={(e) => { e.preventDefault(); setPage({ kind: "landing" }); }}>
            Beneficial Ownership Declaration
          </a>
        </div>
      </header>
      <div className="phase-banner">
        <div className="phase-banner__inner">
          <span className="phase-banner__tag">Prototype</span>
          <span>
            A user-friendly form that produces valid{" "}
            <a href="https://standard.openownership.org/en/0.4.0/" target="_blank" rel="noreferrer">
              BODS v0.4
            </a>{" "}
            beneficial ownership data. Try it at{" "}
            <a href="https://bods-forms.onrender.com/" target="_blank" rel="noreferrer">
              bods-forms.onrender.com
            </a>
            , source at{" "}
            <a href="https://github.com/StephenAbbott/bods-forms" target="_blank" rel="noreferrer">
              github.com/StephenAbbott/bods-forms
            </a>
            .
          </span>
        </div>
      </div>
      <main className="app-main">
        {page.kind === "landing" && <Landing onStart={start} />}
        {page.kind === "form" && (
          <div className="app-layout">
            <div>
              <FormRunner
                definition={declarationForm}
                stepIndex={page.stepIndex}
                state={state}
                setState={setState}
                onNext={handleNext}
                onBack={handleBack}
                errors={errors}
              />
            </div>
            <LivePreview statements={statements} />
          </div>
        )}
        {page.kind === "summary" && (
          <SummaryStep
            state={state}
            declarationId={declarationId}
            onBack={handleBack}
            onEdit={editStep}
            onReset={handleReset}
          />
        )}
      </main>
      <footer className="app-footer">
        <div className="app-footer__inner">
          <p>
            Built with{" "}
            <a href="https://design-system.service.gov.uk/" target="_blank" rel="noreferrer">
              GOV.UK Design System
            </a>{" "}
            patterns, reusing validation from{" "}
            <a href="https://github.com/StephenAbbott/bods-validator" target="_blank" rel="noreferrer">
              bods-validator
            </a>{" "}
            and visualisation from{" "}
            <a href="https://github.com/openownership/visualisation-tool" target="_blank" rel="noreferrer">
              @openownership/bods-dagre
            </a>
            . Form design follows{" "}
            <a
              href="https://www.openownership.org/en/publications/beneficial-ownership-declaration-forms-guide-for-regulators-and-designers/"
              target="_blank"
              rel="noreferrer"
            >
              Open Ownership's guide for regulators and designers
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ maxWidth: 740 }}>
      <p className="form-caption">A BODS v0.4 declaration tool</p>
      <h1 className="form-heading">Declare who ultimately owns or controls an entity</h1>
      <p className="form-lede">
        This tool walks you through the minimum information needed to produce a valid{" "}
        <a href="https://standard.openownership.org/en/0.4.0/" target="_blank" rel="noreferrer">
          Beneficial Ownership Data Standard (BODS) v0.4
        </a>{" "}
        publication describing one entity and one or more natural-person beneficial owners.
      </p>
      <p>You will:</p>
      <ol>
        <li>Tell us about the entity (produces the entity statement).</li>
        <li>
          Add one or more beneficial owners — for each person, their identity and how they own or control the entity
          (produces a person statement and an ownership-or-control statement per person).
        </li>
      </ol>
      <p>
        As you fill in the form a live BODS preview appears next to it, validated against the BODS 0.4 schema.
        At the end you can download the full declaration as JSON and view it as a{" "}
        <a
          href="https://www.openownership.org/en/publications/beneficial-ownership-visualisation-system/"
          target="_blank"
          rel="noreferrer"
        >
          BOVS
        </a>{" "}
        ownership diagram.
      </p>
      <div className="notice notice--info">
        <strong>This is a prototype.</strong> Data is kept only in your browser's session storage — nothing is sent
        to a server other than the local BODS validator for schema checking.
      </div>
      <button type="button" className="btn btn--primary" onClick={onStart} style={{ marginTop: 20 }}>
        Start now
      </button>
    </div>
  );
}
