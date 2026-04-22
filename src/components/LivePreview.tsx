import { useEffect, useMemo, useState } from "react";
import type { Statement } from "../bods/types";

interface ValidationResult {
  valid: boolean;
  schema_valid?: boolean;
  schema_version?: string;
  schema_errors?: Array<{ message?: string; path?: string; validator?: string }>;
  additional_checks?: Array<{ type: string; description?: string; level?: string }>;
  advice?: Array<string | { message: string }>;
  statistics?: Record<string, number>;
  error?: string;
  error_type?: string;
}

interface Props {
  statements: Statement[];
}

const VALIDATOR_PATH = "/api/validate";

function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function LivePreview({ statements }: Props) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreachable, setUnreachable] = useState(false);

  const json = useMemo(() => JSON.stringify(statements, null, 2), [statements]);

  useEffect(() => {
    if (statements.length === 0) {
      setResult(null);
      return;
    }
    const run = debounce(async (payload: Statement[]) => {
      setLoading(true);
      try {
        const res = await fetch(VALIDATOR_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as ValidationResult;
        setResult(body);
        setUnreachable(false);
      } catch {
        setUnreachable(true);
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 400);
    run(statements);
  }, [statements]);

  const status = loading
    ? { cls: "", text: "Validating…" }
    : unreachable
      ? { cls: "", text: "Validator unreachable" }
      : !result
        ? { cls: "", text: "No data yet" }
        : result.valid
          ? { cls: "preview-panel__header__status-dot--ok", text: "Valid BODS 0.4" }
          : result.schema_valid === false
            ? { cls: "preview-panel__header__status-dot--err", text: "Schema errors" }
            : { cls: "preview-panel__header__status-dot--warn", text: "Warnings" };

  const missingRequired = (result?.schema_errors ?? []).filter((e) => e.validator === "required");
  const otherErrors = (result?.schema_errors ?? []).filter((e) => e.validator !== "required");

  return (
    <aside className="preview-panel" aria-label="Live BODS preview">
      <div className="preview-panel__header">
        <span>Live BODS preview</span>
        <span className="preview-panel__header__status">
          <span className={`preview-panel__header__status-dot ${status.cls}`} />
          {status.text}
        </span>
      </div>
      <div className="preview-panel__body">
        {statements.length === 0 ? (
          <p className="field-hint" style={{ margin: 0 }}>
            As you fill in the form, the BODS 0.4 JSON will appear here.
          </p>
        ) : (
          <pre className="preview-panel__json" aria-label="BODS JSON preview">
            {json}
          </pre>
        )}
        {result && missingRequired.length > 0 && (
          <div className="preview-panel__errors">
            <strong>{missingRequired.length} required field(s) still missing:</strong>
            <ul>
              {missingRequired.slice(0, 6).map((e, i) => (
                <li key={i}>
                  <code>{e.path || "(root)"}</code> — {e.message}
                </li>
              ))}
              {missingRequired.length > 6 && <li>…and {missingRequired.length - 6} more</li>}
            </ul>
          </div>
        )}
        {result && otherErrors.length > 0 && (
          <div className="preview-panel__errors">
            <strong>{otherErrors.length} schema error(s):</strong>
            <ul>
              {otherErrors.slice(0, 6).map((e, i) => (
                <li key={i}>
                  <code>{e.path || "(root)"}</code> — {e.message}
                </li>
              ))}
              {otherErrors.length > 6 && <li>…and {otherErrors.length - 6} more</li>}
            </ul>
          </div>
        )}
      </div>
      <p className="preview-panel__footnote">
        Validated live against the BODS 0.4 schema by{" "}
        <a href="https://github.com/StephenAbbott/bods-validator" target="_blank" rel="noreferrer">
          bods-validator
        </a>{" "}
        (lib-cove-bods).
      </p>
    </aside>
  );
}
