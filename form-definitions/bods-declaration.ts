/**
 * The BODS v0.4 declaration form definition.
 *
 * This file is the "form JSON" — it just happens to be TypeScript so we get
 * type checking of component options against the FormDefinition schema.
 *
 * Structure follows Open Ownership's form design guide:
 * https://www.openownership.org/en/publications/beneficial-ownership-declaration-forms-guide-for-regulators-and-designers/
 *
 * Step 1 emits the entity statement. Step 2 lets the user add one or more
 * beneficial owners; each one produces a person statement plus a relationship
 * statement linking that person to the entity.
 */

import type { FormDefinition } from "../src/form-engine/types";

export const declarationForm: FormDefinition = {
  metadata: {
    title: "Beneficial Ownership Declaration",
    version: "0.2.0",
    bodsVersion: "0.4",
    description:
      "A minimal, user-friendly form that collects the information needed to produce a valid BODS v0.4 publication describing an entity and one or more natural-person beneficial owners.",
  },
  steps: [
    {
      id: "entity",
      path: "/entity",
      caption: "Step 1 of 2",
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
        },
        {
          type: "repeater",
          name: "entityIdentifiers",
          title: "Identifiers",
          hint: "Add one or more identifiers. The more you provide, the easier it is to match this entity across registers. You can find scheme codes at https://org-id.guide.",
          addButtonText: "Add another identifier",
          itemTitle: "Identifier",
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
        },
        {
          type: "text",
          name: "entityFoundingDate",
          title: "Date of incorporation (optional)",
          hint: "Format: YYYY-MM-DD, or YYYY-MM, or YYYY.",
          inputWidth: "10",
        },
        {
          type: "textarea",
          name: "entityRegisteredAddress",
          title: "Registered address (optional)",
          hint: "One line per address component, e.g. street, town, postcode.",
        },
        {
          type: "text",
          name: "entityAddressCountry",
          title: "Country of registered address (optional)",
          hint: "ISO 3166-1 alpha-2 code. Often the same as country of incorporation.",
          inputWidth: "5",
        },
      ],
    },
    {
      id: "beneficial-owners",
      path: "/beneficial-owners",
      caption: "Step 2 of 2",
      heading: "Tell us about the beneficial owners",
      lede: "Add one or more natural people who ultimately own or control this entity. For each person we capture their identity and how they are connected to the entity. Each one produces a person statement plus a relationship statement.",
      emits: "personStatement + ownershipOrControlStatement (per beneficial owner)",
      components: [
        {
          type: "beneficial-owners",
          name: "beneficialOwners",
          title: "Beneficial owners",
          hint: "Add every natural person who owns or controls a significant share of the entity.",
          addButtonText: "Add a beneficial owner",
          itemTitle: "Beneficial owner",
          required: true,
        },
      ],
    },
  ],
};
