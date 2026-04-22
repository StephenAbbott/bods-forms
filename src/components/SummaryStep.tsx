import { useMemo } from "react";
import type { BeneficialOwner, FormState } from "../bods/assembler";
import { buildStatements } from "../bods/assembler";
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

function sharePct(bo: BeneficialOwner): string {
  if (bo.sharePercentageExact) return `${bo.sharePercentageExact}%`;
  if (bo.sharePercentageMin || bo.sharePercentageMax) {
    return `${bo.sharePercentageMin ?? "?"}–${bo.sharePercentageMax ?? "?"}%`;
  }
  return "";
}

function BeneficialOwnerSummary({ bo, index, onEdit }: { bo: BeneficialOwner; index: number; onEdit: () => void }) {
  const title = [bo.givenName, bo.familyName].filter(Boolean).join(" ") || `Beneficial owner ${index + 1}`;
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 18, margin: "0 0 10px" }}>{title}</h3>
      <dl className="summary-list">
        <Row
          label="Name"
          value={[bo.givenName, bo.familyName].filter(Boolean).join(" ")}
          onEdit={onEdit}
        />
        <Row
          label="Other names"
          value={fmtList(bo.alternateNames as Record<string, string>[] | undefined, (i) => i.fullName ?? "")}
          onEdit={onEdit}
        />
        <Row
          label="Date of birth"
          value={[bo.birthYear, bo.birthMonth, bo.birthDay].filter(Boolean).join("-")}
          onEdit={onEdit}
        />
        <Row
          label="Nationalities"
          value={fmtList(bo.nationalities as Record<string, string>[] | undefined, (i) => i.code ?? i.name ?? "")}
          onEdit={onEdit}
        />
        <Row
          label="Tax residencies"
          value={fmtList(bo.taxResidencies as Record<string, string>[] | undefined, (i) => i.code ?? i.name ?? "")}
          onEdit={onEdit}
        />
        <Row
          label="Identifiers"
          value={fmtList(bo.identifiers as Record<string, string>[] | undefined, (i) =>
            [i.scheme, i.id].filter(Boolean).join(" ")
          )}
          onEdit={onEdit}
        />
        <Row
          label="Service address"
          value={[bo.serviceAddress, bo.serviceAddressCountry].filter(Boolean).join(", ")}
          onEdit={onEdit}
        />
        <Row label="PEP status" value={bo.pepStatus} onEdit={onEdit} />
        <Row label="Nature of interest" value={(bo.interestTypes ?? []).join(", ")} onEdit={onEdit} />
        <Row label="Direct or indirect" value={bo.directOrIndirect} onEdit={onEdit} />
        <Row label="Share percentage" value={sharePct(bo)} onEdit={onEdit} />
        <Row label="Start date" value={bo.interestStartDate} onEdit={onEdit} />
      </dl>
    </div>
  );
}

export default function SummaryStep({ state, declarationId, onBack, onEdit, onReset }: Props) {
  const statements = useMemo(() => buildStatements(state, declarationId), [state, declarationId]);
  const json = useMemo(() => JSON.stringify(statements, null, 2), [statements]);
  const owners = state.beneficialOwners ?? [];

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

      <h2 style={{ fontSize: 22, marginTop: 30 }}>
        Beneficial owners {owners.length > 0 ? `(${owners.length})` : ""}
      </h2>
      {owners.length === 0 ? (
        <p className="field-hint">No beneficial owners added.</p>
      ) : (
        owners.map((bo, idx) => (
          <BeneficialOwnerSummary key={idx} bo={bo} index={idx} onEdit={() => onEdit(1)} />
        ))
      )}

      <VisualisationPanel data={statements} />

      <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => download(`bods-declaration-${declarationId.slice(0, 8)}.json`, json)}
        >
          Download BODS 0.4 JSON
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
