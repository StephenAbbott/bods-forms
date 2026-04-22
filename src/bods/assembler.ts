/**
 * Assembles flat form state into a BODS v0.4 publication — one entity statement,
 * one person statement, one ownership-or-control statement linking them.
 *
 * This file is the single source of truth for how the form's field names map to
 * BODS fields. When adding a new field to the form definition, update this file.
 */

import { v5 as uuidv5 } from "uuid";
import type {
  DeclarationRecord,
  EntityStatement,
  EntityTypeValue,
  EntitySubtype,
  Identifier,
  Interest,
  InterestType,
  Nationality,
  OwnershipOrControlStatement,
  PersonStatement,
  Statement,
  TaxResidency,
} from "./types";

// Stable namespace for deterministic UUIDv5 statement IDs — same form state yields
// the same IDs, which makes diffing and live preview cleaner.
const NS = "a6b69e28-4fa3-4a9f-b19f-8a6f3b8f9a5e";

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

  // Person step
  personGivenName?: string;
  personFamilyName?: string;
  personAlternateNames?: Array<{ fullName?: string }>;
  personBirthYear?: string;
  personBirthMonth?: string;
  personBirthDay?: string;
  personNationalities?: Array<{ code?: string; name?: string }>;
  personTaxResidencies?: Array<{ code?: string; name?: string }>;
  personIdentifiers?: Array<{ scheme?: string; id?: string; schemeName?: string }>;
  personServiceAddress?: string;
  personServiceAddressCountry?: string;
  personPepStatus?: "isPep" | "isNotPep" | "unknownPep";

  // Relationship step
  interestTypes?: InterestType[];
  sharePercentageMin?: string;
  sharePercentageMax?: string;
  sharePercentageExact?: string;
  directOrIndirect?: "direct" | "indirect" | "unknown";
  interestStartDate?: string;
}

const statementId = (kind: string, name: string | undefined) =>
  uuidv5(`${kind}::${name ?? "unnamed"}`, NS);

const recordId = (kind: string, name: string | undefined) =>
  uuidv5(`record::${kind}::${name ?? "unnamed"}`, NS);

const todayIso = () => new Date().toISOString().slice(0, 10);

function nonEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

function assembleBirthDate(state: FormState): string | undefined {
  const y = state.personBirthYear?.trim();
  const m = state.personBirthMonth?.trim().padStart(2, "0");
  const d = state.personBirthDay?.trim().padStart(2, "0");
  if (!y) return undefined;
  if (!m) return y;
  if (!d) return `${y}-${m}`;
  return `${y}-${m}-${d}`;
}

export function buildEntityStatement(state: FormState, declarationId: string): EntityStatement | undefined {
  if (!state.entityName && !state.entityType) return undefined;
  const sid = statementId("entity", state.entityName);
  const rid = recordId("entity", state.entityName);
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
    statementId: sid,
    declarationSubject: declarationId,
    recordId: rid,
    recordType: "entityStatement",
    recordStatus: "new",
    statementDate: todayIso(),
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
            country: state.entityAddressCountry || undefined,
          },
        ]
      : undefined,
  };
}

