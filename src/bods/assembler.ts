/**
 * Assembles flat form state into a BODS v0.4 publication — one entity statement,
 * plus one person statement and one relationship statement per beneficial owner
 * declared in the form. Emits wire-format BODS 0.4 (recordType + recordDetails).
 *
 * This file is the single source of truth for how the form's field names map to
 * BODS fields. When adding a new field to the form definition, update this file.
 */

import { v5 as uuidv5 } from "uuid";
import type {
  EntityStatement,
  EntityTypeValue,
  EntitySubtype,
  Identifier,
  Interest,
  InterestType,
  Nationality,
  PersonStatement,
  PublicationDetails,
  RelationshipStatement,
  Statement,
  TaxResidency,
} from "./types";

// Stable namespace for deterministic UUIDv5 IDs — same form state yields the
// same IDs, so live-preview diffs are stable.
const NS = "a6b69e28-4fa3-4a9f-b19f-8a6f3b8f9a5e";

export interface BeneficialOwner {
  givenName?: string;
  familyName?: string;
  alternateNames?: Array<{ fullName?: string }>;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  nationalities?: Array<{ code?: string; name?: string }>;
  taxResidencies?: Array<{ code?: string; name?: string }>;
  identifiers?: Array<{ scheme?: string; id?: string; schemeName?: string }>;
  serviceAddress?: string;
  serviceAddressCountry?: string;
  pepStatus?: "isPep" | "isNotPep" | "unknownPep";

  interestTypes?: InterestType[];
  sharePercentageMin?: string;
  sharePercentageMax?: string;
  sharePercentageExact?: string;
  directOrIndirect?: "direct" | "indirect" | "unknown";
  interestStartDate?: string;
}

export interface FormState {
  // Entity step
  entityType?: EntityTypeValue;
  entitySubtype?: EntitySubtype;
  entityName?: string;
  entityIdentifiers?: Array<{ scheme?: string; id?: string; schemeName?: string }>;
  entityJurisdictionCode?: string;
  entityJurisdictionName?: string;
  entityFoundingDate?: string;
  entityRegisteredAddress?: string;
  entityAddressCountry?: string;

  // Beneficial owners (one person + relationship statement each)
  beneficialOwners?: BeneficialOwner[];
}

const idFor = (kind: string, key: string | undefined) =>
  uuidv5(`${kind}::${key ?? "unnamed"}`, NS);

const todayIso = () => new Date().toISOString().slice(0, 10);

function nonEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

function assembleBirthDate(bo: BeneficialOwner): string | undefined {
  const y = bo.birthYear?.trim();
  const m = bo.birthMonth?.trim().padStart(2, "0");
  const d = bo.birthDay?.trim().padStart(2, "0");
  if (!y) return undefined;
  if (!m) return y;
  if (!d) return `${y}-${m}`;
  return `${y}-${m}-${d}`;
}

const publicationDetails: PublicationDetails = {
  bodsVersion: "0.4",
  publicationDate: todayIso(),
  publisher: {
    name: "bods-forms",
    url: "https://github.com/StephenAbbott/bods-forms",
  },
};

const source = {
  type: ["selfDeclaration" as const],
  description: "Data self-declared via bods-forms.",
};

function entityRecordId(state: FormState): string | undefined {
  if (!state.entityName && !state.entityType) return undefined;
  return idFor("entity-record", state.entityName);
}

function personFullName(bo: BeneficialOwner): string {
  return [bo.givenName, bo.familyName].filter(Boolean).join(" ");
}

function personRecordId(bo: BeneficialOwner, index: number): string | undefined {
  if (!bo.givenName && !bo.familyName) return undefined;
  // Include the index in the key so two BOs with the same name still get
  // distinct records.
  return idFor("person-record", `${index}::${personFullName(bo)}`);
}

export function buildEntityStatement(
  state: FormState,
  declarationSubject: string
): EntityStatement | undefined {
  const rid = entityRecordId(state);
  if (!rid) return undefined;

  const identifiers: Identifier[] | undefined = nonEmpty(
    (state.entityIdentifiers ?? [])
      .filter((i) => i.id)
      .map((i) => ({
        id: i.id!,
        scheme: i.scheme || undefined,
        schemeName: i.schemeName || undefined,
      }))
  );

  return {
    statementId: idFor("entity-stmt", state.entityName),
    declarationSubject,
    recordId: rid,
    recordType: "entity",
    recordStatus: "new",
    statementDate: todayIso(),
    publicationDetails,
    source,
    recordDetails: {
      isComponent: false,
      entityType: {
        type: state.entityType ?? "registeredEntity",
        subtype: state.entitySubtype,
      },
      name: state.entityName,
      identifiers,
      jurisdiction:
        state.entityJurisdictionCode || state.entityJurisdictionName
          ? {
              code: state.entityJurisdictionCode || undefined,
              name: state.entityJurisdictionName || undefined,
            }
          : undefined,
      foundingDate: state.entityFoundingDate || undefined,
      addresses: state.entityRegisteredAddress
        ? [
            {
              type: "registered",
              address: state.entityRegisteredAddress,
              country: state.entityAddressCountry
                ? { code: state.entityAddressCountry }
                : undefined,
            },
          ]
        : undefined,
    },
  };
}

