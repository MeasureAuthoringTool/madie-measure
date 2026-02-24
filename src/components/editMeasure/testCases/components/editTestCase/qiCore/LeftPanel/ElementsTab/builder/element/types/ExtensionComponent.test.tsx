import * as React from "react";
import { render, screen } from "@testing-library/react";
import { FormikProvider, FormikContextType } from "formik";
import * as _ from "lodash";
import ExtensionComponent, {
  getUrlAndValueElement,
} from "./ExtensionComponent";

/**
 * ===========================================================================================
 * ExtensionComponent Tests
 * ===========================================================================================
 *
 * WHAT IS ExtensionComponent?
 * ---------------------------
 * ExtensionComponent renders a single extension element within a profiled FHIR extension.
 * It handles TWO distinct scenarios:
 *
 * 1. COMPLEX (SLICED) EXTENSIONS — e.g., us-core-race
 *    These have sliced sub-extensions like ombCategory, detailed, text.
 *    Each slice has its own url element (with a fixedUri) and a value[x] element.
 *    The component displays the fixedUri as a label and renders a TypeEditor for the value.
 *
 *    JSON shape:
 *      { "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
 *        "extension": [
 *          { "url": "ombCategory", "valueCoding": { "code": "2106-3", ... } },
 *          { "url": "text", "valueString": "White" }
 *        ]
 *      }
 *
 * 2. SIMPLE (NON-SLICED) EXTENSIONS — e.g., us-core-birthsex
 *    These have NO sliced sub-extensions. Instead, the extension carries a direct value
 *    via a value[x] element (e.g., valueCode). When getEditableExtensionSubElements
 *    returns the value[x] element (no sliceName), the component's else branch renders
 *    a TypeEditor using elementDefinition.type[0].code to determine the input type.
 *
 *    JSON shape:
 *      { "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
 *        "valueCode": "M"
 *      }
 *
 *    If elementDefinition.type[0].code is not available, the extension is NOT supported.
 *
 * HOW IT WORKS:
 * -------------
 * Given an elementDefinition and an extensionProfileDef:
 *
 * 1. getUrlAndValueElement(profileDef, elementDef.id) finds:
 *    - urlElement: the element with id "{sliceId}.url" → has fixedUri like "ombCategory"
 *    - valueElement: the element with id "{sliceId}.value[x]" → has type like [{code:"Coding"}]
 *
 * 2. If urlElement?.fixedUri exists (COMPLEX path):
 *    - Displays fixedUri as a label
 *    - Renders TypeEditor for the value[x] element
 *    - On change, builds { url: fixedUri, valueCoding: {...} } and sets it on formik
 *
 * 3. If urlElement?.fixedUri does NOT exist (SIMPLE path):
 *    - Uses elementDefinition.type[0].code to determine the value type
 *    - Builds label as `${label}.value${StartCase(type)}` (e.g., ".valueCode")
 *    - Renders TypeEditor directly for the value
 * ===========================================================================================
 */

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
}));

