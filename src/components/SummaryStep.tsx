import { useMemo } from "react";
import type { FormState } from "../bods/assembler";
import { buildDeclaration, buildStatements } from "../bods/assembler";
import VisualisationPanel from "./VisualisationPanel";

interface Props {
  state: FormState;
  declarationId: string;
  onBack: () => void;
  onEdit: (stepIndex: number) => void;
  onReset: () => void;
}

function Row({
  label,
  value,
  editHref,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  editHref?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="summary-list__row">
      <dt className="summary-list__key">{label}</dt>
      <dd className="summary-list__value">{value || <em style={{ color: "var(--oo-muted)" }}>—</em>}</dd>
      <dd className="summary-list__actions">
        {onEdit && (
          <button type="button" className="btn--link" onClick={onEdit} aria-label={`Change ${label.toLowerCase()}`}>
            Change
          </button>
        )}
        {!onEdit && editHref && <a href={editHref}>Change</a>}
      </dd>
    </div>
  );
}

function fmtList(arr: Array<Record<string, string>> | undefined, renderItem: (item: Record<string, string>) => string): string {
  if (!arr || arr.length === 0) return "";
  return arr.map(renderItem).filter(Boolean).join("; ");
}

export default function SummaryStep({ state, declarationId, onBack, onEdit, onReset }: Props) {
  const declaration = useMemo(() => buildDeclaration(state, declarationId), [state, declarationId]);
  const statements = useMemo(() => buildStatements(state, declarationId), [state, declarationId]);
  const json = useMemo(() => JSON.stringify(declaration, null, 2), [declaration]);
  const statementsJson = useMemo(() => JSON.stringify(statements, null, 2), [statements]);

  const download = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        Back
      </button>
      <p className="form-caption">Review</p>
      <h1 className="form-heading">Check your answers</h1>
      <p className="form-lede">
        This is what you'll publish as a BODS v0.4 declaration. You can still edit any section.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Entity</h2>
      <dl className="summary-list">
        <Row label="Entity type" value={state.entityType} onEdit={() => onEdit(0)} />
        <Row label="Registered name" value={state.entityName} onEdit={() => onEdit(0)} />
        <Row
          label="Identifiers"
          value={fmtList(state.entityIdentifiers as Record<string, string>[] | undefined, (i) =>
            [i.scheme, i.id].filter(Boolean).join(" ")
          )}
          onEdit={() => onEdit(0)}
        />
        <Row label="Country of incorporation" value={state.entityJurisdictionCode} onEdit={() => onEdit(0)} />
        <Row label="Date of incorporation" value={state.entityFoundingDate} onEdit={() => onEdit(0)} />
        <Row
          label="Registered address"
          value={[state.entityRegisteredAddress, state.entityAddressCountry].filter(Boolean).join(", ")}
          onEdit={() => onEdit(0)}
        />
      </dl>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Beneficial owner</h2>
      <dl className="summary-list">
        <Row
          label="Name"
          value={[state.personGivenName, state.personFamilyName].filter(Boolean).join(" ")}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Other names"
          value={fmtList(state.personAlternateNames as Record<string, string>[] | undefined, (i) => i.fullName ?? "")}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Date of birth"
          value={[state.personBirthYear, state.personBirthMonth, state.personBirthDay].filter(Boolean).join("-")}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Nationalities"
          value={fmtList(state.personNationalities as Record<string, string>[] | undefined, (i) => i.code ?? i.name ?? "")}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Tax residencies"
          value={fmtList(state.personTaxResidencies as Record<string, string>[] | undefined, (i) => i.code ?? i.name ?? "")}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Identifiers"
          value={fmtList(state.personIdentifiers as Record<string, string>[] | undefined, (i) =>
            [i.scheme, i.id].filter(Boolean).join(" ")
          )}
          onEdit={() => onEdit(1)}
        />
        <Row
          label="Service address"
          value={[state.personServiceAddress, state.personServiceAddressCountry].filter(Boolean).join(", ")}
          onEdit={() => onEdit(1)}
        />
        <Row label="PEP status" value={state.personPepStatus} onEdit={() => onEdit(1)} />
      </dl>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Relationship</h2>
      <dl className="summary-list">
        <Row
          label="Nature of interest"
          value={(state.interestTypes ?? []).join(", ")}
          onEdit={() => onEdit(2)}
        />
        <Row label="Direct or indirect" value={state.directOrIndirect} onEdit={() => onEdit(2)} />
        <Row
          label="Share percentage"
          value={
            state.sharePercentageExact
              ? `${state.sharePercentageExact}%`
              : state.sharePercentageMin || state.sharePercentageMax
                ? `${state.sharePercentageMin ?? "?"}–${state.sharePercentageMax ?? "?"}%`
                : ""
          }
          onEdit={() => onEdit(2)}
        />
        <Row label="Start date" value={state.interestStartDate} onEdit={() => onEdit(2)} />
      </dl>

      <VisualisationPanel data={statements} />

      <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => download(`bods-declaration-${declarationId.slice(0, 8)}.json`, json)}
        >
          Download declaration (BODS 0.4)
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => download(`bods-statements-${declarationId.slice(0, 8)}.json`, statementsJson)}
        >
          Download statements only
        </button>
        <button type="button" className="btn btn--secondary" onClick={onReset}>
          Start again
        </button>
      </div>

      <details style={{ marginTop: 30 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>View the full BODS 0.4 JSON</summary>
        <pre className="preview-panel__json" style={{ maxHeight: 600, marginTop: 10 }}>
          {json}
        </pre>
      </details>
    </div>
  );
}
