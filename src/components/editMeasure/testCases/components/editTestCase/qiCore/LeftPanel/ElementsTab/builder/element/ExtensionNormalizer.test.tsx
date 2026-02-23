import * as React from "react";
import { render, act } from "@testing-library/react";
import { FormikProvider, FormikContextType } from "formik";
import * as _ from "lodash";
import ExtensionNormalizer from "./ExtensionNormalizer";

/**
 * ===========================================================================================
 * ExtensionNormalizer Tests
 * ===========================================================================================
 *
 * WHAT IS ExtensionNormalizer?
 * ----------------------------
 * ExtensionNormalizer is a headless React component (renders nothing visible) that ensures
 * sub-extensions inside a profiled FHIR extension are placed at their correct "reserved"
 * indices in the Formik values. It runs once on mount and whenever the extensionLabel or
 * elementDefinitions change.
 *
 * WHY IS IT NEEDED?
 * -----------------
 * In FHIR, a profiled extension like us-core-race defines ordered slices:
 *   0 → ombCategory
 *   1 → detailed
 *   2 → text
 *
 * However, the JSON data from the server may only have some slices present, and they may
 * appear in any order. For example, if a Patient only has "text" filled in:
 *   extension: [{ url: "text", valueString: "Some text" }]
 *
 * The TypeEditor assigns formik labels based on reserved index positions:
 *   Patient.extension[0].extension[0] → always ombCategory
 *   Patient.extension[0].extension[1] → always detailed
 *   Patient.extension[0].extension[2] → always text
 *
 * If "text" is at index 0 in the raw data but the label expects it at index 2,
 * the wrong sub-extension would be displayed in the wrong field.
 *
 * ExtensionNormalizer fixes this by reordering the sub-extensions array so each
 * slice sits at its reserved index (based on its position in elementDefinitions).
 *
 * HOW IT WORKS:
 * -------------
 * 1. Reads the current sub-extensions from formik: formik.values[extensionLabel].extension
 * 2. Calls normalizeExtensionArray() which:
 *    a. Maps each elementDefinition's sliceName to its array index (reserved index)
 *    b. Places each extension at the index that matches its url to the sliceName
 * 3. If the normalized array differs from the current array, it calls formik.resetForm()
 *    with new values that include the reordered extensions.
 *    Using resetForm() (instead of setFieldValue) ensures both formik.values AND
 *    formik.initialValues are updated, so the form is NOT marked as dirty.
 *
 * EXAMPLE:
 * --------
 * Given elementDefinitions order: [ombCategory, detailed, text]
 *
 * Input (from JSON):
 *   extension: [
 *     { url: "text", valueString: "hello" },
 *     { url: "ombCategory", valueCoding: {...} }
 *   ]
 *
 * After normalization:
 *   extension: [
 *     { url: "ombCategory", valueCoding: {...} },  // index 0 (reserved for ombCategory)
 *     undefined,                                    // index 1 (reserved for detailed, not present)
 *     { url: "text", valueString: "hello" }         // index 2 (reserved for text)
 *   ]
 * ===========================================================================================
 */

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
}));

// Helper to build nested formik values at the given label path
const buildFormikValues = (extensionLabel: string, extensions: any[]) => {
  const values = {};
  _.set(values, `${extensionLabel}.extension`, extensions);
  // Also set the url at the extension root (mimics real data)
  _.set(
    values,
    `${extensionLabel}.url`,
    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
  );
  return values;
};

/**
 * Element definitions for us-core-race, in their canonical order.
 * The sliceName determines the reserved index:
 *   index 0 → ombCategory
 *   index 1 → detailed
 *   index 2 → text
 */
const raceElementDefinitions = [
  {
    id: "Extension.extension:ombCategory",
    path: "Extension.extension",
    sliceName: "ombCategory",
    type: [{ code: "Extension" }],
  },
  {
    id: "Extension.extension:detailed",
    path: "Extension.extension",
    sliceName: "detailed",
    type: [{ code: "Extension" }],
  },
  {
    id: "Extension.extension:text",
    path: "Extension.extension",
    sliceName: "text",
    type: [{ code: "Extension" }],
  },
];

