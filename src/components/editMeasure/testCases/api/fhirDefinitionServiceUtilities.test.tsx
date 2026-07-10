import * as Yup from "yup";
import { ElementDefinition } from "fhir/r4";
import * as _ from "lodash";
import {
  getBasePath,
  getTopLevelElements,
  getRequiredElements,
  stripResourcePath,
  getAllChildren,
  updateChildrenPaths,
  isComponentDataType,
  setNestedValue,
  removeUndefinedProperties,
  getElementName,
  getChildren,
  getParentDefinition,
  getFirstChildren,
  stripArrayIndices,
  removeLastPathSegment,
  getValueByPath,
  mapElementsByPath,
  getIndexFromPath,
  mergePathWithIndex,
  removeIndicesFromPath,
  buildFullValidationSchema,
  buildSchemaRecursive,
  recursiveAddYupObject,
  addCardinalityToElement,
  formatChoiceType,
  modifySliceNameForReadability,
  extractNameWithoutIndex,
  filterUnusedExtensionsFromElements,
  getParentPath,
  formatAttributeLabel,
  buildPrefixSet,
  shouldSkip,
  normalizeExtensionArray,
  getEditableExtensionSubElements,
  stripOutUnusedAttributes,
  stripOutUsedAttributesForElements,
  isMultiCardinalityElement,
} from "./fhirDefinitionServiceUtilities";
import { StructureDefinitionDto } from "./models/StructureDefinitionDto";