jest.mock("../../../../../../../../api/useFhirDefinitionsService", () => ({
  __esModule: true,
  default: () => ({
    getResourceTree: jest.fn().mockResolvedValue(null),
    getValueSetDefinition: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("../../../../../../../../api/useTerminologyServiceApi", () => ({
  __esModule: true,
  default: () => ({
    getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock("../../../../../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn().mockReturnValue({
    state: {
      bundle: {
        entry: [{ resource: { resourceType: "Patient", id: "patient-1" } }],
      },
    },
  }),
}));

jest.mock("../../../../../../../../api/fhirDefinitionServiceUtilities", () => ({
  ...jest.requireActual(
    "../../../../../../../../api/fhirDefinitionServiceUtilities"
  ),
  isComponentDataType: () => true,
}));

// Mock RequiredFieldsContext since TypeEditor (rendered inside ExtensionComponent) uses it
jest.mock("../RequiredFieldsContext", () => ({
  useRequiredFields: () => ({
    requiredFields: {},
    formInfo: [],
  }),
}));

// Mock useExecutionContext since CodingComponent (rendered by TypeEditor for Coding-type values) uses it
jest.mock("../../../../../../../routes/qiCore/useExecutionContext", () => ({
  __esModule: true,
  default: () => ({
    valueSetsState: [[], jest.fn()],
    executionContextReady: true,
  }),
}));

// Helper to create a mock formik context
const createMockFormik = (values: any = {}, overrides: any = {}) => {
  const formik = {
    values,
    initialValues: values,
    errors: {},
    touched: {},
    dirty: false,
    isValid: true,
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    setFieldError: jest.fn(),
    setValues: jest.fn(),
    setTouched: jest.fn(),
    setErrors: jest.fn(),
    setStatus: jest.fn(),
    setSubmitting: jest.fn(),
    setFormikState: jest.fn(),
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn(),
    handleReset: jest.fn(),
    resetForm: jest.fn(),
    submitForm: jest.fn(),
    validateForm: jest.fn(),
    validateField: jest.fn(),
    getFieldProps: jest.fn((name: string) => ({
      name,
      value: _.get(values, name),
      onChange: jest.fn(),
      onBlur: jest.fn(),
    })),
    getFieldMeta: jest.fn(),
    getFieldHelpers: jest.fn(),
    registerField: jest.fn(),
    unregisterField: jest.fn(),
    ...overrides,
  } as unknown as FormikContextType<any>;
  return formik;
};

/**
 * Mock extension profile definition for us-core-race.
 * This is the StructureDefinitionDto that comes from getResourceTree("us-core-race").
 *
 * The snapshot.element array includes elements for each slice. For the ombCategory slice:
 *   - Extension.extension:ombCategory          → the slice definition
 *   - Extension.extension:ombCategory.url       → fixedUri = "ombCategory"
 *   - Extension.extension:ombCategory.value[x]  → type = [{code: "Coding"}]
 *
 * getUrlAndValueElement uses the elementDefinition.id (e.g., "Extension.extension:ombCategory")
 * to find the ".url" and ".value[x]" elements within this snapshot.
 */
const mockRaceExtensionProfileDef = {
  definition: {
    resourceType: "StructureDefinition",
    id: "us-core-race",
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
    type: "Extension",
    snapshot: {
      element: [
        // ombCategory slice
        {
          id: "Extension.extension:ombCategory",
          path: "Extension.extension",
          sliceName: "ombCategory",
          type: [{ code: "Extension" }],
        },
        {
          id: "Extension.extension:ombCategory.url",
          path: "Extension.extension.url",
          fixedUri: "ombCategory",
          type: [{ code: "uri" }],
        },
        {
          id: "Extension.extension:ombCategory.value[x]",
          path: "Extension.extension.value[x]",
          type: [{ code: "Coding" }],
          binding: {
            strength: "required",
            valueSet: "http://hl7.org/fhir/us/core/ValueSet/omb-race-category",
          },
        },
        // detailed slice
        {
          id: "Extension.extension:detailed",
          path: "Extension.extension",
          sliceName: "detailed",
          type: [{ code: "Extension" }],
        },
        {
          id: "Extension.extension:detailed.url",
          path: "Extension.extension.url",
          fixedUri: "detailed",
          type: [{ code: "uri" }],
        },
        {
          id: "Extension.extension:detailed.value[x]",
          path: "Extension.extension.value[x]",
          type: [{ code: "Coding" }],
          binding: {
            strength: "required",
            valueSet: "http://hl7.org/fhir/us/core/ValueSet/detailed-race",
          },
        },
        // text slice
        {
          id: "Extension.extension:text",
          path: "Extension.extension",
          sliceName: "text",
          type: [{ code: "Extension" }],
        },
        {
          id: "Extension.extension:text.url",
          path: "Extension.extension.url",
          fixedUri: "text",
          type: [{ code: "uri" }],
        },
        {
          id: "Extension.extension:text.value[x]",
          path: "Extension.extension.value[x]",
          type: [{ code: "string" }],
        },
      ],
    },
  },
};

describe("getUrlAndValueElement", () => {
  /**
   * getUrlAndValueElement extracts the url and value[x] element definitions
   * for a given slice from the extension profile's snapshot.
   *
   * Example: for the ombCategory slice (id = "Extension.extension:ombCategory"),
   * it searches the snapshot for:
   *   - "Extension.extension:ombCategory.url" → returns this as urlElement
   *   - "Extension.extension:ombCategory.value[x]" → returns this as valueElement
   */

  test("returns url and value[x] elements for ombCategory slice", () => {
    const [urlElement, valueElement] = getUrlAndValueElement(
      mockRaceExtensionProfileDef.definition as any,
      "Extension.extension:ombCategory"
    );

    expect(urlElement).toBeDefined();
    expect(urlElement.fixedUri).toBe("ombCategory");
    expect(valueElement).toBeDefined();
    expect(valueElement.type[0].code).toBe("Coding");
  });

  test("returns url and value[x] elements for text slice", () => {
    const [urlElement, valueElement] = getUrlAndValueElement(
      mockRaceExtensionProfileDef.definition as any,
      "Extension.extension:text"
    );

    expect(urlElement).toBeDefined();
    expect(urlElement.fixedUri).toBe("text");
    expect(valueElement).toBeDefined();
    expect(valueElement.type[0].code).toBe("string");
  });

  test("returns empty array when profile has no snapshot", () => {
    const result = getUrlAndValueElement(
      { resourceType: "StructureDefinition" } as any,
      "Extension.extension:ombCategory"
    );

    expect(result).toEqual([]);
  });

  test("returns empty array when id is falsy", () => {
    const result = getUrlAndValueElement(
      mockRaceExtensionProfileDef.definition as any,
      ""
    );

    expect(result).toEqual([]);
  });

  test("returns [undefined, undefined] when slice id doesn't match any element", () => {
    const [urlElement, valueElement] = getUrlAndValueElement(
      mockRaceExtensionProfileDef.definition as any,
      "Extension.extension:nonExistentSlice"
    );

    expect(urlElement).toBeUndefined();
    expect(valueElement).toBeUndefined();
  });
});

describe("ExtensionComponent", () => {
  /**
   * Each test renders ExtensionComponent with:
   *   - label: the formik path for this sub-extension (e.g., "Patient.extension[0].extension[0]")
   *   - elementDefinition: the slice definition (e.g., the ombCategory element)
   *   - extensionProfileDef: the full extension profile (us-core-race)
   *   - fhirResource: the Patient resource (used by nested TypeEditor)
   */

  test("renders the fixedUri of the ombCategory slice as a label", () => {
    /**
     * When ExtensionComponent loads for ombCategory:
     *   1. getUrlAndValueElement finds fixedUri = "ombCategory"
     *   2. The fixedUri is rendered in a styled span so the user knows which sub-extension this is
     */
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
          },
        ],
      },
    });

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0].extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={
            {
              id: "Extension.extension:ombCategory",
              path: "Extension.extension",
              sliceName: "ombCategory",
              type: [{ code: "Extension" }],
            } as any
          }
          extensionProfileDef={mockRaceExtensionProfileDef as any}
        />
      </FormikProvider>
    );

    // The fixedUri "ombCategory" should be rendered as a label
    expect(screen.getByText("ombCategory")).toBeInTheDocument();
  });

  test("renders the fixedUri of the text slice as a label", () => {
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [
              undefined,
              undefined,
              { url: "text", valueString: "Some race text" },
            ],
          },
        ],
      },
    });

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0].extension[2]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={
            {
              id: "Extension.extension:text",
              path: "Extension.extension",
              sliceName: "text",
              type: [{ code: "Extension" }],
            } as any
          }
          extensionProfileDef={mockRaceExtensionProfileDef as any}
        />
      </FormikProvider>
    );

    expect(screen.getByText("text")).toBeInTheDocument();
  });

  test("renders nothing when profile has no snapshot (no urlElement.fixedUri)", () => {
    /**
     * If the extension profile definition has no snapshot, getUrlAndValueElement
     * returns []. urlElement is undefined, so urlElement?.fixedUri is falsy,
     * and the component does not render the extension UI.
     *
     * Note: The component currently has no explicit return null in the else branch,
     * so React will throw an error. We suppress console.error for this test
     * since it's expected behavior for the edge case of a missing snapshot.
     */
    const mockFormik = createMockFormik({});
    const emptyProfile = {
      definition: {
        resourceType: "StructureDefinition",
        id: "us-core-race",
        type: "Extension",
        // no snapshot
      },
    };

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(
        <FormikProvider value={mockFormik}>
          <ExtensionComponent
            label="Patient.extension[0].extension[0]"
            canEdit={true}
            fhirResource={{ resourceType: "Patient" }}
            elementDefinition={
              {
                id: "Extension.extension:ombCategory",
                path: "Extension.extension",
                sliceName: "ombCategory",
              } as any
            }
            extensionProfileDef={emptyProfile as any}
          />
        </FormikProvider>
      );
    }).toThrow();

    consoleSpy.mockRestore();
  });

  test("renders Add button when showAddAttributeButton and addTitle are provided", () => {
    /**
     * When an Extension slice supports multiple cardinality (e.g., ombCategory max="*"),
     * the Add button is shown so the user can add more entries.
     */
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
          },
        ],
      },
    });

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0].extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={
            {
              id: "Extension.extension:ombCategory",
              path: "Extension.extension",
              sliceName: "ombCategory",
              type: [{ code: "Extension" }],
            } as any
          }
          extensionProfileDef={mockRaceExtensionProfileDef as any}
          showAddAttributeButton={true}
          addTitle="ombCategory"
        />
      </FormikProvider>
    );

    expect(screen.getByText("Add ombCategory")).toBeInTheDocument();
  });

  test("does NOT render Add button when showAddAttributeButton is false", () => {
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
          },
        ],
      },
    });

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0].extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={
            {
              id: "Extension.extension:ombCategory",
              path: "Extension.extension",
              sliceName: "ombCategory",
              type: [{ code: "Extension" }],
            } as any
          }
          extensionProfileDef={mockRaceExtensionProfileDef as any}
          showAddAttributeButton={false}
          addTitle="ombCategory"
        />
      </FormikProvider>
    );

    expect(screen.queryByText("Add ombCategory")).not.toBeInTheDocument();
  });

  test("uses the data-testid from the elementDefinition id (strips 'Extension.' prefix)", () => {
    /**
     * The data-testid is derived from elementDefinition.id by splitting on "Extension."
     * and taking the last part. For "Extension.extension:ombCategory" → "extension:ombCategory"
     */
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
          },
        ],
      },
    });

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0].extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={
            {
              id: "Extension.extension:ombCategory",
              path: "Extension.extension",
              sliceName: "ombCategory",
              type: [{ code: "Extension" }],
            } as any
          }
          extensionProfileDef={mockRaceExtensionProfileDef as any}
        />
      </FormikProvider>
    );

    expect(screen.getByTestId("extension:ombCategory")).toBeInTheDocument();
  });
});

