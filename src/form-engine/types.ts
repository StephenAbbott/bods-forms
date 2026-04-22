/**
 * Form JSON schema — patterned after XGovFormBuilder's form-definition schema
 * (pages, components, conditions) but simplified for this project's scope.
 *
 * A form is a list of steps. Each step has a list of components. Components are
 * rendered in order. `when` clauses let a component be hidden unless another
 * field has a given value.
 */

export type ComponentType =
  | "paragraph"
  | "text"
  | "textarea"
  | "radios"
  | "checkboxes"
  | "select"
  | "partial-date"
  | "repeater";

export interface Option {
  value: string;
  text: string;
  hint?: string;
  bodsNote?: string;
}

export interface BaseComponent {
  type: ComponentType;
  name: string;
  title?: string;
  hint?: string;
  required?: boolean;
  classes?: string;
  when?: { field: string; equals: string | string[] };
  bodsField?: string; // informational: where this lands in BODS
}

export interface ParagraphComponent extends BaseComponent {
  type: "paragraph";
  body: string;
}

export interface TextComponent extends BaseComponent {
  type: "text" | "textarea";
  placeholder?: string;
  inputWidth?: "5" | "10" | "20" | "full";
}

export interface RadiosComponent extends BaseComponent {
  type: "radios";
  options: Option[];
}

export interface CheckboxesComponent extends BaseComponent {
  type: "checkboxes";
  options: Option[];
}

export interface SelectComponent extends BaseComponent {
  type: "select";
  options: Option[];
}

export interface PartialDateComponent extends BaseComponent {
  type: "partial-date";
  yearName: string;
  monthName: string;
  dayName?: string;
}

export interface RepeaterComponent extends BaseComponent {
  type: "repeater";
  addButtonText: string;
  itemTitle: string;
  components: Component[];
}

export type Component =
  | ParagraphComponent
  | TextComponent
  | RadiosComponent
  | CheckboxesComponent
  | SelectComponent
  | PartialDateComponent
  | RepeaterComponent;

export interface Step {
  id: string;
  path: string;
  heading: string;
  caption?: string;
  lede?: string;
  emits: string; // description of what BODS statement(s) this step emits
  components: Component[];
}

export interface FormDefinition {
  metadata: {
    title: string;
    version: string;
    bodsVersion: "0.4";
    description?: string;
  };
  steps: Step[];
}