describe("FhirDefinitionServiceUtilities", () => {
  const mockResource = {
    definition: {
      snapshot: {
        element: [
          {
            path: "Patient",
            min: 1,
            type: [{ code: "Resource" }],
          },
          {
            path: "Patient.name",
            min: 0,
            type: [{ code: "HumanName" }],
          },
          {
            path: "Patient.age",
            min: 1,
            type: [{ code: "integer" }],
          },
          {
            path: "Patient.address.street",
            min: 0,
            type: [{ code: "string" }],
          },
          {
            path: "Patient.extension",
            id: "Patient.extension:race",
            min: 0,
            type: [
              {
                code: "Extension",
                profile: [
                  "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
                ],
              },
            ],
          },
        ],
      },
    },
  };

  describe("getBasePath", () => {
    it("should return the base path from the first element", () => {
      const result = getBasePath(mockResource);
      expect(result).toBe("Patient");
    });

    it("Should remove indices from path", () => {
      const result = removeIndicesFromPath("Patient.name[0]");
      expect(result).toBe("Patient.name");
    });

    it("should return undefined if no elements are present", () => {
      const result = getBasePath({});
      expect(result).toBeUndefined();
    });
  });

  describe("getTopLevelElements", () => {
    it("should return elements with a path length of 2", () => {
      const mutableResource = _.cloneDeep(mockResource);
      mutableResource.definition.snapshot.element.push({
        path: "Patient.multipleBirth[x]",
        min: 1,
        type: [{ code: "boolean" }, { code: "integer" }],
      });
      const result = getTopLevelElements(mutableResource);
      // Elements should now be sorted alphabetically and include all elements
      expect(result).toEqual([
        { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
        {
          path: "Patient.extension",
          id: "Patient.extension:race",
          min: 0,
          type: [
            {
              code: "Extension",
              profile: [
                "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
              ],
            },
          ],
        },
        {
          path: "Patient.multipleBirth[x]",
          min: 1,
          type: [{ code: "boolean" }],
        },
        {
          path: "Patient.multipleBirth[x]",
          min: 1,
          type: [{ code: "integer" }],
        },
        { path: "Patient.name", min: 0, type: [{ code: "HumanName" }] },
      ]);
    });

    it("should filter out non-extension sliced elements", () => {
      const resourceWithSlices = _.cloneDeep(mockResource);
      resourceWithSlices.definition.snapshot.element.push(
        {
          path: "Patient",
          id: "resourceWithSlices",
          min: 1,
          type: [{ code: "Resource" }],
        },
        {
          id: "Condition.category:us-core",
          path: "Condition.category",
          min: 0,
          type: [{ code: "CodeableConcept" }],
        },
        {
          id: "Observation.code:laboratory",
          path: "Observation.code",
          min: 0,
          type: [{ code: "CodeableConcept" }],
        },
        {
          path: "Patient.id",
          id: "Patient.id",
          min: 1,
          type: [{ code: "Resource" }],
        }
      );
      const result = getTopLevelElements(resourceWithSlices);

      // Non-extension slices should be filtered out
      expect(
        result.find((el) => el.id === "Condition.category:us-core")
      ).toBeUndefined();
      expect(
        result.find((el) => el.id === "Observation.code:laboratory")
      ).toBeUndefined();
      // Extension slices should remain
      expect(
        result.find((el) => el.id === "Patient.extension:race")
      ).toBeDefined();
      expect(result.find((el) => el.id === "Patient.id")).toBeUndefined();
    });

    it("should keep extension slices but filter non-extension slices", () => {
      const resourceWithMixedSlices = _.cloneDeep(mockResource);
      resourceWithMixedSlices.definition.snapshot.element.push(
        {
          id: "Patient.extension:ethnicity",
          path: "Patient.extension",
          min: 0,
          type: [
            {
              code: "Extension",
              profile: [
                "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
              ],
            },
          ],
        },
        {
          id: "Condition.category:encounter-diagnosis",
          path: "Condition.category",
          min: 0,
          type: [{ code: "CodeableConcept" }],
        }
      );
      const result = getTopLevelElements(resourceWithMixedSlices);

      // Extension slices should be kept
      expect(
        result.find((el) => el.id === "Patient.extension:race")
      ).toBeDefined();
      expect(
        result.find((el) => el.id === "Patient.extension:ethnicity")
      ).toBeDefined();
      // Non-extension slice should be filtered out
      expect(
        result.find((el) => el.id === "Condition.category:encounter-diagnosis")
      ).toBeUndefined();
    });

    it("should handle elements without colons normally", () => {
      const result = getTopLevelElements(mockResource);

      // Regular elements without colons should be present
      expect(result.find((el) => el.path === "Patient.name")).toBeDefined();
      expect(result.find((el) => el.path === "Patient.age")).toBeDefined();
    });

    it("should filter out generic extension elements without sliceName", () => {
      const resourceWithGenericExtension = _.cloneDeep(mockResource);
      resourceWithGenericExtension.definition.snapshot.element.push(
        {
          id: "ClaimResponse.extension",
          path: "ClaimResponse.extension",
          min: 0,
          type: [{ code: "Extension" }],
        },
        {
          id: "Condition.extension",
          path: "Condition.extension",
          min: 0,
          type: [{ code: "Extension" }],
        },
        {
          id: "Patient.extension:ethnicity",
          path: "Patient.extension",
          sliceName: "ethnicity",
          min: 0,
          type: [
            {
              code: "Extension",
              profile: [
                "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
              ],
            },
          ],
        }
      );
      const result = getTopLevelElements(resourceWithGenericExtension);

      // Generic extensions without sliceName should be filtered out
      expect(
        result.find((el) => el.id === "ClaimResponse.extension")
      ).toBeUndefined();
      expect(
        result.find((el) => el.id === "Condition.extension")
      ).toBeUndefined();
      // Sliced extensions should remain
      expect(
        result.find((el) => el.id === "Patient.extension:race")
      ).toBeDefined();
      expect(
        result.find((el) => el.id === "Patient.extension:ethnicity")
      ).toBeDefined();
    });

    it("should filter out attributes or extensions that are of type 'Age'", () => {
      const testResource = {
        definition: {
          snapshot: {
            element: [
              {
                id: "Condition.onset[x]",
                path: "Condition.onset[x]",
                min: 0,
                max: "1",
                type: [
                  {
                    code: "dateTime",
                  },
                  {
                    code: "Age",
                  },
                  {
                    code: "Period",
                  },
                  {
                    code: "Range",
                  },
                ],
              },
            ],
          },
        },
      };

      const result = getTopLevelElements(testResource);
      expect(result).toEqual([
        {
          id: "Condition.onset[x]",
          max: "1",
          min: 0,
          path: "Condition.onset[x]",
          type: [
            {
              code: "dateTime",
            },
          ],
        },
        {
          id: "Condition.onset[x]",
          max: "1",
          min: 0,
          path: "Condition.onset[x]",
          type: [
            {
              code: "Period",
            },
          ],
        },
        {
          id: "Condition.onset[x]",
          max: "1",
          min: 0,
          path: "Condition.onset[x]",
          type: [
            {
              code: "Range",
            },
          ],
        },
      ]);
    });

    it("should filter out attribute of AllergyIntolerance.extension:resolutionAge", () => {
      const testResource = {
        definition: {
          snapshot: {
            element: [
              {
                id: "AllergyIntolerance.extension:resolutionAge",
                path: "AllergyIntolerance.extension",
              },
            ],
          },
        },
      };
      const result = getTopLevelElements(testResource);
      expect(result).toEqual([]);
    });
  });

  describe("getRequiredElements", () => {
    it("should return elements with min > 0 and path length of 2", () => {
      const result = getRequiredElements(mockResource);
      expect(result).toEqual([
        { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
      ]);
    });
  });

  describe("stripResourcePath", () => {
    it("should strip the resource path from the element path", () => {
      const result = stripResourcePath("Patient", "Patient.name");
      expect(result).toBe("name");
    });

    it("should return the original path if the resource path is not included", () => {
      const result = stripResourcePath("Doctor", "Patient.name");
      expect(result).toBe(".name");
    });
  });

  describe("getAllChildren", () => {
    it("should return all child elements of a given path", () => {
      const result = getAllChildren(mockResource, "Patient");
      expect(result).toEqual([
        { path: "Patient.name", min: 0, type: [{ code: "HumanName" }] },
        { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
        { path: "Patient.address.street", min: 0, type: [{ code: "string" }] },
        {
          path: "Patient.extension",
          id: "Patient.extension:race",
          min: 0,
          type: [
            {
              code: "Extension",
              profile: [
                "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
              ],
            },
          ],
        },
      ]);
    });

    it("should return an empty array if no children are found", () => {
      const result = getAllChildren(mockResource, "Doctor");
      expect(result).toEqual([]);
    });
  });

  describe("updateChildrenPaths", () => {
    it("should update child element paths based on the structureDefinition id", () => {
      const structureDefinition = { id: "Procedure" };
      const elements = [{ id: "Annotation.text", path: "Annotation.text" }];

      const result = updateChildrenPaths(structureDefinition, elements);
      expect(result).toEqual([
        { id: "Procedure.text", path: "Procedure.text" },
      ]);
    });
  });

  describe("isComponentDataType", () => {
    it("should return true for valid data types", () => {
      expect(isComponentDataType("boolean")).toBe(true);
      expect(isComponentDataType("date")).toBe(true);
      expect(isComponentDataType("Extension")).toBe(true);
    });

    it("should return true for Duration regardless of casing", () => {
      expect(isComponentDataType("Duration")).toBe(true);
      expect(isComponentDataType("duration")).toBe(true);
    });

    it("should return false for invalid data types", () => {
      expect(isComponentDataType("customType")).toBe(false);
      expect(isComponentDataType("unknown")).toBe(false);
    });
  });

  describe("setNestedValue", () => {
    it("should set a nested value", () => {
      const obj = {};
      setNestedValue(obj, "a.b.c", 42);
      expect(obj).toEqual({ a: { b: { c: 42 } } });
    });

    it("should override", () => {
      const obj = { a: { b: { c: 10 } } };
      setNestedValue(obj, "a.b.c", 99);
      expect(obj.a.b.c).toBe(99);
    });

    it("should create nested structure when missing", () => {
      const obj = {};
      setNestedValue(obj, "x.y.z", "test");
      expect(obj).toEqual({ x: { y: { z: "test" } } });
    });
  });

  describe("removeUndefinedProperties", () => {
    it("should remove undefined values from an object", () => {
      const obj = { a: 1, b: undefined, c: 3 };
      expect(removeUndefinedProperties(obj)).toEqual({ a: 1, c: 3 });
    });

    it("should keep nested objects with values", () => {
      const obj = { a: { b: { c: 5 } }, d: 4 };
      expect(removeUndefinedProperties(obj)).toEqual({
        a: { b: { c: 5 } },
        d: 4,
      });
    });

    it("should return the same value if not an object", () => {
      expect(removeUndefinedProperties(null)).toBe(null);
      expect(removeUndefinedProperties(12)).toBe(12);
      expect(removeUndefinedProperties("test")).toBe("test");
    });

    it("should return array by removing undefined values", () => {
      expect(
        removeUndefinedProperties(["2024", "", undefined, null, "08/09/2025"])
      ).toEqual(["2024", "", null, "08/09/2025"]);
    });

    it("should remove null values from an object", () => {
      const obj = { a: 1, b: null, c: 3 };
      expect(removeUndefinedProperties(obj)).toEqual({ a: 1, c: 3 });
    });

    it("should remove empty objects from nested structures", () => {
      const obj = { a: 1, b: {}, c: 3 };
      expect(removeUndefinedProperties(obj)).toEqual({ a: 1, c: 3 });
    });

    it("should remove deeply nested undefined values", () => {
      const obj = {
        a: {
          b: {
            c: undefined,
            d: null,
          },
        },
        e: 5,
      };
      expect(removeUndefinedProperties(obj)).toEqual({ e: 5 });
    });

    it("should preserve the 'x' key when present", () => {
      const obj = { a: 1, x: undefined, b: 2 };
      expect(removeUndefinedProperties(obj)).toEqual({
        a: 1,
        x: undefined,
        b: 2,
      });
    });

    it("should handle extension arrays with valid url properties", () => {
      const obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });

    it("should filter out extension objects without url property", () => {
      const obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { valueString: "no url" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });

    it("should filter out null and undefined values from extension arrays", () => {
      const obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          null,
          undefined,
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });

    it("should filter out empty strings from extension arrays", () => {
      const obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          "",
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });

    it("should delete extension key when all extensions are filtered out", () => {
      const obj = {
        name: "test",
        extension: [{ valueString: "no url" }, null, undefined, ""],
      };
      expect(removeUndefinedProperties(obj)).toEqual({ name: "test" });
    });

    it("should delete extension key when array becomes empty after filtering", () => {
      const obj = {
        name: "test",
        extension: [],
      };
      expect(removeUndefinedProperties(obj)).toEqual({ name: "test" });
    });

    it("should recursively clean nested objects within extension arrays", () => {
      const obj = {
        extension: [
          {
            url: "http://example.com/ext1",
            valueString: "test",
            nested: { a: 1, b: undefined },
          },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        extension: [
          {
            url: "http://example.com/ext1",
            valueString: "test",
            nested: { a: 1 },
          },
        ],
      });
    });

    it("should handle arrays of objects with undefined properties", () => {
      const obj = {
        items: [
          { id: 1, name: "test", value: undefined },
          { id: 2, name: "test2", value: "valid" },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        items: [
          { id: 1, name: "test" },
          { id: 2, name: "test2", value: "valid" },
        ],
      });
    });

    it("should handle nested arrays within objects", () => {
      const obj = {
        data: {
          values: [1, undefined, 2, null, 3],
        },
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        data: {
          values: [1, 2, null, 3],
        },
      });
    });

    it("should handle complex nested structures", () => {
      const obj = {
        patient: {
          name: [
            { given: ["John"], family: "Doe" },
            { given: undefined, family: null },
          ],
          identifier: { value: "123", system: undefined },
          extension: [
            { url: "http://example.com/race", valueString: "test" },
            { valueString: "no url" },
          ],
        },
        meta: {},
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        patient: {
          name: [
            { given: ["John"], family: "Doe" },
            {}, // empty object remains in array after removing undefined/null properties
          ],
          identifier: { value: "123" },
          extension: [{ url: "http://example.com/race", valueString: "test" }],
        },
      });
    });

    it("should handle objects where all properties become empty", () => {
      const obj = {
        wrapper: {
          a: undefined,
          b: null,
          c: {},
        },
      };
      expect(removeUndefinedProperties(obj)).toEqual({});
    });

    it("should preserve false and 0 values", () => {
      const obj = { a: 0, b: false, c: "", d: undefined };
      expect(removeUndefinedProperties(obj)).toEqual({ a: 0, b: false, c: "" });
    });

    it("should handle arrays with nested objects containing empty values", () => {
      const obj = {
        data: [
          { id: 1, meta: { a: undefined } },
          { id: 2, meta: { b: "value" } },
        ],
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        data: [{ id: 1 }, { id: 2, meta: { b: "value" } }],
      });
    });

    it("should handle extension arrays within nested objects", () => {
      const obj = {
        patient: {
          extension: [
            { url: "http://example.com/ext", valueString: "test" },
            { noUrl: "value" },
          ],
        },
        observation: {
          extension: null,
        },
      };
      expect(removeUndefinedProperties(obj)).toEqual({
        patient: {
          extension: [{ url: "http://example.com/ext", valueString: "test" }],
        },
      });
    });

    it("should handle hasOwnProperty check correctly", () => {
      const obj = Object.create({ inherited: "value" });
      obj.own = "test";
      obj.empty = undefined;
      expect(removeUndefinedProperties(obj)).toEqual({ own: "test" });
    });
  });
});

describe("getElementName", () => {
  it("returns the choiceType if exists", () => {
    const element = {
      id: "some.path[x]",
      min: 0,
      max: "1",
      path: "some.path[x]",
      type: [{ code: "boolean" }],
    };
    expect(getElementName(element, "some", [])).toBe("pathBoolean");
  });

  it("returns the slice if exists", () => {
    const element = {
      id: "some.path",
      min: 0,
      path: "some.path",
    };
    expect(getElementName(element, "some", [])).toBe("Path");
  });
  it("should handles not a number index", () => {
    const element = {
      id: "Patient.name[asdf]",
      min: 1,
    } as any;
    const basePath = "Patient";
    const result = getElementName(element, basePath, [{}, {}]);
    expect(result).toBe(" *Name Asdf");
  });

  it("should handle retrievedIndex and Number(retrievedIndex) > 0 to add correct index", () => {
    const element = {
      id: "Patient.name[1]",
      min: 1,
    } as any;
    const basePath = "Patient";
    const result = getElementName(element, basePath, [{}, {}]);
    expect(result).toBe(" *Name 2 ");
  });

  it("should format for ChoiceType elements correctly", () => {
    const element = {
      id: "Patient.effective[x]",
      path: "Patient.effective[x]",
      min: 0,
      max: 1,
      type: [{ code: "dateTime" }],
    } as any;
    const basePath = "Patient";
    const result = formatChoiceType(element, basePath);
    expect(result).toBe("effectiveDateTime");
  });

  it("handles index 0 correctly", () => {
    const element = {
      id: "Patient.name[0]",
      min: 0,
    } as any;
    const basePath = "Patient";
    const result = getElementName(element, basePath, [{}, {}]);
    expect(result).toBe("Name 1 ");
  });

  it("returns path minus base", () => {
    const element = { id: "some.path", min: 0, path: "some.path" };
    expect(getElementName(element, "some", [])).toBe("Path");
  });

  it("Should add required indicator when the attribute is required", () => {
    const element = { id: "some.path", min: 1, path: "some.path" };
    expect(getElementName(element, "some", null)).toBe(" *Path");
  });

  it("adds required indicator", () => {
    const element = {
      id: "some.path",
      min: 1,
      path: "some.path",
    };
    expect(getElementName(element, "some", {})).toBe(" *Path");
  });
  it("returns sliceName with index and requiredIndicator if sliceName exists", () => {
    const element = {
      id: "Patient.name[0].given",
      path: "Patient.name.given",
      min: 1,
      sliceName: "someothergivenname",
    };
    expect(getElementName(element as any, "Patient", [])).toBe(
      " *Given (Someothergivenname)"
    );
  });

  it("returns path without basePath and indexes if no sliceName", () => {
    const element = { id: "Patient.name[0].family", min: 0 };
    const nameFamily = getElementName(element as any, "Patient", []);
    expect(nameFamily).toBe("Family");
  });

  it("handles no index correctly", () => {
    const element = { id: "Patient.birthDate", min: 0 };
    expect(getElementName(element as any, "Patient", [])).toBe("Birth Date");
  });

  it("adds required indicator if min > 0", () => {
    const element = { id: "Patient.gender", min: 1 };
    expect(getElementName(element as any, "Patient", [])).toBe(" *Gender");
  });
});

describe("getChildren", () => {
  it("returns immediate children under parentPath", () => {
    const formInfo = {
      "Patient.name": {},
      "Patient.name.given": {},
      "Patient.name.family": {},
      "Patient.address": {},
    };
    const result = getChildren(formInfo, "Patient.name");
    expect(result.map(([key]) => key)).toEqual([
      "Patient.name.given",
      "Patient.name.family",
    ]);
  });

  it("returns empty array if no children", () => {
    const formInfo = { "Patient.address": {} };
    expect(getChildren(formInfo, "Patient.name")).toEqual([]);
  });
});

describe("buildFullValidationSchema", () => {
  it("should build validation schema including primitive validations and arrays", () => {
    const formInfo = {
      "Patient.name": {
        id: "Patient.name",
        max: "*",
        validation: undefined,
      },
      "Patient.name.given": {
        id: "Patient.name.given",
        validation: Yup.string().required("Given name is required"),
      },
      "Patient.name.family": {
        id: "Patient.name.family",
        validation: Yup.string().required("Family name is required"),
      },
      "Patient.birthDate": {
        id: "Patient.birthDate",
        validation: Yup.string().required("Birthdate is required"),
      },
    };

    const schema = buildFullValidationSchema(formInfo);

    expect(schema).toBeInstanceOf(Yup.ObjectSchema);

    const validData = {
      Patient: {
        birthDate: "2000-01-01",
        name: [
          { given: "bolwin", family: "pw" },
          { given: "theo", family: "smith" },
        ],
      },
    };

    expect(() => schema.validateSync(validData)).not.toThrow();

    const invalidData = {
      Patient: {
        name: [{ family: "invalid" }],
        birthDate: "",
      },
    };

    try {
      schema.validateSync(invalidData, { abortEarly: false });
    } catch (e) {
      expect(e.inner.map((err) => err.path)).toEqual([
        "Patient.name[0].given",
        "Patient.birthDate",
      ]);
    }
  });

  it("excludes abstract choice-type ([x]) keys from the shape but enforces the required choice via a concrete variant", () => {
    const formInfo = {
      "Coverage.costToBeneficiary": {
        id: "Coverage.costToBeneficiary",
        max: "*",
        min: 0,
      },
      "Coverage.costToBeneficiary[0]": {
        id: "Coverage.costToBeneficiary[0]",
        max: "1",
        min: 0,
      },
      "Coverage.costToBeneficiary[0].type": {
        id: "Coverage.costToBeneficiary[0].type",
        validation: Yup.object().required("Type is required"),
      },
      // Abstract choice type: never a literal data key, only concrete variants
      // (valueMoney, valueQuantity, ...) exist in real FHIR data. It is required.
      "Coverage.costToBeneficiary[0].value[x]": {
        id: "Coverage.costToBeneficiary[0].value[x]",
        min: 1,
        required: true,
        validation: Yup.object().required("Value is required"),
      },
    };

    const schema = buildSchemaRecursive(
      formInfo,
      "Coverage.costToBeneficiary[0]"
    );

    // A concrete variant (valueMoney) satisfies the required choice.
    const validData = {
      type: { coding: [{ system: "test", code: "test" }] },
      valueMoney: { value: 30, currency: "USD" },
    };

    expect(() => schema.validateSync(validData)).not.toThrow();

    // No concrete value* variant present -> required choice fails.
    const invalidData = {
      type: { coding: [{ system: "test", code: "test" }] },
    };

    expect(() => schema.validateSync(invalidData)).toThrow("Value is required");
  });
});

describe("getParentDefinition", () => {
  it("finds the parent definition", () => {
    const formInfo = [
      ["Patient.name", { label: "Name" }],
      ["Patient.name.given", { label: "Given" }],
    ];
    const result = getParentDefinition("Patient.name.given", formInfo);
    expect(result).toEqual({ label: "Name" });
  });

  it("returns undefined if no parent found", () => {
    const formInfo = [["Patient.name", { label: "Name" }]];
    expect(getParentDefinition("Patient.gender", formInfo)).toBeUndefined();
  });

  it("returns undefined if root node", () => {
    const formInfo = [["Patient", { label: "Patient" }]];
    expect(getParentDefinition("Patient", formInfo)).toBeUndefined();
  });
});

describe("getFirstChildren", () => {
  it("returns first children correctly", () => {
    const formInfo = [
      ["Patient.name", {}],
      ["Patient.name.given", {}],
      ["Patient.name.given.family", {}],
      ["Patient.gender", {}],
    ];
    const result = getFirstChildren("Patient.name", formInfo);
    expect(result.length).toBe(1);
  });

  it("should exclude elements ending with '.id'", () => {
    const formInfo = [
      ["Patient.name", { id: "Patient.name" }],
      ["Patient.name.given", { id: "Patient.name.given" }],
      ["Patient.name.family", { id: "Patient.name.family" }],
      ["Patient.name.id", { id: "Patient.name.id" }],
    ];

    const result = getFirstChildren("Patient.name", formInfo);
    expect(result).toEqual([
      { id: "Patient.name.given" },
      { id: "Patient.name.family" },
    ]);
  });

  it("returns empty array if no children", () => {
    const formInfo = [["Patient.gender", {}]];
    expect(getFirstChildren("Patient.name", formInfo)).toEqual([]);
  });
});

describe("stripArrayIndices", () => {
  it("removes array indices from path", () => {
    expect(stripArrayIndices("Patient.name[0].given[1]")).toBe(
      "Patient.name.given"
    );
  });

  it("returns path unchanged if no indices", () => {
    expect(stripArrayIndices("Patient.gender")).toBe("Patient.gender");
  });
});

describe("removeLastPathSegment", () => {
  it("removes last segment from path", () => {
    expect(removeLastPathSegment("Patient.name.given")).toBe("Patient.name");
  });

  it("returns empty string if single segment", () => {
    expect(removeLastPathSegment("Patient")).toBe("");
  });
});

describe("getValueByPath", () => {
  it("retrieves nested value", () => {
    const obj = { Patient: { name: { given: "john" } } };
    expect(getValueByPath(obj, "Patient.name.given")).toBe("john");
  });

  it("returns undefined if path does not exist", () => {
    const obj = { Patient: { name: {} } };
    expect(getValueByPath(obj, "Patient.address.street")).toBeUndefined();
  });
});

describe("mapElementsByPath", () => {
  it("maps elements by their path", () => {
    const structureDefinition = {
      definition: {
        snapshot: {
          element: [{ path: "Patient.name" }, { path: "Patient.name.given" }],
        },
      },
    };
    const result = mapElementsByPath(structureDefinition);
    expect(result["Patient.name"]).toEqual({ path: "Patient.name" });
    expect(result["Patient.name.given"]).toEqual({
      path: "Patient.name.given",
    });
  });

  it("returns empty object if no elements", () => {
    expect(mapElementsByPath({})).toEqual({});
  });
});

describe("getIndexFromPath", () => {
  it("returns the index from path", () => {
    expect(getIndexFromPath("Patient.name[2]")).toBe("[2]");
  });

  it("returns null if no index", () => {
    expect(getIndexFromPath("Patient.gender")).toBeNull();
  });
});

describe("mergePathWithIndex", () => {
  it("merges paths correctly with existing index", () => {
    const pathWithIndex = "Patient.name[1]";
    const pathWithoutIndex = "Patient.name.given";
    expect(mergePathWithIndex(pathWithIndex, pathWithoutIndex)).toBe(
      "Patient.name[1].given"
    );
  });

  it("merges paths correctly when base differs", () => {
    const pathWithIndex = "Patient.address[0]";
    const pathWithoutIndex = "Patient.contact.name";
    expect(mergePathWithIndex(pathWithIndex, pathWithoutIndex)).toBe(
      "Patient.address[0].Patient.contact.name"
    );
  });

  it("fallbacks to joining paths if no index", () => {
    const pathWithIndex = "Patient.name";
    const pathWithoutIndex = "Patient.name.given";
    expect(mergePathWithIndex(pathWithIndex, pathWithoutIndex)).toBe(
      "Patient.name.Patient.name.given"
    );
  });
});

describe("buildFullValidationSchema", () => {
  it("handles array of objects with children", () => {
    const formInfo = {
      Patient: { id: "Patient" },
      "Patient.address": { id: "Patient.address", max: "*" },
      "Patient.address.line": {
        id: "Patient.address.line",
      },
      "Patient.address.city": {
        id: "Patient.address.city",
        validation: Yup.string().required("City is required"),
      },
    };

    const schema = buildFullValidationSchema(formInfo, "Patient");
    expect(() =>
      schema.validateSync(
        {
          Patient: {
            address: [{ line: "", city: "" }],
          },
        },
        { abortEarly: false }
      )
    ).toThrowError(
      expect.objectContaining({
        name: "ValidationError",
        inner: expect.arrayContaining([
          expect.objectContaining({ path: "Patient.address[0].city" }),
        ]),
      })
    );
  });
});

describe("recursiveAddYupObject", () => {
  it("wraps all nested objects with with shape, and skips objects that are already schemas", () => {
    const schemaObject = {
      patient: {
        name: {
          first: Yup.string().required(),
          last: Yup.string().required(),
        },
        age: Yup.number().min(0),
      },
      meta: Yup.object().shape({
        version: Yup.string().required(),
      }),
      flag: true,
    };

    const result = recursiveAddYupObject(schemaObject);

    expect(Yup.object().isType(result.patient)).toBe(true);
    expect(Yup.object().isType(result.meta)).toBe(true);
    expect(result.flag).toBe(true);

    const patientSchema = result.patient as Yup.ObjectSchema<any>;
    expect(Yup.object().isType(patientSchema.fields.name)).toBe(true);
    expect(patientSchema.fields.age).toBeInstanceOf(Yup.NumberSchema);
  });

  it("returns the original object mutated", () => {
    const input = {
      group: {
        a: Yup.string(),
        b: Yup.number(),
      },
    };
    const yupObj = recursiveAddYupObject(input);

    expect(yupObj).toBe(input);
    expect(Yup.object().isType(yupObj.group)).toBe(true);
  });
});

describe("addCardinalityToElement", () => {
  const mockRootElement = {
    id: "Communication.instantiatesUri[0]",
    path: "Communication.instantiatesUri",
    short: "Instantiates external protocol or definition",
    max: "*",
    base: {
      path: "Communication.instantiatesUri",
      min: 0,
      max: "*",
    },
    type: [
      {
        code: "uri",
      },
    ],
  };

  it("should add a new element when the path is missing", () => {
    const nextEntry = { resource: {} };
    const elemPath = "name";
    const result = addCardinalityToElement(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });

  it("should wrap a non-array element in an array and add a new element", () => {
    const nextEntry = { resource: { name: { given: "John" } } };
    const elemPath = "name";
    const result = addCardinalityToElement(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, ""]);
  });

  it("should append a el to existing array", () => {
    const nextEntry = { resource: { name: [{ given: "John" }] } };
    const elemPath = "name";
    const result = addCardinalityToElement(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, ""]);
  });

  it("should handle by converting to array", () => {
    const nextEntry = { resource: { name: {} } };
    const elemPath = "name";
    const result = addCardinalityToElement(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });

  it("should handle undefined paths by converting to array", () => {
    const nextEntry = { resource: { name: undefined } };
    const elemPath = "name";
    const result = addCardinalityToElement(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });

  it("should return an empty array if no elements match the criteria", () => {
    const resource = {
      definition: {
        snapshot: {
          element: [
            { path: "Patient.meta", id: "Patient.meta", max: "1" },
            { path: "Patient.language", id: "Patient.language", max: "1" },
            { path: "Patient.name", id: "Patient.name", max: "1" },
            { path: "Patient.contained", id: "Patient.contained", max: "1" },
            {
              path: "Patient.implicitRules",
              id: "Patient.implicitRules",
              max: "1",
            },
            { path: "Patient.text", id: "Patient.text", max: "1" },
          ],
        },
      },
    };

    const result = getTopLevelElements(resource);
    expect(result).toEqual([
      { id: "Patient.name", max: "1", path: "Patient.name" },
    ]);
  });
  it("Should handle modifySliceNameForReadability all cases", () => {
    const r1 = modifySliceNameForReadability("cardiology");
    expect(r1).toBe("Cardiology");
    const r2 = modifySliceNameForReadability("mental-health");
    expect(r2).toBe("Mental Health");
    const r3 = modifySliceNameForReadability("us-core");
    expect(r3).toBe("US Core");
    const r4 = modifySliceNameForReadability("us-vital-signs");
    expect(r4).toBe("US Vital Signs");
    const r5 = modifySliceNameForReadability("us-core-pediatric-growth");
    expect(r5).toBe("US Core Pediatric Growth");
  });
});

describe("extractNameWithoutIndex", () => {
  const element = {
    id: "Patient.extension[x]",
  } as ElementDefinition;
  it("should extract the name without index", () => {
    const result = extractNameWithoutIndex(element);
    expect(result).toBe("Patient.extension");
  });

  it("should handle empty id", () => {
    const emptyElement = { id: "" } as ElementDefinition;
    const result = extractNameWithoutIndex(emptyElement);
    expect(result).toBe("");
  });
});

describe("filterUnusedExtensionsFromElements", () => {
  const allDisplayedElements = [
    {
      id: "Patient.extension:race",
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement",
          valueBoolean: true,
        },
        {
          url: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-keyelement",
          valueBoolean: true,
        },
      ],
      path: "Patient.extension",
      sliceName: "race",
      type: [
        {
          code: "Extension",
          profile: [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          ],
        },
      ],
    },
    {
      id: "Patient.extension:ethnicity",
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement",
          valueBoolean: true,
        },
        {
          url: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-keyelement",
          valueBoolean: true,
        },
      ],
      path: "Patient.extension",
      type: [
        {
          code: "Extension",
          profile: [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          ],
        },
      ],
      mustSupport: false,
      isModifier: false,
    },
    {
      id: "Patient.extension:tribalAffiliation",
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement",
          valueBoolean: true,
        },
        {
          url: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-keyelement",
          valueBoolean: true,
        },
      ],
      path: "Patient.extension",
      sliceName: "tribalAffiliation",
      type: [
        {
          code: "Extension",
          profile: [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-tribal-affiliation",
          ],
        },
      ],
    },
  ];
  it("should filter out unused extensions", () => {
    const selectedResource = {
      bundleEntry: {
        resource: {
          extension: [
            {
              url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
              extension: [],
            },
            {
              url: "some-other-extension",
              extension: [],
            },
          ],
        },
      },
      definition: {
        snapshot: {
          element: [
            {
              id: "Patient.extension:ethnicity",
              extension: [
                {
                  url: "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement",
                  valueBoolean: true,
                },
                {
                  url: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-keyelement",
                  valueBoolean: true,
                },
              ],
              path: "Patient.extension",
              sliceName: "ethnicity",
              min: 0,
              type: [
                {
                  code: "Extension",
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
                  ],
                },
              ],
            },
          ],
        },
      },
    };
    const result = filterUnusedExtensionsFromElements(
      selectedResource,
      allDisplayedElements
    );
    expect(result.length).toBe(1);
  });
});