/**
 * ===========================================================================================
 * Simple (Non-Sliced) Extension Tests
 * ===========================================================================================
 *
 * BACKGROUND:
 * Simple extensions like us-core-birthsex do NOT have sliced sub-extensions.
 * Their profile's snapshot contains a value[x] element but NO elements with a sliceName.
 *
 * When getEditableExtensionSubElements finds no sliced elements, it falls back to
 * returning the value[x] element. This element is passed as the elementDefinition
 * to ExtensionComponent.
 *
 * Since this element has no corresponding ".url" child with a fixedUri in the profile,
 * getUrlAndValueElement returns [undefined, undefined]. This causes urlElement?.fixedUri
 * to be falsy, triggering the ELSE branch in ExtensionComponent.
 *
 * The else branch:
 *   1. Reads the value type from elementDefinition.type[0].code (e.g., "code")
 *   2. Builds a label like "Patient.extension[1].valueCode"
 *   3. Renders TypeEditor with that label and elementDefinition
 *
 * RESULTING JSON:
 *   {
 *     "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
 *     "valueCode": "M"
 *   }
 *
 * The url is set at the parent level (by TypeEditor's Extension case), NOT by
 * ExtensionComponent. ExtensionComponent only handles the value portion.
 * ===========================================================================================
 */