export function buildPersonStatement(
  bo: BeneficialOwner,
  index: number,
  declarationSubject: string
): PersonStatement | undefined {
  const rid = personRecordId(bo, index);
  if (!rid) return undefined;
  const fullName = personFullName(bo);

  const identifiers: Identifier[] | undefined = nonEmpty(
    (bo.identifiers ?? [])
      .filter((i) => i.id)
      .map((i) => ({
        id: i.id!,
        scheme: i.scheme || undefined,
        schemeName: i.schemeName || undefined,
      }))
  );

  const nationalities: Nationality[] | undefined = nonEmpty(
    (bo.nationalities ?? [])
      .filter((n) => n.code || n.name)
      .map((n) => ({ code: n.code || undefined, name: n.name || undefined }))
  );

  const taxResidencies: TaxResidency[] | undefined = nonEmpty(
    (bo.taxResidencies ?? [])
      .filter((t) => t.code || t.name)
      .map((t) => ({ code: t.code || undefined, name: t.name || undefined }))
  );

  const alternateNames = nonEmpty(
    (bo.alternateNames ?? [])
      .filter((n) => n.fullName)
      .map((n) => ({ type: "alias" as const, fullName: n.fullName! }))
  );

  return {
    statementId: idFor("person-stmt", `${index}::${fullName}`),
    declarationSubject,
    recordId: rid,
    recordType: "person",
    recordStatus: "new",
    statementDate: todayIso(),
    publicationDetails,
    source,
    recordDetails: {
      isComponent: false,
      personType: "knownPerson",
      names: [
        {
          type: "legal",
          fullName,
          givenName: bo.givenName,
          familyName: bo.familyName,
        },
        ...(alternateNames ?? []),
      ],
      identifiers,
      nationalities,
      taxResidencies,
      birthDate: assembleBirthDate(bo),
      addresses: bo.serviceAddress
        ? [
            {
              type: "service",
              address: bo.serviceAddress,
              country: bo.serviceAddressCountry
                ? { code: bo.serviceAddressCountry }
                : undefined,
            },
          ]
        : undefined,
      pepStatus: bo.pepStatus,
    },
  };
}

export function buildRelationshipStatement(
  bo: BeneficialOwner,
  declarationSubject: string,
  entity: EntityStatement | undefined,
  person: PersonStatement | undefined
): RelationshipStatement | undefined {
  if (!entity || !person) return undefined;
  if (!bo.interestTypes || bo.interestTypes.length === 0) return undefined;

  const key = `${entity.recordId}::${person.recordId}`;
  const share = bo.sharePercentageExact
    ? { exact: Number(bo.sharePercentageExact) }
    : bo.sharePercentageMin || bo.sharePercentageMax
      ? {
          minimum: bo.sharePercentageMin ? Number(bo.sharePercentageMin) : undefined,
          maximum: bo.sharePercentageMax ? Number(bo.sharePercentageMax) : undefined,
        }
      : undefined;

  const interests: Interest[] = bo.interestTypes.map((t) => ({
    type: t,
    directOrIndirect: bo.directOrIndirect,
    beneficialOwnershipOrControl: true,
    share,
    startDate: bo.interestStartDate || undefined,
  }));

  return {
    statementId: idFor("rel-stmt", key),
    declarationSubject,
    recordId: idFor("rel-record", key),
    recordType: "relationship",
    recordStatus: "new",
    statementDate: todayIso(),
    publicationDetails,
    source,
    recordDetails: {
      isComponent: false,
      subject: entity.recordId,
      interestedParty: person.recordId,
      interests,
    },
  };
}

/**
 * Build a partial BODS 0.4 publication from whatever fields are populated so far.
 * Safe to call at any point in the form's lifecycle — filters out statements
 * whose identity isn't known yet.
 *
 * The `declarationId` parameter is kept for API compatibility but is ignored:
 * `declarationSubject` is derived from the entity's recordId (which is what a
 * BODS 0.4 declaration is about).
 */
export function buildStatements(state: FormState, _declarationId: string): Statement[] {
  const subjectRecordId = entityRecordId(state) ?? _declarationId;
  const entity = buildEntityStatement(state, subjectRecordId);
  const out: Statement[] = [];
  if (entity) out.push(entity);
  (state.beneficialOwners ?? []).forEach((bo, idx) => {
    const person = buildPersonStatement(bo, idx, subjectRecordId);
    if (person) out.push(person);
    const rel = buildRelationshipStatement(bo, subjectRecordId, entity, person);
    if (rel) out.push(rel);
  });
  return out;
}

export function newDeclarationId(): string {
  return uuidv5(`declaration::${Date.now()}::${Math.random()}`, NS);
}