describe("getParentPath", () => {
  it("returns parent path for deeply nested path", () => {
    const result = getParentPath("Patient.name.given.text");
    expect(result).toBe("Patient.name.given");
  });

  it("returns parent path for two-level path", () => {
    const result = getParentPath("Patient.name");
    expect(result).toBe("Patient");
  });

  it("returns null for single-level path", () => {
    const result = getParentPath("Patient");
    expect(result).toBeNull();
  });

  it("returns null for null or undefined input", () => {
    expect(getParentPath(null)).toBeNull();
    expect(getParentPath(undefined)).toBeNull();
  });
});

describe("formatAttributeLabel", () => {
  it("formats paths ending with array indices", () => {
    expect(formatAttributeLabel("ClaimResponse.item[0]")).toBe("Item[0]");
    expect(formatAttributeLabel("Patient.name[1]")).toBe("Name[1]");
    expect(formatAttributeLabel("Claim.item[2]")).toBe("Item[2]");
    expect(formatAttributeLabel("ClaimResponse.itemSequence[0]")).toBe(
      "Item Sequence[0]"
    );
  });

  it("formats final attribute even when array indices exist earlier in path", () => {
    expect(formatAttributeLabel("ClaimResponse.item[0].itemSequence")).toBe(
      "Item Sequence"
    );
    expect(formatAttributeLabel("Patient.name[1].family")).toBe("Family");
    expect(formatAttributeLabel("Claim.item[0].careTeamSequence")).toBe(
      "Care Team Sequence"
    );
    expect(formatAttributeLabel("Patient.photo[0].data")).toBe("Data");
    expect(formatAttributeLabel("Patient.photo[1].hash")).toBe("Hash");
  });

  it("formats simple attribute paths to Title Case", () => {
    expect(formatAttributeLabel("Patient.name.family")).toBe("Family");
    expect(formatAttributeLabel("Encounter.period.start")).toBe("Start");
    expect(formatAttributeLabel("Observation.status")).toBe("Status");
  });

  it("formats camelCase choice types to Title Case", () => {
    expect(
      formatAttributeLabel("Claim.procedure.procedureCodeableConcept")
    ).toBe("Procedure Codeable Concept");
    expect(formatAttributeLabel("Observation.valueQuantity")).toBe(
      "Value Quantity"
    );
    expect(
      formatAttributeLabel("MedicationRequest.medicationCodeableConcept")
    ).toBe("Medication Codeable Concept");
  });

  it("handles single-segment paths", () => {
    expect(formatAttributeLabel("Patient")).toBe("Patient");
    expect(formatAttributeLabel("itemSequence")).toBe("Item Sequence");
  });

  it("handles null and undefined inputs", () => {
    expect(formatAttributeLabel(null)).toBe(null);
    expect(formatAttributeLabel(undefined)).toBe(undefined);
    expect(formatAttributeLabel("")).toBe("");
  });

  it("strips [x] choice type indicator from paths", () => {
    expect(formatAttributeLabel("Observation.component[0].value[x]")).toBe(
      "Value"
    );
    expect(formatAttributeLabel("Observation.value[x]")).toBe("Value");
    expect(formatAttributeLabel("MedicationRequest.medication[x]")).toBe(
      "Medication"
    );
    expect(formatAttributeLabel("Claim.procedure[0].procedure[x]")).toBe(
      "Procedure"
    );
    expect(formatAttributeLabel("Patient.deceased[x]")).toBe("Deceased");
  });

  it("formats complex nested paths", () => {
    expect(formatAttributeLabel("Patient.contact.name.given")).toBe("Given");
    expect(formatAttributeLabel("ClaimResponse.addItem.noteNumber")).toBe(
      "Note Number"
    );
  });

  it("handlesBuildPrefixSet", () => {
    expect(buildPrefixSet([null])).toEqual(new Set([]));
  });

  it("handles buildSkip", () => {
    expect(shouldSkip("Patient.name[0].given", ["Patient"])).toBe(true);
    expect(shouldSkip("Patient.name[0].given", [null, "Patient"])).toBe(true);
  });
});