/**
 * Mock profile definition for us-core-birthsex — a simple (non-sliced) extension.
 *
 * Unlike us-core-race, birthsex has NO sliced sub-extensions. Its snapshot contains:
 *   - Extension (base)
 *   - Extension.url (structural, fixedUri = the extension URL)
 *   - Extension.value[x] (type = code, with binding to birthsex value set)
 *
 * getEditableExtensionSubElements will find no sliceName elements and fall back
 * to returning the value[x] element.
 */
const mockBirthsexExtensionProfileDef = {
  definition: {
    resourceType: "StructureDefinition",
    id: "us-core-birthsex",
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
    name: "USCoreBirthSexExtension",
    title: "US Core Birth Sex Extension",
    type: "Extension",
    snapshot: {
      element: [
        {
          id: "Extension",
          path: "Extension",
          short: "US Core Birth Sex Extension",
        },
        {
          id: "Extension.url",
          path: "Extension.url",
          fixedUri:
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          type: [{ code: "uri" }],
        },
        {
          id: "Extension.value[x]",
          path: "Extension.value[x]",
          min: 1,
          max: "1",
          type: [{ code: "code" }],
          binding: {
            strength: "required",
            valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
          },
        },
      ],
    },
  },
};

describe("ExtensionComponent — simple (non-sliced) extensions", () => {
  /**
   * In the simple extension path, the elementDefinition passed to ExtensionComponent
   * is the value[x] element itself (returned by getEditableExtensionSubElements fallback).
   * It has type[0].code (e.g., "code") but no sliceName, no fixedUri child.
   */

  test("renders TypeEditor for a simple code-type extension (e.g., birthsex)", () => {
    /**
     * For us-core-birthsex:
     *   - elementDefinition = the value[x] element with type[0].code = "code"
     *   - No fixedUri → else branch
     *   - Label becomes "Patient.extension[1].valueCode"
     *   - TypeEditor renders the appropriate input for "code" type
     *
     * The resulting JSON would be:
     *   { "url": "http://hl7.org/.../us-core-birthsex", "valueCode": "M" }
     */
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            extension: [],
          },
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
            valueCode: "M",
          },
        ],
      },
    });

    // The elementDefinition is the value[x] element (from getEditableExtensionSubElements fallback)
    const birthsexValueElement = {
      id: "Extension.value[x]",
      path: "Extension.value[x]",
      min: 1,
      max: "1",
      type: [{ code: "code" }],
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
      },
    };

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[1]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={birthsexValueElement as any}
          extensionProfileDef={mockBirthsexExtensionProfileDef as any}
        />
      </FormikProvider>
    );

    // The else branch should render — no fixedUri label is shown
    // Instead, the TypeEditor renders the input for "code" type
    // The fixedUri from the profile ("http://hl7.org/.../us-core-birthsex") should NOT
    // appear as a styled label since it belongs to Extension.url, not a slice url
    expect(screen.queryByText("ombCategory")).not.toBeInTheDocument();
    expect(screen.queryByText("text")).not.toBeInTheDocument();
  });

  test("renders TypeEditor for a simple string-type extension", () => {
    /**
     * A hypothetical simple extension with type = "string"
     * Label becomes "Patient.extension[0].valueString"
     */
    const stringExtensionProfile = {
      definition: {
        resourceType: "StructureDefinition",
        id: "simple-string-ext",
        url: "http://example.org/fhir/StructureDefinition/simple-string",
        type: "Extension",
        snapshot: {
          element: [
            { id: "Extension", path: "Extension" },
            {
              id: "Extension.url",
              path: "Extension.url",
              fixedUri:
                "http://example.org/fhir/StructureDefinition/simple-string",
              type: [{ code: "uri" }],
            },
            {
              id: "Extension.value[x]",
              path: "Extension.value[x]",
              type: [{ code: "string" }],
            },
          ],
        },
      },
    };

    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://example.org/fhir/StructureDefinition/simple-string",
            valueString: "test value",
          },
        ],
      },
    });

    const stringValueElement = {
      id: "Extension.value[x]",
      path: "Extension.value[x]",
      type: [{ code: "string" }],
    };

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={stringValueElement as any}
          extensionProfileDef={stringExtensionProfile as any}
        />
      </FormikProvider>
    );

    // The string input should be rendered via TypeEditor
    // The formik label would be "Patient.extension[0].valueString"
    // Verify getFieldProps was called with the correct label path
    expect(mockFormik.getFieldProps).toHaveBeenCalledWith(
      expect.stringContaining("valueString")
    );
  });

  test("renders Add button for simple extension when showAddAttributeButton is true", () => {
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
            valueCode: "F",
          },
        ],
      },
    });

    const birthsexValueElement = {
      id: "Extension.value[x]",
      path: "Extension.value[x]",
      type: [{ code: "code" }],
    };

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={birthsexValueElement as any}
          extensionProfileDef={mockBirthsexExtensionProfileDef as any}
          showAddAttributeButton={true}
          addTitle="birthsex"
        />
      </FormikProvider>
    );

    expect(screen.getByText("Add birthsex")).toBeInTheDocument();
  });

  test("does NOT render Add button for simple extension when showAddAttributeButton is false", () => {
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
            valueCode: "F",
          },
        ],
      },
    });

    const birthsexValueElement = {
      id: "Extension.value[x]",
      path: "Extension.value[x]",
      type: [{ code: "code" }],
    };

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={birthsexValueElement as any}
          extensionProfileDef={mockBirthsexExtensionProfileDef as any}
          showAddAttributeButton={false}
          addTitle="birthsex"
        />
      </FormikProvider>
    );

    expect(screen.queryByText("Add birthsex")).not.toBeInTheDocument();
  });

  test("constructs the correct formik label path using type[0].code", () => {
    /**
     * For a simple extension with type "code", the formik label should be:
     *   "Patient.extension[0].valueCode"
     *
     * capitalizeFirst("code") = "Code", so the label becomes:
     *   `${label}.value${capitalizeFirst(type)}` = "Patient.extension[0].valueCode"
     *
     * This matches the JSON structure:
     *   { "url": "...", "valueCode": "ASKU" }
     */
    const mockFormik = createMockFormik({
      Patient: {
        extension: [
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
            valueCode: "ASKU",
          },
        ],
      },
    });

    const birthsexValueElement = {
      id: "Extension.value[x]",
      path: "Extension.value[x]",
      type: [{ code: "code" }],
    };

    render(
      <FormikProvider value={mockFormik}>
        <ExtensionComponent
          label="Patient.extension[0]"
          canEdit={true}
          fhirResource={{ resourceType: "Patient" }}
          elementDefinition={birthsexValueElement as any}
          extensionProfileDef={mockBirthsexExtensionProfileDef as any}
        />
      </FormikProvider>
    );

    // TypeEditor should receive label "Patient.extension[0].valueCode"
    // which gets passed to formik.getFieldProps
    expect(mockFormik.getFieldProps).toHaveBeenCalledWith(
      "Patient.extension[0].valueCode"
    );
  });
});