// Helper to create a mock formik context
const createMockFormik = (values: any, overrides: any = {}) => {
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

describe("ExtensionNormalizer", () => {
  describe("does NOT call resetForm (no normalization needed)", () => {
    test("when sub-extensions are already in the correct order", () => {
      /**
       * The sub-extensions [ombCategory, detailed, text] are already at indices [0, 1, 2]
       * which matches the elementDefinitions order. No normalization needed.
       */
      const extensions = [
        { url: "ombCategory", valueCoding: { code: "1002-5" } },
        { url: "detailed", valueCoding: { code: "1023-1" } },
        { url: "text", valueString: "Some text" },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).not.toHaveBeenCalled();
    });

    test("when there are no sub-extensions (empty array)", () => {
      /**
       * The extension has an empty sub-extensions array (e.g., a newly added
       * us-core-ethnicity with no slices filled in yet).
       * The early-exit check (!currentExtensions?.length) returns true.
       */
      const extensionLabel = "Patient.extension[1]";
      const values = buildFormikValues(extensionLabel, []);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).not.toHaveBeenCalled();
    });

    test("when elementDefinitions is empty (no slices to map)", () => {
      /**
       * If the profile has no editable sub-elements (no sliceName entries),
       * elementDefinitions will be []. The early-exit check
       * (!elementDefinitions?.length) returns true.
       */
      const extensions = [
        { url: "ombCategory", valueCoding: { code: "1002-5" } },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={[]}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).not.toHaveBeenCalled();
    });

    test("when only one sub-extension is present and already at correct index", () => {
      /**
       * Only ombCategory is present. It is at index 0 which is its reserved index.
       * normalizeExtensionArray places it at index 0 → same as input → no change.
       */
      const extensions = [
        { url: "ombCategory", valueCoding: { code: "ASKU" } },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).not.toHaveBeenCalled();
    });
  });

  describe("calls resetForm to reorder extensions", () => {
    test("reorders out-of-order sub-extensions to match elementDefinitions order", () => {
      /**
       * The data has [text, ombCategory] but the expected order is [ombCategory, detailed, text].
       * After normalization:
       *   index 0 → ombCategory (was at index 1)
       *   index 1 → undefined (detailed not present)
       *   index 2 → text (was at index 0)
       */
      const extensions = [
        { url: "text", valueString: "hello" },
        { url: "ombCategory", valueCoding: { code: "ASKU" } },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).toHaveBeenCalledTimes(1);

      const resetArg = mockFormik.resetForm.mock.calls[0][0];
      const normalizedExtensions = _.get(
        resetArg.values,
        `${extensionLabel}.extension`
      );

      expect(normalizedExtensions[0]).toEqual({
        url: "ombCategory",
        valueCoding: { code: "ASKU" },
      });
      expect(normalizedExtensions[1]).toBeUndefined();
      expect(normalizedExtensions[2]).toEqual({
        url: "text",
        valueString: "hello",
      });
    });

    test("moves 'text' from index 0 to its reserved index 2", () => {
      /**
       * The data has only [text] at index 0. But text's reserved index is 2.
       * After normalization:
       *   index 0 → undefined (ombCategory slot)
       *   index 1 → undefined (detailed slot)
       *   index 2 → { url: "text", valueString: "only text" }
       */
      const extensions = [{ url: "text", valueString: "only text" }];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).toHaveBeenCalledTimes(1);
      const normalizedExtensions = _.get(
        mockFormik.resetForm.mock.calls[0][0].values,
        `${extensionLabel}.extension`
      );

      expect(normalizedExtensions[0]).toBeUndefined();
      expect(normalizedExtensions[1]).toBeUndefined();
      expect(normalizedExtensions[2]).toEqual({
        url: "text",
        valueString: "only text",
      });
    });

    test("skips null/undefined entries in sparse arrays from Formik", () => {
      /**
       * Formik can produce sparse arrays with undefined/null slots.
       * normalizeExtensionArray should skip these and only place valid extensions.
       */
      const extensions = [
        null,
        { url: "text", valueString: "race text" },
        undefined,
        { url: "ombCategory", valueCoding: { code: "2054-5" } },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).toHaveBeenCalledTimes(1);
      const normalizedExtensions = _.get(
        mockFormik.resetForm.mock.calls[0][0].values,
        `${extensionLabel}.extension`
      );

      expect(normalizedExtensions[0]).toEqual({
        url: "ombCategory",
        valueCoding: { code: "2054-5" },
      });
      expect(normalizedExtensions[1]).toBeUndefined();
      expect(normalizedExtensions[2]).toEqual({
        url: "text",
        valueString: "race text",
      });
    });

    test("skips entries missing the url property (incomplete form data)", () => {
      /**
       * During form editing, Formik may create partial extension objects like
       * { valueCoding: {} } without a url. These should be skipped during normalization.
       */
      const extensions = [
        { valueCoding: { code: "" } }, // no url - incomplete
        { url: "text", valueString: "some text" },
      ];
      const extensionLabel = "Patient.extension[0]";
      const values = buildFormikValues(extensionLabel, extensions);
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).toHaveBeenCalledTimes(1);
      const normalizedExtensions = _.get(
        mockFormik.resetForm.mock.calls[0][0].values,
        `${extensionLabel}.extension`
      );

      expect(normalizedExtensions[0]).toBeUndefined();
      expect(normalizedExtensions[1]).toBeUndefined();
      expect(normalizedExtensions[2]).toEqual({
        url: "text",
        valueString: "some text",
      });
    });

    test("preserves other formik values outside the extension path", () => {
      /**
       * When normalization triggers resetForm, the new values should be a deep clone
       * of the entire formik.values with only the extension array modified.
       * Other fields (like Patient.id, Patient.name, etc.) must remain intact.
       */
      const extensionLabel = "Patient.extension[0]";
      const values = {
        Patient: {
          resourceType: "Patient",
          id: "patient-abc",
          name: [{ family: "Smith", given: ["John"] }],
          extension: [
            {
              url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
              extension: [
                { url: "text", valueString: "White" },
                { url: "ombCategory", valueCoding: { code: "2106-3" } },
              ],
            },
          ],
        },
      };
      const mockFormik = createMockFormik(values);

      render(
        <FormikProvider value={mockFormik}>
          <ExtensionNormalizer
            extensionLabel={extensionLabel}
            elementDefinitions={raceElementDefinitions as any}
          />
        </FormikProvider>
      );

      expect(mockFormik.resetForm).toHaveBeenCalledTimes(1);
      const newValues = mockFormik.resetForm.mock.calls[0][0].values;

      // Other Patient fields should be preserved
      expect(newValues.Patient.id).toBe("patient-abc");
      expect(newValues.Patient.name).toEqual([
        { family: "Smith", given: ["John"] },
      ]);
      expect(newValues.Patient.resourceType).toBe("Patient");

      // Extension should be normalized
      const normalizedExtensions =
        newValues.Patient.extension[0].extension;
      expect(normalizedExtensions[0].url).toBe("ombCategory");
      expect(normalizedExtensions[2].url).toBe("text");
    });
  });

  test("renders nothing (headless component)", () => {
    const extensionLabel = "Patient.extension[0]";
    const values = buildFormikValues(extensionLabel, []);
    const mockFormik = createMockFormik(values);

    const { container } = render(
      <FormikProvider value={mockFormik}>
        <ExtensionNormalizer
          extensionLabel={extensionLabel}
          elementDefinitions={raceElementDefinitions as any}
        />
      </FormikProvider>
    );

    // The component returns null, so the container should be empty
    expect(container.innerHTML).toBe("");
  });
});