/**
 * ============================================================================
 * normalizeExtensionArray
 * ============================================================================
 *
 * BACKGROUND:
 * FHIR extensions are stored as arrays inside a resource (e.g., Patient.extension).
 * Each top-level extension (like us-core-race) can itself contain sub-extensions
 * (like ombCategory, detailed, text). The sub-extensions are also stored as an array.
 *
 * THE PROBLEM:
 * Formik uses array indices in field labels (e.g., "Patient.extension[0].extension[0]")
 * to bind form fields to values. If sub-extensions arrive in any order — or some are
 * missing — the labels would not match the correct slice. For example:
 *
 *   Input order:       [text, ombCategory]
 *   Expected order:    [ombCategory, detailed, text]   (based on elementDefinitions)
 *
 * Without normalization, Formik might show "text" data in the "ombCategory" field
 * because both are at index 0.
 *
 * THE SOLUTION:
 * normalizeExtensionArray re-orders the sub-extensions so that each one sits at its
 * "reserved index" — the position of its sliceName in the elementDefinitions array.
 *
 * EXAMPLE:
 *   elementDefinitions = [{ sliceName: "ombCategory" }, { sliceName: "detailed" }, { sliceName: "text" }]
 *   input extensions   = [{ url: "text", ... }, { url: "ombCategory", ... }]
 *
 *   After normalization:
 *     result[0] = { url: "ombCategory", ... }  // reserved index 0
 *     result[1] = undefined                      // "detailed" not present
 *     result[2] = { url: "text", ... }           // reserved index 2
 * ============================================================================
 */