export function buildPersonStatement(state: FormState, declarationId: string): PersonStatement | undefined {
  if (!state.personGivenName && !state.personFamilyName) return undefined;
  const fullName = [state.personGivenName, state.personFamilyName].filter(Boolean).join(" ");
  const sid = statementId("person", fullName);
  const rid = recordId("person", fullName);

  const identifiers: Identifier[] | undefined = nonEmpty(
    (state.personIdentifiers ?? [])
      .filter((i) => i.id)
      .map((i) => ({
        id: i.id!,
        scheme: i.scheme || undefined,
        schemeName: i.schemeName || undefined,
      }))
  );

  const nationalities: Nationality[] | undefined = nonEmpty(
    (state.personNationalities ?? [])
      .filter((n) => n.code || n.name)
      .map((n) => ({ code: n.code || undefined, name: n.name || undefined }))
  );

  const taxResidencies: TaxResidency[] | undefined = nonEmpty(
    (state.personTaxResidencies ?? [])
      .filter((t) => t.code || t.name)
      .map((t) => ({ code: t.code || undefined, name: t.name || undefined }))
  );

  const alternateNames = nonEmpty(
    (state.personAlternateNames ?? [])
      .filter((n) => n.fullName)
      .map((n) => ({
        type: "alias" as const,
        fullName: n.fullName!,
      }))
  );

  return {
    statementId: sid,
    declarationSubject: declarationId,
    recordId: rid,
    recordType: "personStatement",
    recordStatus: "new",
    statementDate: todayIso(),
    personType: "knownPerson",
    names: [
      {
        type: "individual",
        fullName,
        givenName: state.personGivenName,
        familyName: state.personFamilyName,
      },
      ...(alternateNames ?? []),
    ],
    identifiers,
    nationalities,
    taxResidencies,
    birthDate: assembleBirthDate(state),
    addresses: state.personServiceAddress
      ? [
          {
            type: "service",
            address: state.personServiceAddress,
            country: state.personServiceAddressCountry || undefined,
          },
        ]
      : undefined,
    pepStatus: state.personPepStatus,
  };
}

export function buildOwnershipOrControlStatement(
  state: FormState,
  declarationId: string,
  entity: EntityStatement | undefined,
  person: PersonStatement | undefined
): OwnershipOrControlStatement | undefined {
  if (!entity || !person) return undefined;
  if (!state.interestTypes || state.interestTypes.length === 0) return undefined;
  const sid = statementId("ooc", `${entity.statementId}::${person.statementId}`);
  const rid = recordId("ooc", `${entity.statementId}::${person.statementId}`);
  const share =
    state.sharePercentageExact
      ? { exact: Number(state.sharePercentageExact) }
      : state.sharePercentageMin || state.sharePercentageMax
        ? {
            minimum: state.sharePercentageMin ? Number(state.sharePercentageMin) : undefined,
            maximum: state.sharePercentageMax ? Number(state.sharePercentageMax) : undefined,
          }
        : undefined;

  const interests: Interest[] = state.interestTypes.map((t) => ({
    type: t,
    directOrIndirect: state.directOrIndirect,
    beneficialOwnershipOrControl: true,
    share,
    startDate: state.interestStartDate || undefined,
  }));

  return {
    statementId: sid,
    declarationSubject: declarationId,
    recordId: rid,
    recordType: "ownershipOrControlStatement",
    recordStatus: "new",
    statementDate: todayIso(),
    subject: { describedByEntityStatement: entity.statementId },
    interestedParty: { describedByPersonStatement: person.statementId },
    interests,
  };
}

/**
 * Build a partial BODS array from whatever fields are populated so far.
 * Designed to be called on every keystroke for the live preview panel —
 * safe to call at any point in the form's lifecycle.
 */
export function buildStatements(state: FormState, declarationId: string): Statement[] {
  const entity = buildEntityStatement(state, declarationId);
  const person = buildPersonStatement(state, declarationId);
  const ooc = buildOwnershipOrControlStatement(state, declarationId, entity, person);
  return [entity, person, ooc].filter(Boolean) as Statement[];
}

/**
 * Wrap emitted statements in a full BODS 0.4 DeclarationRecord for download.
 */
export function buildDeclaration(state: FormState, declarationId: string): DeclarationRecord {
  const records = buildStatements(state, declarationId);
  return {
    declarationId,
    statementDate: todayIso(),
    publicationDetails: {
      bodsVersion: "0.4",
      publicationDate: todayIso(),
      publisher: {
        name: "bods-forms",
        url: "https://github.com/StephenAbbott/bods-forms",
      },
    },
    records,
    source: {
      type: ["selfDeclaration"],
      description:
        "Data self-declared via bods-forms — collected using guided questions and emitted as BODS 0.4.",
    },
  };
}

export function newDeclarationId(): string {
  return uuidv5(`declaration::${Date.now()}::${Math.random()}`, NS);
}
