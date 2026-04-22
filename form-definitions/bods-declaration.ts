/**
 * The BODS v0.4 declaration form definition.
 *
 * This file is the "form JSON" — it just happens to be TypeScript so we get
 * type checking of component options against the FormDefinition schema.
 *
 * Structure follows Open Ownership's form design guide:
 * https://www.openownership.org/en/publications/beneficial-ownership-declaration-forms-guide-for-regulators-and-designers/
 *
 * Each step emits one BODS statement; the final summary step assembles the
 * full publication.
 */

import type { FormDefinition } from "../src/form-engine/types";

export const declarationForm: FormDefinition = {
  metadata: {
    title: "Beneficial Ownership Declaration",
    version: "0.1.0",
    bodsVersion: "0.4",
    description:
      "A minimal, user-friendly form that collects the information needed to produce a valid BODS v0.4 publication describing an entity, a natural-person beneficial owner, and the relationship between them.",
  },
  steps: [
    {
      id: "entity",
      path: "/entity",
      caption: "Step 1 of 3",
      heading: "Tell us about the entity",
      lede: "We need basic facts about the legal entity whose ownership you are declaring. This produces the BODS entity statement.",
      emits: "entityStatement",
      components: [
        {
          type: "radios",
          name: "entityType",
          title: "What kind of entity is this?",
          hint: "Most companies, partnerships and co-operatives are a registered entity. Choose another option only if it clearly applies.",
          required: true,
          bodsField: "entityType.type",
          options: [
            {
              value: "registeredEntity",
              text: "Registered entity",
              hint: "A company, co-operative or other legal person registered on a public register.",
            },
            {
              value: "legalEntity",
              text: "Legal entity (other)",
              hint: "A legal person that is not registered on a public register.",
            },
            {
              value: "arrangement",
              text: "Legal arrangement",
              hint: "A trust, fiducie, fideicomiso, or similar non-corporate vehicle.",
            },
          ],
        },
        {
          type: "text",
          name: "entityName",
          title: "Registered name",
          hint: "The full legal name as it appears on the register.",
          required: true,
          bodsField: "name",
        },
        {
          type: "repeater",
          name: "entityIdentifiers",
          title: "Identifiers",
          hint: "Add one or more identifiers. The more you provide, the easier it is to match this entity across registers. You can find scheme codes at https://org-id.guide.",
          addButtonText: "Add another identifier",
          itemTitle: "Identifier",
          bodsField: "identifiers[]",
          components: [
            {
              type: "text",
              name: "scheme",
              title: "Scheme code",
              hint: "e.g. GB-COH for UK Companies House, US-EIN for a US Employer Identification Number.",
              inputWidth: "20",
            },
            {
              type: "text",
              name: "schemeName",
              title: "Scheme name (optional)",
              hint: "Human-readable name for the scheme if it isn't listed at org-id.guide.",
            },
            {
              type: "text",
              name: "id",
              title: "Identifier value",
              hint: "The actual number or code issued by the scheme.",
              inputWidth: "20",
            },
          ],
        },
        {
          type: "text",
          name: "entityJurisdictionCode",
          title: "Country of incorporation",
          hint: "ISO 3166-1 alpha-2 country code, e.g. GB, US, KE.",
          inputWidth: "5",
          bodsField: "jurisdiction.code",
        },
        {
          type: "text",
          name: "entityFoundingDate",
          title: "Date of incorporation (optional)",
          hint: "Format: YYYY-MM-DD, or YYYY-MM, or YYYY.",
          inputWidth: "10",
          bodsField: "foundingDate",
        },
        {
          type: "textarea",
          name: "entityRegisteredAddress",
          title: "Registered address (optional)",
          hint: "One line per address component, e.g. street, town, postcode.",
          bodsField: "addresses[].address",
        },
        {
          type: "text",
          name: "entityAddressCountry",
          title: "Country of registered address (optional)",
          hint: "ISO 3166-1 alpha-2 code. Often the same as country of incorporation.",
          inputWidth: "5",
          bodsField: "addresses[].country",
        },
      ],
    },
    {
      id: "person",
      path: "/person",
      caption: "Step 2 of 3",
      heading: "Tell us about the beneficial owner",
      lede: "Describe the natural person who ultimately owns or controls this entity. This produces the BODS person statement.",
      emits: "personStatement",
      components: [
        {
          type: "text",
          name: "personGivenName",
          title: "Given name(s)",
          hint: "Also called first name or forenames.",
          required: true,
          bodsField: "names[].givenName",
        },
        {
          type: "text",
          name: "personFamilyName",
          title: "Family name",
          hint: "Also called surname or last name.",
          required: true,
          bodsField: "names[].familyName",
        },
        {
          type: "repeater",
          name: "personAlternateNames",
          title: "Other names the person is known by (optional)",
          hint: "Include transliterations, former names, or aliases.",
          addButtonText: "Add another name",
          itemTitle: "Alternate name",
          bodsField: "names[]",
          components: [
            {
              type: "text",
              name: "fullName",
              title: "Full name",
            },
          ],
        },
        {
          type: "partial-date",
          name: "personBirthDate",
          title: "Date of birth",
          hint: "We record month and year by default to match the UK PSC pattern. Day is optional.",
          yearName: "personBirthYear",
          monthName: "personBirthMonth",
          dayName: "personBirthDay",
          bodsField: "birthDate",
        },
        {
          type: "repeater",
          name: "personNationalities",
          title: "Nationalities",
          hint: "Add all nationalities the person holds.",
          addButtonText: "Add another nationality",
          itemTitle: "Nationality",
          bodsField: "nationalities[]",
          components: [
            {
              type: "text",
              name: "code",
              title: "Country code",
              hint: "ISO 3166-1 alpha-2, e.g. GB, NG, KE.",
              inputWidth: "5",
            },
            {
              type: "text",
              name: "name",
              title: "Country name (optional)",
            },
          ],
        },
        {
          type: "repeater",
          name: "personTaxResidencies",
          title: "Tax residencies (optional)",
          hint: "Countries where the person is currently tax-resident. Often different from nationality.",
          addButtonText: "Add another tax residency",
          itemTitle: "Tax residency",
          bodsField: "taxResidencies[]",
          components: [
            {
              type: "text",
              name: "code",
              title: "Country code",
              hint: "ISO 3166-1 alpha-2.",
              inputWidth: "5",
            },
            {
              type: "text",
              name: "name",
              title: "Country name (optional)",
            },
          ],
        },
        {
          type: "repeater",
          name: "personIdentifiers",
          title: "Identifiers (optional)",
          hint: "National ID number, passport number, tax ID, etc. Each needs a scheme and a value.",
          addButtonText: "Add another identifier",
          itemTitle: "Identifier",
          bodsField: "identifiers[]",
          components: [
            {
              type: "text",
              name: "scheme",
              title: "Scheme code",
              hint: "e.g. GB-NINO for a UK National Insurance Number, or a passport-specific scheme.",
              inputWidth: "20",
            },
            {
              type: "text",
              name: "schemeName",
              title: "Scheme name (optional)",
            },
            {
              type: "text",
              name: "id",
              title: "Identifier value",
            },
          ],
        },
        {
          type: "textarea",
          name: "personServiceAddress",
          title: "Service address (optional)",
          hint: "An address for correspondence. This can be a business address rather than the person's home.",
          bodsField: "addresses[].address",
        },
        {
          type: "text",
          name: "personServiceAddressCountry",
          title: "Country of service address (optional)",
          hint: "ISO 3166-1 alpha-2 code.",
          inputWidth: "5",
          bodsField: "addresses[].country",
        },
        {
          type: "radios",
          name: "personPepStatus",
          title: "Is this person a politically exposed person (PEP)?",
          hint: "A PEP is someone entrusted with a prominent public function, or a close associate/family member of one.",
          bodsField: "pepStatus",
          options: [
            { value: "isPep", text: "Yes, this person is a PEP" },
            { value: "isNotPep", text: "No, this person is not a PEP" },
            { value: "unknownPep", text: "Not known" },
          ],
        },
      ],
    },
    {
      id: "relationship",
      path: "/relationship",
      caption: "Step 3 of 3",
      heading: "Describe the relationship",
      lede: "How does this person own or control the entity? This produces the BODS ownership-or-control statement that links the two.",
      emits: "ownershipOrControlStatement",
      components: [
        {
          type: "checkboxes",
          name: "interestTypes",
          title: "Nature of the interest",
          hint: "Tick all that apply. These are generic BODS interest types — most jurisdictions use one or more of these categories.",
          required: true,
          bodsField: "interests[].type",
          options: [
            {
              value: "shareholding",
              text: "Shareholding",
              hint: "Ownership of shares in the entity.",
            },
            {
              value: "votingRights",
              text: "Voting rights",
              hint: "Rights to vote at shareholder or member meetings.",
            },
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
          ],
        },
        {
          type: "radios",
          name: "directOrIndirect",
          title: "Is the interest held directly or indirectly?",
          hint: "Direct: the person holds the interest in their own name. Indirect: held via one or more intermediary entities.",
          bodsField: "interests[].directOrIndirect",
          options: [
            { value: "direct", text: "Direct" },
            { value: "indirect", text: "Indirect" },
            { value: "unknown", text: "Not known" },
          ],
        },
        {
          type: "text",
          name: "sharePercentageExact",
          title: "Percentage of interest (optional)",
          hint: "If the exact percentage is known, enter it here (0–100). Otherwise leave blank and use the band below.",
          inputWidth: "5",
          bodsField: "interests[].share.exact",
        },
        {
          type: "text",
          name: "sharePercentageMin",
          title: "Minimum percentage (optional)",
          hint: "Use this when only a range is known (e.g. 25).",
          inputWidth: "5",
          bodsField: "interests[].share.minimum",
        },
        {
          type: "text",
          name: "sharePercentageMax",
          title: "Maximum percentage (optional)",
          hint: "Use this with the minimum above (e.g. 50).",
          inputWidth: "5",
          bodsField: "interests[].share.maximum",
        },
        {
          type: "text",
          name: "interestStartDate",
          title: "Date the interest started (optional)",
          hint: "Format: YYYY-MM-DD, YYYY-MM, or YYYY.",
          inputWidth: "10",
          bodsField: "interests[].startDate",
        },
      ],
    },
  ],
};