describe("normalizeExtensionArray", () => {
  // Shared elementDefinitions representing the us-core-race extension slices
  const raceElementDefs: ElementDefinition[] = [
    {
      id: "Extension.extension:ombCategory",
      path: "Extension.extension",
      sliceName: "ombCategory",
    },
    {
      id: "Extension.extension:detailed",
      path: "Extension.extension",
      sliceName: "detailed",
    },
    {
      id: "Extension.extension:text",
      path: "Extension.extension",
      sliceName: "text",
    },
  ];

  it("returns the same array when extensions are already in the correct order", () => {
    // ombCategory at 0, detailed at 1, text at 2 — matches elementDefinitions
    const extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { url: "detailed", valueCoding: { code: "1023-1" } },
      { url: "text", valueString: "some text" },
    ];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result).toEqual(extensions);
  });

  it("reorders extensions that are out of order", () => {
    // text (should be at 2) is first, ombCategory (should be at 0) is second
    const extensions = [
      { url: "text", valueString: "some text" },
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
    ];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result[1]).toBeUndefined(); // "detailed" was not in the input
    expect(result[2]).toEqual({ url: "text", valueString: "some text" });
  });

  it("returns input unchanged when extensions is null", () => {
    expect(normalizeExtensionArray(null, raceElementDefs)).toBeNull();
  });

  it("returns input unchanged when extensions is undefined", () => {
    expect(normalizeExtensionArray(undefined, raceElementDefs)).toBeUndefined();
  });

  it("returns input unchanged when elementDefinitions is empty", () => {
    const extensions = [{ url: "text", valueString: "hello" }];
    expect(normalizeExtensionArray(extensions, [])).toEqual(extensions);
  });

  it("returns input unchanged when elementDefinitions is null", () => {
    const extensions = [{ url: "text", valueString: "hello" }];
    expect(normalizeExtensionArray(extensions, null)).toEqual(extensions);
  });

  it("skips null entries in the extensions array (sparse Formik arrays)", () => {
    // Formik sometimes creates sparse arrays with null/undefined holes
    const extensions = [
      null,
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      undefined,
    ];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result.length).toBe(1); // only ombCategory, no nulls
  });

  it("skips entries without a url property (incomplete form objects)", () => {
    // During form editing, Formik may create partial objects without a url
    const extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { valueCoding: { code: "incomplete" } }, // no url
      {}, // empty object, no url
    ];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result.length).toBe(1); // only ombCategory
  });

  it("places unrecognized extensions at the end of the array", () => {
    // An extension with a url not in elementDefinitions gets appended
    const extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { url: "unknownSlice", valueString: "mystery" },
    ];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    // unknownSlice is pushed to end (after the reserved indices 0,1,2)
    const lastElement = result[result.length - 1];
    expect(lastElement).toEqual({
      url: "unknownSlice",
      valueString: "mystery",
    });
  });

  it("handles only one extension present at a non-zero reserved index", () => {
    // Only "text" is present; its reserved index is 2
    const extensions = [{ url: "text", valueString: "just text" }];
    const result = normalizeExtensionArray(extensions, raceElementDefs);
    expect(result[0]).toBeUndefined();
    expect(result[1]).toBeUndefined();
    expect(result[2]).toEqual({ url: "text", valueString: "just text" });
  });

  it("handles elementDefinitions without sliceName (non-sliced elements)", () => {
    // If elementDefinitions have entries without sliceName, they are ignored
    const defsWithoutSlice: ElementDefinition[] = [
      { id: "Extension.url", path: "Extension.url" },
      { id: "Extension.id", path: "Extension.id" },
    ];
    const extensions = [{ url: "something", valueString: "val" }];
    const result = normalizeExtensionArray(extensions, defsWithoutSlice);
    // "something" has no reserved index → pushed to end
    expect(result).toEqual([{ url: "something", valueString: "val" }]);
  });

  it("handles empty extensions array", () => {
    const result = normalizeExtensionArray([], raceElementDefs);
    expect(result).toEqual([]);
  });
});

