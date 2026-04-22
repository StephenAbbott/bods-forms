/**
 * BODS v0.4 wire-format types — minimum subset needed for this form.
 *
 * Full schema: https://standard.openownership.org/en/0.4.0/standard/reference.html
 *
 * In BODS 0.4 every statement has a flat header (statementId, recordId,
 * recordType, declarationSubject, publicationDetails, source) plus a
 * `recordDetails` object carrying the type-specific content. The BODS
 * visualisation library (bods-dagre) expects exactly this shape.
 */

export type RecordType = "entity" | "person" | "relationship";

export type EntityTypeValue =
  | "registeredEntity"
  | "legalEntity"
  | "arrangement"
  | "legalPerson"
  | "anonymousEntity"
  | "unknownEntity";

export type EntitySubtype =
  | "stateBodyEntity"
  | "trustEntity"
  | "privateEntity"
  | "privateStateOwnedEntity"
  | "publicEntity"
  | "publicListedEntity"
  | "publicUnlistedEntity";

export interface Identifier {
  id: string;
  scheme?: string;
  schemeName?: string;
  uri?: string;
}

export interface Name {
  type: "individual" | "alias" | "legal" | "alternativeName" | "translation";
  fullName?: string;
  givenName?: string;
  patronymicName?: string;
  familyName?: string;
  fatherName?: string;
  language?: string;
}

export interface Country {
  name?: string;
  code?: string;
}

export interface Address {
  type: "registered" | "business" | "placeOfBirth" | "residence" | "service" | "alternative";
  address?: string;
  postCode?: string;
  country?: Country;
}

export interface Jurisdiction {
  name?: string;
  code?: string;
}

export interface TaxResidency {
  name?: string;
  code?: string;
}

export interface Nationality {
  name?: string;
  code?: string;
}

export interface Source {
  type?: Array<"selfDeclaration" | "thirdParty" | "officialRegister" | "verified">;
  description?: string;
  url?: string;
  retrievedAt?: string;
  assertedBy?: Array<{ name: string; uri?: string }>;
}

export interface PublicationDetails {
  bodsVersion: "0.4";
  license?: string;
  publicationDate?: string;
  publisher: { name: string; url?: string };
}

interface StatementHeader {
  statementId: string;
  declarationSubject: string;
  recordId: string;
  recordStatus?: "new" | "updated" | "closed" | "corrected";
  statementDate?: string;
  publicationDetails: PublicationDetails;
  source?: Source;
}

/* --- Entity --- */

export interface EntityRecordDetails {
  isComponent?: boolean;
  entityType: {
    type: EntityTypeValue;
    subtype?: EntitySubtype;
    details?: string;
  };
  name?: string;
  alternateNames?: string[];
  identifiers?: Identifier[];
  jurisdiction?: Jurisdiction;
  foundingDate?: string;
  dissolutionDate?: string;
  addresses?: Address[];
  uri?: string;
  publicListing?: { hasPublicListing: boolean };
}

export interface EntityStatement extends StatementHeader {
  recordType: "entity";
  recordDetails: EntityRecordDetails;
}

/* --- Person --- */

export interface PersonRecordDetails {
  isComponent?: boolean;
  personType: "knownPerson" | "anonymousPerson" | "unknownPerson";
  missingInfoReason?: string;
  names?: Name[];
  identifiers?: Identifier[];
  nationalities?: Nationality[];
  placeOfBirth?: Address;
  birthDate?: string;
  deathDate?: string;
  placeOfResidence?: Address;
  taxResidencies?: TaxResidency[];
  addresses?: Address[];
  pepStatus?: "isPep" | "isNotPep" | "unknownPep";
}

export interface PersonStatement extends StatementHeader {
  recordType: "person";
  recordDetails: PersonRecordDetails;
}

/* --- Relationship (ownership-or-control) --- */

export type InterestType =
  | "shareholding"
  | "votingRights"
  | "appointmentOfBoard"
  | "otherInfluenceOrControl"
  | "senior-managing-official"
  | "settlor"
  | "trustee"
  | "protector"
  | "beneficiary"
  | "conditionalInterests"
  | "rightsToProfitAndIncome"
  | "rightsToSurplusAssetsOnDissolution"
  | "rightsGrantedByContract"
  | "rightsToAppointOrRemoveLegalPersons";

export type DirectOrIndirect = "direct" | "indirect" | "unknown";

export interface Interest {
  type?: InterestType;
  directOrIndirect?: DirectOrIndirect;
  beneficialOwnershipOrControl?: boolean;
  details?: string;
  share?: {
    exact?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
  };
  startDate?: string;
  endDate?: string;
}

export interface RelationshipRecordDetails {
  isComponent?: boolean;
  subject: string;
  interestedParty: string;
  interests?: Interest[];
  componentRecords?: string[];
}

export interface RelationshipStatement extends StatementHeader {
  recordType: "relationship";
  recordDetails: RelationshipRecordDetails;
}

/* --- Union --- */

export type Statement = EntityStatement | PersonStatement | RelationshipStatement;
