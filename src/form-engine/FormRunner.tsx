import { useMemo } from "react";
import type {
  Component,
  FormDefinition,
  Option,
  RadiosComponent,
  CheckboxesComponent,
  RepeaterComponent,
  Step,
} from "./types";
import type { FormState } from "../bods/assembler";

interface Props {
  definition: FormDefinition;
  stepIndex: number;
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  onNext: () => void;
  onBack: () => void;
  errors?: Record<string, string>;
}

function meetsWhen(component: Component, state: FormState): boolean {
  if (!component.when) return true;
  const val = (state as Record<string, unknown>)[component.when.field];
  const { equals } = component.when;
  if (Array.isArray(equals)) return equals.includes(String(val));
  return val === equals;
}

function FieldLabel({ title, hint, bodsField, error }: { title?: string; hint?: string; bodsField?: string; error?: string }) {
  if (!title) return null;
  return (
    <>
      <span className="field-label">{title}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {bodsField && (
        <span className="field-hint" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
          → BODS field: <code>{bodsField}</code>
        </span>
      )}
      {error && <span className="field-error">Error: {error}</span>}
    </>
  );
}

function TextField({
  component,
  value,
  onChange,
  error,
}: {
  component: Extract<Component, { type: "text" | "textarea" }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const widthClass =
    component.inputWidth === "5"
      ? "field-input--width-5"
      : component.inputWidth === "10"
        ? "field-input--width-10"
        : component.inputWidth === "20"
          ? "field-input--width-20"
          : "";
  return (
    <div className={`field-group${error ? " field-group--error" : ""}`}>
      <label>
        <FieldLabel title={component.title} hint={component.hint} bodsField={component.bodsField} error={error} />
        {component.type === "textarea" ? (
          <textarea
            className="field-textarea"
            rows={4}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={component.placeholder}
          />
        ) : (
          <input
            className={`field-input ${widthClass}`}
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={component.placeholder}
          />
        )}
      </label>
    </div>
  );
}

function RadiosField({
  component,
  value,
  onChange,
  error,
}: {
  component: RadiosComponent;
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset className={`field-group${error ? " field-group--error" : ""}`} style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
      <legend>
        <FieldLabel title={component.title} hint={component.hint} bodsField={component.bodsField} error={error} />
      </legend>
      {component.options.map((opt: Option) => (
        <div className="radio-item" key={opt.value}>
          <input
            type="radio"
            id={`${component.name}-${opt.value}`}
            name={component.name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <label htmlFor={`${component.name}-${opt.value}`}>
            {opt.text}
            {opt.hint && <span className="radio-item__hint">{opt.hint}</span>}
          </label>
        </div>
      ))}
    </fieldset>
  );
}

function CheckboxesField({
  component,
  value,
  onChange,
  error,
}: {
  component: CheckboxesComponent;
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const current = value ?? [];
  const toggle = (v: string) => {
    if (current.includes(v)) onChange(current.filter((x) => x !== v));
    else onChange([...current, v]);
  };
  return (
    <fieldset className={`field-group${error ? " field-group--error" : ""}`} style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
      <legend>
        <FieldLabel title={component.title} hint={component.hint} bodsField={component.bodsField} error={error} />
      </legend>
      {component.options.map((opt) => (
        <div className="checkbox-item" key={opt.value}>
          <input
            type="checkbox"
            id={`${component.name}-${opt.value}`}
            value={opt.value}
            checked={current.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          <label htmlFor={`${component.name}-${opt.value}`}>
            {opt.text}
            {opt.hint && <span className="checkbox-item__hint">{opt.hint}</span>}
          </label>
        </div>
      ))}
    </fieldset>
  );
}

function PartialDateField({
  yearName,
  monthName,
  dayName,
  title,
  hint,
  bodsField,
  state,
  setField,
  error,
}: {
  yearName: string;
  monthName: string;
  dayName?: string;
  title?: string;
  hint?: string;
  bodsField?: string;
  state: FormState;
  setField: (key: keyof FormState, value: unknown) => void;
  error?: string;
}) {
  return (
    <fieldset className={`field-group${error ? " field-group--error" : ""}`} style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
      <legend>
        <FieldLabel title={title} hint={hint} bodsField={bodsField} error={error} />
      </legend>
      <div style={{ display: "flex", gap: 20 }}>
        <label>
          <span className="field-hint">Year</span>
          <input
            className="field-input field-input--width-5"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={(state as Record<string, string>)[yearName] ?? ""}
            onChange={(e) => setField(yearName as keyof FormState, e.target.value)}
          />
        </label>
        <label>
          <span className="field-hint">Month</span>
          <input
            className="field-input field-input--width-5"
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={(state as Record<string, string>)[monthName] ?? ""}
            onChange={(e) => setField(monthName as keyof FormState, e.target.value)}
          />
        </label>
        {dayName && (
          <label>
            <span className="field-hint">Day (optional)</span>
            <input
              className="field-input field-input--width-5"
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={(state as Record<string, string>)[dayName] ?? ""}
              onChange={(e) => setField(dayName as keyof FormState, e.target.value)}
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

function RepeaterField({
  component,
  value,
  onChange,
}: {
  component: RepeaterComponent;
  value: Record<string, string>[] | undefined;
  onChange: (v: Record<string, string>[]) => void;
}) {
  const items = value ?? [];
  const addItem = () => onChange([...items, {}]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, name: string, v: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [name]: v } : it)));
  };
  return (
    <div className="field-group">
      <FieldLabel title={component.title} hint={component.hint} bodsField={component.bodsField} />
      {items.length === 0 && (
        <p className="field-hint" style={{ marginBottom: 12 }}>
          No {component.itemTitle.toLowerCase()}s added yet.
        </p>
      )}
      {items.map((item, idx) => (
        <div className="repeater" key={idx}>
          <div className="repeater__header">
            <span className="repeater__title">
              {component.itemTitle} {idx + 1}
            </span>
            <button type="button" className="btn--link" onClick={() => removeItem(idx)}>
              Remove
            </button>
          </div>
          {component.components.map((child) => {
            if (child.type !== "text") {
              return (
                <p key={child.name} style={{ color: "red" }}>
                  (Unsupported repeater child: {child.type})
                </p>
              );
            }
            return (
              <div key={child.name} className="field-group" style={{ marginBottom: 12 }}>
                <label>
                  <FieldLabel title={child.title} hint={child.hint} />
                  <input
                    className="field-input"
                    type="text"
                    value={item[child.name] ?? ""}
                    onChange={(e) => updateItem(idx, child.name, e.target.value)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      ))}
      <button type="button" className="repeater__add" onClick={addItem}>
        + {component.addButtonText}
      </button>
    </div>
  );
}

function renderComponent(
  component: Component,
  state: FormState,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
  errors: Record<string, string>
) {
  if (!meetsWhen(component, state)) return null;
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const key = component.name;

  switch (component.type) {
    case "paragraph":
      return (
        <p key={key} className="form-lede">
          {component.body}
        </p>
      );
    case "text":
    case "textarea":
      return (
        <TextField
          key={key}
          component={component}
          value={(state as Record<string, string>)[component.name] ?? ""}
          onChange={(v) => setField(component.name as keyof FormState, v as never)}
          error={errors[component.name]}
        />
      );
    case "radios":
      return (
        <RadiosField
          key={key}
          component={component}
          value={(state as Record<string, string>)[component.name]}
          onChange={(v) => setField(component.name as keyof FormState, v as never)}
          error={errors[component.name]}
        />
      );
    case "checkboxes":
      return (
        <CheckboxesField
          key={key}
          component={component}
          value={(state as Record<string, string[]>)[component.name]}
          onChange={(v) => setField(component.name as keyof FormState, v as never)}
          error={errors[component.name]}
        />
      );
    case "partial-date":
      return (
        <PartialDateField
          key={key}
          title={component.title}
          hint={component.hint}
          bodsField={component.bodsField}
          yearName={component.yearName}
          monthName={component.monthName}
          dayName={component.dayName}
          state={state}
          setField={(fieldName, value) =>
            setState((prev) => ({ ...prev, [fieldName as string]: value }))
          }
          error={errors[component.name]}
        />
      );
    case "repeater":
      return (
        <RepeaterField
          key={key}
          component={component}
          value={(state as Record<string, Record<string, string>[]>)[component.name]}
          onChange={(v) => setField(component.name as keyof FormState, v as never)}
        />
      );
    default:
      return null;
  }
}

export function renderStep(
  step: Step,
  state: FormState,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
  errors: Record<string, string>
) {
  return step.components.map((c) => renderComponent(c, state, setState, errors));
}

export default function FormRunner({ definition, stepIndex, state, setState, onNext, onBack, errors = {} }: Props) {
  const step = definition.steps[stepIndex];
  const totalSteps = definition.steps.length;
  const body = useMemo(() => renderStep(step, state, setState, errors), [step, state, setState, errors]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      {stepIndex > 0 && (
        <button type="button" className="back-link" onClick={onBack}>
          Back
        </button>
      )}
      <div className="step-indicator">
        {definition.steps.map((s, i) => (
          <span
            className={`step-indicator__item${i === stepIndex ? " step-indicator__item--active" : ""}${i < stepIndex ? " step-indicator__item--done" : ""}`}
            key={s.id}
          >
            <span className="step-indicator__dot" />
            {s.caption ?? s.heading}
          </span>
        ))}
      </div>
      {step.caption && <p className="form-caption">{step.caption}</p>}
      <h1 className="form-heading">{step.heading}</h1>
      {step.lede && <p className="form-lede">{step.lede}</p>}
      {body}
      <div style={{ marginTop: 30 }}>
        <button type="submit" className="btn btn--primary">
          {stepIndex < totalSteps - 1 ? "Continue" : "Review your declaration"}
        </button>
      </div>
    </form>
  );
}