/**
 * ============================================================================
 * getEditableExtensionSubElements
 * ============================================================================
 *
 * BACKGROUND:
 * When viewing an extension in the test case builder (e.g., us-core-race), the
 * system fetches the extension's StructureDefinition (its "profile definition").
 * This profile describes all the sub-elements of the extension, including:
 *   - The base Extension element itself
 *   - Extension.url, Extension.id (structural elements)
 *   - Extension.extension:ombCategory (a sliced sub-extension)
 *   - Extension.extension:detailed (another sliced sub-extension)
 *   - Extension.extension:text (another sliced sub-extension)
 *
 * TWO KINDS OF EXTENSIONS:
 *
 * 1. Complex extensions (e.g., us-core-race):
 *    These have sliced sub-extensions with sliceNames like "ombCategory", "detailed", "text".
 *    The function returns only these sliced elements so the UI can render a form field for each.
 *
 *    Example profile snapshot:
 *      [
 *        { path: "Extension" },
 *        { path: "Extension.url" },
 *        { path: "Extension.extension", sliceName: "ombCategory" },  ← returned
 *        { path: "Extension.extension", sliceName: "detailed" },     ← returned
 *        { path: "Extension.extension", sliceName: "text" },         ← returned
 *      ]
 *
 * 2. Simple extensions (e.g., us-core-birthsex):
 *    These have NO sliced sub-extensions. Instead, they carry a direct value via
 *    a "value[x]" element (e.g., Extension.valueCode, Extension.valueString).
 *    When no sliceNames are found, the function falls back to returning the
 *    element whose path ends with "value[x]" so the user can set the value directly.
 *
 *    Example profile snapshot:
 *      [
 *        { path: "Extension" },
 *        { path: "Extension.url" },
 *        { path: "Extension.value[x]" },  ← returned (fallback)
 *      ]
 * ============================================================================
 */
