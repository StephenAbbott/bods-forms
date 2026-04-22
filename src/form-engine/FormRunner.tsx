import { useMemo } from "react";
import type {
  Component,
  FormDefinition,
  Option,
  RadiosComponent,
  CheckboxesComponent,
  RepeaterComponent,
  BeneficialOwnersComponent,
  Step,
} from "./types";
import type { BeneficialOwner, FormState } from "../bods/assembler";

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

function FieldLabel({ title, hint, error }: { title?: string; hint?: string; bodsField?: string; error?: string }) {
  if (!title) return null;
  return (
    <>
      <span className="field-label">{title}</span>
      {hint && <span className="field-hint">{hint}</span>}
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

const INTEREST_TYPE_OPTIONS: Option[] = [
  { value: "shareholding", text: "Shareholding", hint: "Ownership of shares in the entity." },
  { value: "votingRights", text: "Voting rights", hint: "Rights to vote at shareholder or member meetings." },
  {
    value: "appointmentOfBoard",
    text: "Right to appoint or remove the board",
    hint: "Power to appoint or remove a majority of directors or equivalent officers.",
  },
  {
    value: "otherInfluenceOrControl",
    text: "Other significant influence or control",
    hint: "Any other means of exercising significant influence or control over the entity.",
  },
];

const DIRECT_OR_INDIRECT_OPTIONS: Option[] = [
  { value: "direct", text: "Direct" },
  { value: "indirect", text: "Indirect" },
  { value: "unknown", text: "Not known" },
];

const PEP_OPTIONS: Option[] = [
  { value: "isPep", text: "Yes, this person is a PEP" },
  { value: "isNotPep", text: "No, this person is not a PEP" },
  { value: "unknownPep", text: "Not known" },
];

function SubRepeater<T extends Record<string, string>>({
  title,
  hint,
  itemTitle,
  addButtonText,
  fields,
  value,
  onChange,
}: {
  title: string;
  hint?: string;
  itemTitle: string;
  addButtonText: string;
  fields: Array<{ name: keyof T & string; title: string; hint?: string; inputWidth?: "5" | "10" | "20" }>;
  value: T[] | undefined;
  onChange: (v: T[]) => void;
}) {
  const items = value ?? [];
  const widthClass = (w?: string) =>
    w === "5" ? "field-input--width-5" : w === "10" ? "field-input--width-10" : w === "20" ? "field-input--width-20" : "";
  return (
    <div className="field-group">
      <span className="field-label">{title}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {items.length === 0 && (
        <p className="field-hint" style={{ marginBottom: 12 }}>
          No {itemTitle.toLowerCase()}s added yet.
        </p>
      )}
      {items.map((item, idx) => (
        <div className="repeater" key={idx}>
          <div className="repeater__header">
            <span className="repeater__title">
              {itemTitle} {idx + 1}
            </span>
            <button
              type="button"
              className="btn--link"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              Remove
            </button>
          </div>
          {fields.map((f) => (
            <div key={f.name} className="field-group" style={{ marginBottom: 12 }}>
              <label>
                <span className="field-label">{f.title}</span>
                {f.hint && <span className="field-hint">{f.hint}</span>}
                <input
                  className={`field-input ${widthClass(f.inputWidth)}`}
                  type="text"
                  value={item[f.name] ?? ""}
                  onChange={(e) =>
                    onChange(items.map((it, i) => (i === idx ? { ...it, [f.name]: e.target.value } : it)))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      ))}
      <button type="button" className="repeater__add" onClick={() => onChange([...items, {} as T])}>
        + {addButtonText}
      </button>
    </div>
  );
}

function BeneficialOwnerCard({
  index,
  bo,
  onChange,
  onRemove,
  itemTitle,
  errors,
}: {
  index: number;
  bo: BeneficialOwner;
  onChange: (next: BeneficialOwner) => void;
  onRemove: () => void;
  itemTitle: string;
  errors: Record<string, string>;
}) {
  const upd = <K extends keyof BeneficialOwner>(key: K, v: BeneficialOwner[K]) =>
    onChange({ ...bo, [key]: v });
  const fieldErr = (suffix: string) => errors[`beneficialOwners[${index}].${suffix}`];

  return (
    <div className="repeater" style={{ padding: 20 }}>
      <div className="repeater__header">
        <span className="repeater__title" style={{ fontSize: 18 }}>
          {itemTitle} {index + 1}
          {bo.givenName || bo.familyName ? `: ${[bo.givenName, bo.familyName].filter(Boolean).join(" ")}` : ""}
        </span>
        <button type="button" className="btn--link" onClick={onRemove}>
          Remove
        </button>
      </div>

      <h3 style={{ fontSize: 16, marginTop: 20 }}>Identity</h3>

      <div className={`field-group${fieldErr("givenName") ? " field-group--error" : ""}`}>
        <label>
          <span className="field-label">Given name(s)</span>
          <span className="field-hint">Also called first name or forenames.</span>
          {fieldErr("givenName") && <span className="field-error">Error: {fieldErr("givenName")}</span>}
          <input
            className="field-input"
            type="text"
            value={bo.givenName ?? ""}
            onChange={(e) => upd("givenName", e.target.value)}
          />
        </label>
      </div>

      <div className={`field-group${fieldErr("familyName") ? " field-group--error" : ""}`}>
        <label>
          <span className="field-label">Family name</span>
          <span className="field-hint">Also called surname or last name.</span>
          {fieldErr("familyName") && <span className="field-error">Error: {fieldErr("familyName")}</span>}
          <input
            className="field-input"
            type="text"
            value={bo.familyName ?? ""}
            onChange={(e) => upd("familyName", e.target.value)}
          />
        </label>
      </div>

      <SubRepeater
        title="Other names the person is known by (optional)"
        hint="Include transliterations, former names, or aliases."
        itemTitle="Alternate name"
        addButtonText="Add another name"
        fields={[{ name: "fullName", title: "Full name" }]}
        value={bo.alternateNames as Array<{ fullName: string }> | undefined}
        onChange={(v) => upd("alternateNames", v)}
      />

      <fieldset className="field-group" style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
        <legend>
          <span className="field-label">Date of birth</span>
          <span className="field-hint">Month and year are recorded by default. Day is optional.</span>
        </legend>
        <div style={{ display: "flex", gap: 20 }}>
          <label>
            <span className="field-hint">Year</span>
            <input
              className="field-input field-input--width-5"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={bo.birthYear ?? ""}
              onChange={(e) => upd("birthYear", e.target.value)}
            />
          </label>
          <label>
            <span className="field-hint">Month</span>
            <input
              className="field-input field-input--width-5"
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={bo.birthMonth ?? ""}
              onChange={(e) => upd("birthMonth", e.target.value)}
            />
          </label>
          <label>
            <span className="field-hint">Day (optional)</span>
            <input
              className="field-input field-input--width-5"
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={bo.birthDay ?? ""}
              onChange={(e) => upd("birthDay", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <SubRepeater
        title="Nationalities"
        hint="Add all nationalities the person holds."
        itemTitle="Nationality"
        addButtonText="Add another nationality"
        fields={[
          { name: "code", title: "Country code", hint: "ISO 3166-1 alpha-2, e.g. GB, NG, KE.", inputWidth: "5" },
          { name: "name", title: "Country name (optional)" },
        ]}
        value={bo.nationalities as Array<{ code: string; name: string }> | undefined}
        onChange={(v) => upd("nationalities", v)}
      />

      <SubRepeater
        title="Tax residencies (optional)"
        hint="Countries where the person is currently tax-resident. Often different from nationality."
        itemTitle="Tax residency"
        addButtonText="Add another tax residency"
        fields={[
          { name: "code", title: "Country code", hint: "ISO 3166-1 alpha-2.", inputWidth: "5" },
          { name: "name", title: "Country name (optional)" },
        ]}
        value={bo.taxResidencies as Array<{ code: string; name: string }> | undefined}
        onChange={(v) => upd("taxResidencies", v)}
      />

      <SubRepeater
        title="Identifiers (optional)"
        hint="National ID number, passport number, tax ID, etc. Each needs a scheme and a value."
        itemTitle="Identifier"
        addButtonText="Add another identifier"
        fields={[
          {
            name: "scheme",
            title: "Scheme code",
            hint: "e.g. GB-NINO for a UK National Insurance Number.",
            inputWidth: "20",
          },
          { name: "schemeName", title: "Scheme name (optional)" },
          { name: "id", title: "Identifier value" },
        ]}
        value={bo.identifiers as Array<{ scheme: string; schemeName: string; id: string }> | undefined}
        onChange={(v) => upd("identifiers", v)}
      />

      <div className="field-group">
        <label>
          <span className="field-label">Service address (optional)</span>
          <span className="field-hint">An address for correspondence. Can be a business address rather than home.</span>
          <textarea
            className="field-textarea"
            rows={4}
            value={bo.serviceAddress ?? ""}
            onChange={(e) => upd("serviceAddress", e.target.value)}
          />
        </label>
      </div>

      <div className="field-group">
        <label>
          <span className="field-label">Country of service address (optional)</span>
          <span className="field-hint">ISO 3166-1 alpha-2 code.</span>
          <input
            className="field-input field-input--width-5"
            type="text"
            value={bo.serviceAddressCountry ?? ""}
            onChange={(e) => upd("serviceAddressCountry", e.target.value)}
          />
        </label>
      </div>

      <fieldset className="field-group" style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
        <legend>
          <span className="field-label">Is this person a politically exposed person (PEP)?</span>
          <span className="field-hint">
            A PEP is someone entrusted with a prominent public function, or a close associate/family member of one.
          </span>
        </legend>
        {PEP_OPTIONS.map((opt) => (
          <div className="radio-item" key={opt.value}>
            <input
              type="radio"
              id={`bo-${index}-pep-${opt.value}`}
              name={`bo-${index}-pep`}
              value={opt.value}
              checked={bo.pepStatus === opt.value}
              onChange={() => upd("pepStatus", opt.value as BeneficialOwner["pepStatus"])}
            />
            <label htmlFor={`bo-${index}-pep-${opt.value}`}>{opt.text}</label>
          </div>
        ))}
      </fieldset>

      <h3 style={{ fontSize: 16, marginTop: 30 }}>Relationship with the entity</h3>

      <fieldset
        className={`field-group${fieldErr("interestTypes") ? " field-group--error" : ""}`}
        style={{ border: "none", padding: 0, margin: "0 0 25px" }}
      >
        <legend>
          <span className="field-label">Nature of the interest</span>
          <span className="field-hint">Tick all that apply.</span>
          {fieldErr("interestTypes") && <span className="field-error">Error: {fieldErr("interestTypes")}</span>}
        </legend>
        {INTEREST_TYPE_OPTIONS.map((opt) => {
          const current = bo.interestTypes ?? [];
          const checked = current.includes(opt.value as never);
          return (
            <div className="checkbox-item" key={opt.value}>
              <input
                type="checkbox"
                id={`bo-${index}-interest-${opt.value}`}
                value={opt.value}
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? current.filter((x) => x !== opt.value)
                    : [...current, opt.value as never];
                  upd("interestTypes", next);
                }}
              />
              <label htmlFor={`bo-${index}-interest-${opt.value}`}>
                {opt.text}
                {opt.hint && <span className="checkbox-item__hint">{opt.hint}</span>}
              </label>
            </div>
          );
        })}
      </fieldset>

      <fieldset className="field-group" style={{ border: "none", padding: 0, margin: "0 0 25px" }}>
        <legend>
          <span className="field-label">Is the interest held directly or indirectly?</span>
          <span className="field-hint">
            Direct: the person holds the interest in their own name. Indirect: held via intermediary entities.
          </span>
        </legend>
        {DIRECT_OR_INDIRECT_OPTIONS.map((opt) => (
          <div className="radio-item" key={opt.value}>
            <input
              type="radio"
              id={`bo-${index}-doi-${opt.value}`}
              name={`bo-${index}-doi`}
              value={opt.value}
              checked={bo.directOrIndirect === opt.value}
              onChange={() => upd("directOrIndirect", opt.value as BeneficialOwner["directOrIndirect"])}
            />
            <label htmlFor={`bo-${index}-doi-${opt.value}`}>{opt.text}</label>
          </div>
        ))}
      </fieldset>

      <div className="field-group">
        <label>
          <span className="field-label">Percentage of interest (optional)</span>
          <span className="field-hint">
            If the exact percentage is known, enter it here (0–100). Otherwise use the range below.
          </span>
          <input
            className="field-input field-input--width-5"
            type="text"
            inputMode="decimal"
            value={bo.sharePercentageExact ?? ""}
            onChange={(e) => upd("sharePercentageExact", e.target.value)}
          />
        </label>
      </div>

      <div className="field-group">
        <label>
          <span className="field-label">Minimum percentage (optional)</span>
          <span className="field-hint">Use when only a range is known (e.g. 25).</span>
          <input
            className="field-input field-input--width-5"
            type="text"
            inputMode="decimal"
            value={bo.sharePercentageMin ?? ""}
            onChange={(e) => upd("sharePercentageMin", e.target.value)}
          />
        </label>
      </div>

      <div className="field-group">
        <label>
          <span className="field-label">Maximum percentage (optional)</span>
          <span className="field-hint">Use with the minimum above (e.g. 50).</span>
          <input
            className="field-input field-input--width-5"
            type="text"
            inputMode="decimal"
            value={bo.sharePercentageMax ?? ""}
            onChange={(e) => upd("sharePercentageMax", e.target.value)}
          />
        </label>
      </div>

      <div className="field-group">
        <label>
          <span className="field-label">Date the interest started (optional)</span>
          <span className="field-hint">Format: YYYY-MM-DD, YYYY-MM, or YYYY.</span>
          <input
            className="field-input field-input--width-10"
            type="text"
            value={bo.interestStartDate ?? ""}
            onChange={(e) => upd("interestStartDate", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function BeneficialOwnersField({
  component,
  value,
  onChange,
  errors,
}: {
  component: BeneficialOwnersComponent;
  value: BeneficialOwner[] | undefined;
  onChange: (v: BeneficialOwner[]) => void;
  errors: Record<string, string>;
}) {
  const items = value ?? [];
  const topErr = errors[component.name];
  return (
    <div className={`field-group${topErr ? " field-group--error" : ""}`}>
      {component.title && <span className="field-label">{component.title}</span>}
      {component.hint && <span className="field-hint">{component.hint}</span>}
      {topErr && <span className="field-error">Error: {topErr}</span>}
      {items.length === 0 && (
        <p className="field-hint" style={{ marginBottom: 12 }}>
          No beneficial owners added yet. Add at least one.
        </p>
      )}
      {items.map((bo, idx) => (
        <BeneficialOwnerCard
          key={idx}
          index={idx}
          bo={bo}
          itemTitle={component.itemTitle}
          errors={errors}
          onChange={(next) => onChange(items.map((it, i) => (i === idx ? next : it)))}
          onRemove={() => onChange(items.filter((_, i) => i !== idx))}
        />
      ))}
      <button type="button" className="repeater__add" onClick={() => onChange([...items, {}])}>
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
    case "beneficial-owners":
      return (
        <BeneficialOwnersField
          key={key}
          component={component}
          value={state.beneficialOwners}
          onChange={(v) => setField("beneficialOwners", v)}
          errors={errors}
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
