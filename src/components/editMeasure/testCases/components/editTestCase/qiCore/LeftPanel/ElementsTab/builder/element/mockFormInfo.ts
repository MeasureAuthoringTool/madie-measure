const mockFormInfo = [
  [
    "ClaimResponse",
    {
      id: "ClaimResponse",
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.id",
    {
      id: "ClaimResponse.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "id",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.id",
    {
      id: "ClaimResponse.meta.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.extension",
    {
      id: "ClaimResponse.meta.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.versionId",
    {
      id: "ClaimResponse.meta.versionId",
      type: [
        {
          code: "id",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.lastUpdated",
    {
      id: "ClaimResponse.meta.lastUpdated",
      type: [
        {
          code: "instant",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.source",
    {
      id: "ClaimResponse.meta.source",
      type: [
        {
          code: "uri",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.profile",
    {
      id: "ClaimResponse.meta.profile",
      type: [
        {
          code: "canonical",
          targetProfile: [
            "http://hl7.org/fhir/StructureDefinition/StructureDefinition",
          ],
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.security",
    {
      id: "ClaimResponse.meta.security",
      type: [
        {
          code: "Coding",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta.tag",
    {
      id: "ClaimResponse.meta.tag",
      type: [
        {
          code: "Coding",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.meta",
    {
      id: "ClaimResponse.meta",
      type: [
        {
          code: "Meta",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.implicitRules",
    {
      id: "ClaimResponse.implicitRules",
      type: [
        {
          code: "uri",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.language",
    {
      id: "ClaimResponse.language",
      type: [
        {
          code: "code",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.id",
    {
      id: "ClaimResponse.text.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.extension",
    {
      id: "ClaimResponse.text.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.status",
    {
      id: "ClaimResponse.text.status",
      type: [
        {
          code: "code",
        },
      ],
      required: true,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.div.id",
    {
      id: "ClaimResponse.text.div.id",
      type: [
        {
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.div.value",
    {
      id: "ClaimResponse.text.div.value",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: true,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text.div",
    {
      id: "ClaimResponse.text.div",
      type: [
        {
          code: "xhtml",
        },
      ],
      required: true,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.text",
    {
      id: "ClaimResponse.text",
      type: [
        {
          code: "Narrative",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.id",
    {
      id: "ClaimResponse.contained.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.id",
    {
      id: "ClaimResponse.contained.meta.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.extension",
    {
      id: "ClaimResponse.contained.meta.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.versionId",
    {
      id: "ClaimResponse.contained.meta.versionId",
      type: [
        {
          code: "id",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.lastUpdated",
    {
      id: "ClaimResponse.contained.meta.lastUpdated",
      type: [
        {
          code: "instant",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.source",
    {
      id: "ClaimResponse.contained.meta.source",
      type: [
        {
          code: "uri",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.profile",
    {
      id: "ClaimResponse.contained.meta.profile",
      type: [
        {
          code: "canonical",
          targetProfile: [
            "http://hl7.org/fhir/StructureDefinition/StructureDefinition",
          ],
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.security",
    {
      id: "ClaimResponse.contained.meta.security",
      type: [
        {
          code: "Coding",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta.tag",
    {
      id: "ClaimResponse.contained.meta.tag",
      type: [
        {
          code: "Coding",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.meta",
    {
      id: "ClaimResponse.contained.meta",
      type: [
        {
          code: "Meta",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.implicitRules",
    {
      id: "ClaimResponse.contained.implicitRules",
      type: [
        {
          code: "uri",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained.language",
    {
      id: "ClaimResponse.contained.language",
      type: [
        {
          code: "code",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.contained",
    {
      id: "ClaimResponse.contained",
      type: [
        {
          code: "Resource",
        },
      ],
      required: false,
      canBeMultipleCardinality: true,
    },
  ],
  [
    "ClaimResponse.extension",
    {
      id: "ClaimResponse.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.modifierExtension",
    {
      id: "ClaimResponse.modifierExtension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.id",
    {
      id: "ClaimResponse.identifier.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.extension",
    {
      id: "ClaimResponse.identifier.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.use",
    {
      id: "ClaimResponse.identifier.use",
      type: [
        {
          code: "code",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.type.id",
    {
      id: "ClaimResponse.identifier.type.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.type.extension",
    {
      id: "ClaimResponse.identifier.type.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.type.coding",
    {
      id: "ClaimResponse.identifier.type.coding",
      type: [
        {
          code: "Coding",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.type.text",
    {
      id: "ClaimResponse.identifier.type.text",
      type: [
        {
          code: "string",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.type",
    {
      id: "ClaimResponse.identifier.type",
      type: [
        {
          code: "CodeableConcept",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.system",
    {
      id: "ClaimResponse.identifier.system",
      type: [
        {
          code: "uri",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.value",
    {
      id: "ClaimResponse.identifier.value",
      type: [
        {
          code: "string",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.period.id",
    {
      id: "ClaimResponse.identifier.period.id",
      type: [
        {
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
              valueUrl: "string",
            },
          ],
          code: "http://hl7.org/fhirpath/System.String",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.period.extension",
    {
      id: "ClaimResponse.identifier.period.extension",
      type: [
        {
          code: "Extension",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.period.start",
    {
      id: "ClaimResponse.identifier.period.start",
      type: [
        {
          code: "dateTime",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.period.end",
    {
      id: "ClaimResponse.identifier.period.end",
      type: [
        {
          code: "dateTime",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "ClaimResponse.identifier.period",
    {
      id: "ClaimResponse.identifier.period",
      type: [
        {
          code: "Period",
        },
      ],
      required: false,
      canBeMultipleCardinality: false,
    },
  ],
];

export default mockFormInfo;