describe("getEditableExtensionSubElements", () => {
  describe("complex extensions (with sliced sub-extensions)", () => {
    it("returns only elements that have a sliceName", () => {
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              {
                id: "Extension.extension:ombCategory",
                path: "Extension.extension",
                sliceName: "ombCategory",
              },
              {
                id: "Extension.extension:detailed",
                path: "Extension.extension",
                sliceName: "detailed",
              },
              {
                id: "Extension.extension:text",
                path: "Extension.extension",
                sliceName: "text",
              },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(3);
      expect(result[0].sliceName).toBe("ombCategory");
      expect(result[1].sliceName).toBe("detailed");
      expect(result[2].sliceName).toBe("text");
    });

    it("returns sliceName elements and ignores value[x] when both exist", () => {
      // A profile might have both sliced sub-extensions AND a value[x] element.
      // When slices exist, the slices take priority — value[x] is NOT returned.
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.id", path: "Extension.id" },
              { id: "Extension.extension", path: "Extension.extension" }, // no sliceName
              {
                id: "Extension.extension:mySlice",
                path: "Extension.extension",
                sliceName: "mySlice",
              },
              { id: "Extension.url", path: "Extension.url" },
              { id: "Extension.value[x]", path: "Extension.value[x]" },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(1);
      expect(result[0].sliceName).toBe("mySlice");
    });
  });

  describe("simple extensions (no sliced sub-extensions, fallback to value[x])", () => {
    it("returns the value[x] element when no sliceName elements exist", () => {
      // Simple extensions like us-core-birthsex have no sliced sub-extensions.
      // They carry their value directly in Extension.value[x] (e.g., valueCode).
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              {
                id: "Extension.value[x]",
                path: "Extension.value[x]",
                type: [{ code: "code" }],
              },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("Extension.value[x]");
      expect(result[0].type[0].code).toBe("code");
    });

    it("preserves binding information on the value[x] element", () => {
      // Extensions like us-core-birthsex have a binding on value[x].
      // ExtensionComponent relies on this binding info to render a value set selector.
      // The function must return the full element definition including its binding.
      //
      // Example JSON: { "url": "http://.../us-core-birthsex", "valueCode": "M" }
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              {
                id: "Extension.value[x]",
                path: "Extension.value[x]",
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
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(1);
      expect(result[0].binding).toEqual({
        strength: "required",
        valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
      });
    });

    it("returns value[x] for a string-type simple extension", () => {
      // A simple extension whose value is a string.
      // Example JSON: { "url": "http://.../some-ext", "valueString": "hello" }
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              {
                id: "Extension.value[x]",
                path: "Extension.value[x]",
                type: [{ code: "string" }],
              },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(1);
      expect(result[0].type[0].code).toBe("string");
    });

    it("returns value[x] for a boolean-type simple extension", () => {
      // A simple extension whose value is a boolean.
      // Example JSON: { "url": "http://.../some-ext", "valueBoolean": true }
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              {
                id: "Extension.value[x]",
                path: "Extension.value[x]",
                type: [{ code: "boolean" }],
              },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toHaveLength(1);
      expect(result[0].type[0].code).toBe("boolean");
    });

    it("returns empty array when no sliceName AND no value[x] elements exist", () => {
      // Edge case: profile has neither sliced sub-extensions nor value[x]
      // If there is no type information available in elementDefinition.type[0].code,
      // we do not support such extensions.
      const profileDef = {
        definition: {
          snapshot: {
            element: [
              { id: "Extension", path: "Extension" },
              { id: "Extension.url", path: "Extension.url" },
              { id: "Extension.id", path: "Extension.id" },
            ],
          },
        },
      };
      const result = getEditableExtensionSubElements(profileDef as any);
      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("returns empty array when profile has no snapshot", () => {
      expect(
        getEditableExtensionSubElements({ definition: {} } as any)
      ).toEqual([]);
    });

    it("returns empty array when profileDef is null", () => {
      expect(getEditableExtensionSubElements(null as any)).toEqual([]);
    });

    it("returns empty array when profileDef is undefined", () => {
      expect(getEditableExtensionSubElements(undefined as any)).toEqual([]);
    });

    it("returns empty array when snapshot has an empty element array", () => {
      const profileDef = {
        definition: {
          snapshot: {
            element: [],
          },
        },
      };
      expect(getEditableExtensionSubElements(profileDef as any)).toEqual([]);
    });
  });
});

describe("stripOutUnusedAttributes", () => {
  it("does not remove used attributes from elements", () => {
    const elements = [
      { id: "1", path: "Observation.value[x]", type: [{ code: "string" }] },
      { id: "2", path: "Observation.value[x]", type: [{ code: "boolean" }] },
      { id: "3", path: "Observation.value[x]", type: [{ code: "integer" }] },
    ];
    const resourceTree: StructureDefinitionDto = {
      definition: {
        snapshot: {
          element: elements,
        },
      },
    };
    const result = stripOutUnusedAttributes(resourceTree);
    expect(result.definition.snapshot.element).toHaveLength(3);
  });

  it("removes attributes that are not used in any element", () => {
    const elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [
          {
            code: "CodeableConcept",
          },
          {
            code: "SampledData",
          },
          {
            code: "time",
          },
        ],
      },
    ];
    const resourceTree: StructureDefinitionDto = {
      definition: {
        snapshot: {
          element: elements,
        },
      },
    };
    const result = stripOutUnusedAttributes(resourceTree);
    expect(result.definition.snapshot.element).toHaveLength(1);
    expect(result.definition.snapshot.element[0].type[0].code).toBe(
      "CodeableConcept"
    );
    expect(result.definition.snapshot.element[0].type[1].code).toBe("time");
  });

  it("should filter out unused attrinbute", () => {
    const elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [{ code: "SampledData" }],
      },
      {
        id: "Observation.implicitRules",
        path: "Observation.implicitRules",
        type: [{ code: "uri" }],
      },
      {
        id: "RequestGroup.action.condition.expression",
        path: "RequestGroup.action.condition.expression",
        type: [
          {
            code: "Expression",
          },
        ],
      },
    ];
    const result = stripOutUsedAttributesForElements(elements);
    expect(result).toHaveLength(1);
  });

  it("should not filter out used attrinbute", () => {
    const elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [{ code: "Integer" }],
      },
      {
        id: "Location.address",
        path: "Location.address",
        type: [{ code: "Address" }],
      },
      {
        id: "RequestGroup.action.condition.expression",
        path: "RequestGroup.action.condition.expression",

        type: [
          {
            code: "Expression",
          },
        ],
      },
    ];
    const result = stripOutUsedAttributesForElements(elements);
    expect(result).toHaveLength(1);
    expect(result[0].type[0].code).toBe("Integer");
  });

  it("stripOutUsedAttributesForElements filteredTypes 0", () => {
    const elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [{ code: "SampledData" }, { code: "SampledData" }],
      },
    ];
    const result = stripOutUsedAttributesForElements(elements);
    expect(result).toHaveLength(0); // All types filtered out, so element is removed
  });

  it("stripOutUsedAttributesForElements type length 0", () => {
    const elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [],
      },
    ];
    const result = stripOutUsedAttributesForElements(elements);
    expect(result).toHaveLength(1);
  });
});

