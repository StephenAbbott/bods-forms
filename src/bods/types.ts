/**
 * BODS v0.4 types — minimum subset needed for this form.
 *
 * The full schema lives at https://standard.openownership.org/en/0.4.0/standard/reference.html
 * Only the fields we actually emit are modelled here; the rest are typed loosely
 * so that additions don't force structural churn.
 */

export type StatementType =
  | "personStatement"
  | "entityStatement"
  | "ownershipOrControlStatement";

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
  type: "individual" | "alias" | "legalName" | "alternativeName" | "translation";
  fullName?: string;
  givenName?: string;
  patronymicName?: string;
  familyName?: string;
  fatherName?: string;
  language?: string;
}

export interface Address {
  type: "registered" | "business" | "placeOfBirth" | "residence" | "service" | "alternative";
  address?: string;
  postCode?: string;
  country?: string;
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

export interface RecordDetails {
  recordId: string;
  recordType: StatementType;
  recordStatus?: "new" | "updated" | "closed" | "corrected";
  isComponent?: boolean;
  componentRecords?: string[];
}

/* --- Person --- */

export interface PersonStatement {
  statementId: string;
  declarationSubject: string; // statementId of the entity being declared about
  recordId: string;
  recordType: "personStatement";
  recordStatus?: "new" | "updated" | "closed" | "corrected";
  statementDate?: string;
  personType: "knownPerson" | "anonymousPerson" | "unknownPerson";
  missingInfoReason?: string;
  isComponent?: boolean;
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
  source?: Source;
}

/* --- Entity --- */

export interface EntityStatement {
  statementId: string;
  declarationSubject: string;
  recordId: string;
  recordType: "entityStatement";
  recordStatus?: "new" | "updated" | "closed" | "corrected";
  statementDate?: string;
  entityType: {
    type: EntityTypeValue;
    subtype?: EntitySubtype;
    details?: string;
  };
  missingInfoReason?: string;
  isComponent?: boolean;
  name?: string;
  alternateNames?: string[];
  identifiers?: Identifier[];
  jurisdiction?: Jurisdiction;
  foundingDate?: string;
  dissolutionDate?: string;
  addresses?: Address[];
  uri?: string;
  publicListing?: { hasPublicListing: boolean };
  source?: Source;
}

/* --- Ownership or control --- */

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
  type: InterestType;
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

export interface OwnershipOrControlStatement {
  statementId: string;
  declarationSubject: string;
  recordId: string;
  recordType: "ownershipOrControlStatement";
  recordStatus?: "new" | "updated" | "closed" | "corrected";
  statementDate?: string;
  subject: { describedByEntityStatement: string };
  interestedParty:
    | { describedByPersonStatement: string }
    | { describedByEntityStatement: string }
    | { unspecified: { reason: string; description?: string } };
  interests?: Interest[];
  isComponent?: boolean;
  componentStatementIDs?: string[];
  source?: Source;
}

/* --- Wrapping a BODS 0.4 publication --- */

export type Statement = PersonStatement | EntityStatement | OwnershipOrControlStatement;

export interface PublicationDetails {
  bodsVersion: "0.4";
  license?: string;
  publicationDate?: string;
  publisher: { name: string; url?: string };
}

export interface DeclarationRecord {
  declarationId: string;
  statementDate: string;
  publicationDetails: PublicationDetails;
  records: Statement[];
  source?: Source;
}
