import * as _ from "lodash";
import { deleteMultipleCardinalityElement } from "./resourceEditorUtils";

const createMockResource = (resourceType: string, props: object = {}) => ({
  bundleEntry: { resource: { resourceType, ...props } },
});

const mockDispatch = jest.fn();

beforeEach(() => mockDispatch.mockClear());

describe("deleteMultipleCardinalityElement", () => {
  describe("numbered label deletion", () => {
    it("deletes first element when label ends with 1 (required format ' *name 1 ')", () => {
      const array = [{ family: "Smith" }, { family: "Doe" }];
      const resource = createMockResource("Patient", {
        name: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        " *name 1 ",
        array,
        resource,
        "Patient.name",
        mockDispatch
      );

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch.mock.calls[0][0].payload.resource.name).toEqual([
        { family: "Doe" },
      ]);
    });

    it("deletes second element when label ends with 2 (plain format 'performer 2 ')", () => {
      const array = [{ actor: "A" }, { actor: "B" }];
      const resource = createMockResource("Immunization", {
        performer: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "performer 2 ",
        array,
        resource,
        "Immunization.performer",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource.performer).toEqual([
        { actor: "A" },
      ]);
    });

    it("does not mutate the original array", () => {
      const original = [{ family: "Smith" }, { family: "Doe" }];
      const resource = createMockResource("Patient", {
        name: _.cloneDeep(original),
      });

      deleteMultipleCardinalityElement(
        " *name 1 ",
        original,
        resource,
        "Patient.name",
        mockDispatch
      );

      expect(original).toHaveLength(2);
    });
  });

  describe("single-item array (no numeric suffix)", () => {
    it("removes the property entirely when the only item is deleted", () => {
      const array = [{ actor: { reference: "Practitioner/123" } }];
      const resource = createMockResource("Immunization", {
        performer: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "performer",
        array,
        resource,
        "Immunization.performer",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource).not.toHaveProperty(
        "performer"
      );
    });
  });

  describe("last remaining element after delete", () => {
    it("removes the property entirely when deleting brings count to zero", () => {
      const array = [{ family: "Smith" }, { family: "Doe" }];
      const resource = createMockResource("Patient", {
        name: _.cloneDeep(array),
      });

      // Delete index 0
      deleteMultipleCardinalityElement(
        " *name 1 ",
        array,
        resource,
        "Patient.name",
        mockDispatch
      );
      // Delete index 0 again (now only one item remains)
      mockDispatch.mockClear();
      const remaining = [{ family: "Doe" }];
      const resource2 = createMockResource("Patient", {
        name: _.cloneDeep(remaining),
      });

      deleteMultipleCardinalityElement(
        "name",
        remaining,
        resource2,
        "Patient.name",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource).not.toHaveProperty(
        "name"
      );
    });
  });

  describe("empty array input", () => {
    it("removes the property and dispatches immediately", () => {
      const resource = createMockResource("Patient", { name: [] });

      deleteMultipleCardinalityElement(
        "name",
        [],
        resource,
        "Patient.name",
        mockDispatch
      );

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch.mock.calls[0][0].payload.resource).not.toHaveProperty(
        "name"
      );
    });
  });

  describe("extension label deletion (URL token matching)", () => {
    it("deletes by matching display label token against URL tail (first item)", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "Extension (Sex)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch.mock.calls[0][0].payload.resource.extension).toEqual([
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
        },
      ]);
    });

    it("deletes by matching display label token against URL tail (second item)", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [{ url: "ombCategory", valueCoding: { code: "ASKU" } }],
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "Extension (Ethnicity)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource.extension).toEqual([
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
      ]);
    });

    it("does NOT match 'sex' inside 'sexual-orientation' — token boundary is respected", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sexual-orientation",
          valueCodeableConcept: { text: "straight" },
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "Extension (Sex)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      // Only us-core-sex should be removed, not us-core-sexual-orientation
      expect(mockDispatch.mock.calls[0][0].payload.resource.extension).toEqual([
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sexual-orientation",
          valueCodeableConcept: { text: "straight" },
        },
      ]);
    });

    it("removes the extension property entirely when deleting the last extension", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "Extension (Sex)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource).not.toHaveProperty(
        "extension"
      );
    });

    it("handles required-indicator prefix on extension labels ('*Extension (Sex)')", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [],
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        " *Extension (Sex)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      expect(mockDispatch.mock.calls[0][0].payload.resource.extension).toEqual([
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [],
        },
      ]);
    });

    it("deletes extension when canonical URL includes a version suffix", () => {
      const array = [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          valueCode: "M",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",
          valueCodeableConcept: { text: "nonbinary" },
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-tribal-affiliation|6.1.0",
          extension: [],
        },
      ];
      const resource = createMockResource("Patient", {
        extension: _.cloneDeep(array),
      });

      deleteMultipleCardinalityElement(
        "Extension (Tribal Affiliation)",
        array,
        resource,
        "Patient.extension",
        mockDispatch
      );

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch.mock.calls[0][0].payload.resource.extension).toEqual([
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          valueCode: "M",
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",
          valueCodeableConcept: { text: "nonbinary" },
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
          valueCode: "248152002",
        },
      ]);
    });
  });

  describe("no match found", () => {
    it("does not dispatch when label cannot be resolved to an index", () => {
      const array = [{ family: "Smith" }, { family: "Doe" }];
      const resource = createMockResource("Patient", {
        name: _.cloneDeep(array),
      });

      // No numeric suffix and not an extension path
      deleteMultipleCardinalityElement(
        "name",
        array,
        resource,
        "Patient.name",
        mockDispatch
      );

      // element.length === 2 (not 1), no numeric suffix → getIndexFromElementName returns null
      // strippedPath = "name" which does not end with "extension" → getIndexFromExtensionLabel returns null
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