describe("isMultiCardinalityElement", () => {
  it("should return true when element max is '*'", () => {
    const element = {
      id: "Patient.name",
      path: "Patient.name",
      max: "*",
      type: [{ code: "HumanName" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(true);
  });

  it("should return true when element max is greater than 1", () => {
    const element = {
      id: "Patient.identifier",
      path: "Patient.identifier",
      max: "5",
      type: [{ code: "Identifier" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(true);
  });

  it("should return false when element max is '1' and base max is '1'", () => {
    const element = {
      id: "Patient.gender",
      path: "Patient.gender",
      max: "1",
      base: { path: "Patient.gender", min: 0, max: "1" },
      type: [{ code: "code" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(false);
  });

  it("should return true when base max is '*' even if element max is '1'", () => {
    const element = {
      id: "Patient.name",
      path: "Patient.name",
      max: "1",
      base: { path: "Patient.name", min: 0, max: "*" },
      type: [{ code: "HumanName" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(true);
  });

  it("should return false when element max is '0'", () => {
    const element = {
      id: "Patient.deceased[x]",
      path: "Patient.deceased[x]",
      max: "0",
      base: { path: "Patient.deceased[x]", min: 0, max: "1" },
      type: [{ code: "boolean" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(false);
  });

  it("should return false when element max is undefined and base max is '1'", () => {
    const element = {
      id: "Patient.active",
      path: "Patient.active",
      base: { path: "Patient.active", min: 0, max: "1" },
      type: [{ code: "boolean" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBeFalsy();
  });

  it("should return false when both max and base are undefined", () => {
    const element = {
      id: "Patient.active",
      path: "Patient.active",
      type: [{ code: "boolean" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBeFalsy();
  });

  it("should return true when element max is '2'", () => {
    const element = {
      id: "Patient.contact",
      path: "Patient.contact",
      max: "2",
      base: { path: "Patient.contact", min: 0, max: "2" },
      type: [{ code: "BackboneElement" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(true);
  });

  it("should return false when element max is '1' and base is undefined", () => {
    const element = {
      id: "Patient.birthDate",
      path: "Patient.birthDate",
      max: "1",
      type: [{ code: "date" }],
    } as ElementDefinition;
    expect(isMultiCardinalityElement(element)).toBe(false);
  });
});
