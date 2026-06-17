"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Yup = require("yup");
var _ = require("lodash");
var fhirDefinitionServiceUtilities_1 = require("./fhirDefinitionServiceUtilities");
describe("FhirDefinitionServiceUtilities", function () {
  var mockResource = {
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
  describe("getBasePath", function () {
    it("should return the base path from the first element", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getBasePath)(
        mockResource
      );
      expect(result).toBe("Patient");
    });
    it("Should remove indices from path", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.removeIndicesFromPath)(
        "Patient.name[0]"
      );
      expect(result).toBe("Patient.name");
    });
    it("should return undefined if no elements are present", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getBasePath)({});
      expect(result).toBeUndefined();
    });
  });
  describe("getTopLevelElements", function () {
    it("should return elements with a path length of 2", function () {
      var mutableResource = _.cloneDeep(mockResource);
      mutableResource.definition.snapshot.element.push({
        path: "Patient.multipleBirth[x]",
        min: 1,
        type: [{ code: "boolean" }, { code: "integer" }],
      });
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        mutableResource
      );
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
    it("should filter out non-extension sliced elements", function () {
      var resourceWithSlices = _.cloneDeep(mockResource);
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
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        resourceWithSlices
      );
      // Non-extension slices should be filtered out
      expect(
        result.find(function (el) {
          return el.id === "Condition.category:us-core";
        })
      ).toBeUndefined();
      expect(
        result.find(function (el) {
          return el.id === "Observation.code:laboratory";
        })
      ).toBeUndefined();
      // Extension slices should remain
      expect(
        result.find(function (el) {
          return el.id === "Patient.extension:race";
        })
      ).toBeDefined();
      expect(
        result.find(function (el) {
          return el.id === "Patient.id";
        })
      ).toBeUndefined();
    });
    it("should keep extension slices but filter non-extension slices", function () {
      var resourceWithMixedSlices = _.cloneDeep(mockResource);
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
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        resourceWithMixedSlices
      );
      // Extension slices should be kept
      expect(
        result.find(function (el) {
          return el.id === "Patient.extension:race";
        })
      ).toBeDefined();
      expect(
        result.find(function (el) {
          return el.id === "Patient.extension:ethnicity";
        })
      ).toBeDefined();
      // Non-extension slice should be filtered out
      expect(
        result.find(function (el) {
          return el.id === "Condition.category:encounter-diagnosis";
        })
      ).toBeUndefined();
    });
    it("should handle elements without colons normally", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        mockResource
      );
      // Regular elements without colons should be present
      expect(
        result.find(function (el) {
          return el.path === "Patient.name";
        })
      ).toBeDefined();
      expect(
        result.find(function (el) {
          return el.path === "Patient.age";
        })
      ).toBeDefined();
    });
    it("should filter out generic extension elements without sliceName", function () {
      var resourceWithGenericExtension = _.cloneDeep(mockResource);
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
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        resourceWithGenericExtension
      );
      // Generic extensions without sliceName should be filtered out
      expect(
        result.find(function (el) {
          return el.id === "ClaimResponse.extension";
        })
      ).toBeUndefined();
      expect(
        result.find(function (el) {
          return el.id === "Condition.extension";
        })
      ).toBeUndefined();
      // Sliced extensions should remain
      expect(
        result.find(function (el) {
          return el.id === "Patient.extension:race";
        })
      ).toBeDefined();
      expect(
        result.find(function (el) {
          return el.id === "Patient.extension:ethnicity";
        })
      ).toBeDefined();
    });
    it("should filter out attributes or extensions that are of type 'Age'", function () {
      var testResource = {
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
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        testResource
      );
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
    it("should filter out attribute of AllergyIntolerance.extension:resolutionAge", function () {
      var testResource = {
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
      var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
        testResource
      );
      expect(result).toEqual([]);
    });
  });
  describe("getRequiredElements", function () {
    it("should return elements with min > 0 and path length of 2", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getRequiredElements)(
        mockResource
      );
      expect(result).toEqual([
        { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
      ]);
    });
  });
  describe("stripResourcePath", function () {
    it("should strip the resource path from the element path", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.stripResourcePath)(
        "Patient",
        "Patient.name"
      );
      expect(result).toBe("name");
    });
    it("should return the original path if the resource path is not included", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.stripResourcePath)(
        "Doctor",
        "Patient.name"
      );
      expect(result).toBe(".name");
    });
  });
  describe("getAllChildren", function () {
    it("should return all child elements of a given path", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getAllChildren)(
        mockResource,
        "Patient"
      );
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
    it("should return an empty array if no children are found", function () {
      var result = (0, fhirDefinitionServiceUtilities_1.getAllChildren)(
        mockResource,
        "Doctor"
      );
      expect(result).toEqual([]);
    });
  });
  describe("updateChildrenPaths", function () {
    it("should update child element paths based on the structureDefinition id", function () {
      var structureDefinition = { id: "Procedure" };
      var elements = [{ id: "Annotation.text", path: "Annotation.text" }];
      var result = (0, fhirDefinitionServiceUtilities_1.updateChildrenPaths)(
        structureDefinition,
        elements
      );
      expect(result).toEqual([
        { id: "Procedure.text", path: "Procedure.text" },
      ]);
    });
  });
  describe("isComponentDataType", function () {
    it("should return true for valid data types", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.isComponentDataType)("boolean")
      ).toBe(true);
      expect(
        (0, fhirDefinitionServiceUtilities_1.isComponentDataType)("date")
      ).toBe(true);
      expect(
        (0, fhirDefinitionServiceUtilities_1.isComponentDataType)("Extension")
      ).toBe(true);
    });
    it("should return false for invalid data types", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.isComponentDataType)("customType")
      ).toBe(false);
      expect(
        (0, fhirDefinitionServiceUtilities_1.isComponentDataType)("unknown")
      ).toBe(false);
    });
  });
  describe("setNestedValue", function () {
    it("should set a nested value", function () {
      var obj = {};
      (0, fhirDefinitionServiceUtilities_1.setNestedValue)(obj, "a.b.c", 42);
      expect(obj).toEqual({ a: { b: { c: 42 } } });
    });
    it("should override", function () {
      var obj = { a: { b: { c: 10 } } };
      (0, fhirDefinitionServiceUtilities_1.setNestedValue)(obj, "a.b.c", 99);
      expect(obj.a.b.c).toBe(99);
    });
    it("should create nested structure when missing", function () {
      var obj = {};
      (0, fhirDefinitionServiceUtilities_1.setNestedValue)(
        obj,
        "x.y.z",
        "test"
      );
      expect(obj).toEqual({ x: { y: { z: "test" } } });
    });
  });
  describe("removeUndefinedProperties", function () {
    it("should remove undefined values from an object", function () {
      var obj = { a: 1, b: undefined, c: 3 };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ a: 1, c: 3 });
    });
    it("should keep nested objects with values", function () {
      var obj = { a: { b: { c: 5 } }, d: 4 };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        a: { b: { c: 5 } },
        d: 4,
      });
    });
    it("should return the same value if not an object", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(null)
      ).toBe(null);
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(12)
      ).toBe(12);
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)("test")
      ).toBe("test");
    });
    it("should return array by removing undefined values", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)([
          "2024",
          "",
          undefined,
          null,
          "08/09/2025",
        ])
      ).toEqual(["2024", "", null, "08/09/2025"]);
    });
    it("should remove null values from an object", function () {
      var obj = { a: 1, b: null, c: 3 };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ a: 1, c: 3 });
    });
    it("should remove empty objects from nested structures", function () {
      var obj = { a: 1, b: {}, c: 3 };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ a: 1, c: 3 });
    });
    it("should remove deeply nested undefined values", function () {
      var obj = {
        a: {
          b: {
            c: undefined,
            d: null,
          },
        },
        e: 5,
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ e: 5 });
    });
    it("should preserve the 'x' key when present", function () {
      var obj = { a: 1, x: undefined, b: 2 };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        a: 1,
        x: undefined,
        b: 2,
      });
    });
    it("should handle extension arrays with valid url properties", function () {
      var obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });
    it("should filter out extension objects without url property", function () {
      var obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { valueString: "no url" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });
    it("should filter out null and undefined values from extension arrays", function () {
      var obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          null,
          undefined,
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });
    it("should filter out empty strings from extension arrays", function () {
      var obj = {
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          "",
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        extension: [
          { url: "http://example.com/ext1", valueString: "test" },
          { url: "http://example.com/ext2", valueBoolean: true },
        ],
      });
    });
    it("should delete extension key when all extensions are filtered out", function () {
      var obj = {
        name: "test",
        extension: [{ valueString: "no url" }, null, undefined, ""],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ name: "test" });
    });
    it("should delete extension key when array becomes empty after filtering", function () {
      var obj = {
        name: "test",
        extension: [],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ name: "test" });
    });
    it("should recursively clean nested objects within extension arrays", function () {
      var obj = {
        extension: [
          {
            url: "http://example.com/ext1",
            valueString: "test",
            nested: { a: 1, b: undefined },
          },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        extension: [
          {
            url: "http://example.com/ext1",
            valueString: "test",
            nested: { a: 1 },
          },
        ],
      });
    });
    it("should handle arrays of objects with undefined properties", function () {
      var obj = {
        items: [
          { id: 1, name: "test", value: undefined },
          { id: 2, name: "test2", value: "valid" },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        items: [
          { id: 1, name: "test" },
          { id: 2, name: "test2", value: "valid" },
        ],
      });
    });
    it("should handle nested arrays within objects", function () {
      var obj = {
        data: {
          values: [1, undefined, 2, null, 3],
        },
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        data: {
          values: [1, 2, null, 3],
        },
      });
    });
    it("should handle complex nested structures", function () {
      var obj = {
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
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
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
    it("should handle objects where all properties become empty", function () {
      var obj = {
        wrapper: {
          a: undefined,
          b: null,
          c: {},
        },
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({});
    });
    it("should preserve false and 0 values", function () {
      var obj = { a: 0, b: false, c: "", d: undefined };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ a: 0, b: false, c: "" });
    });
    it("should handle arrays with nested objects containing empty values", function () {
      var obj = {
        data: [
          { id: 1, meta: { a: undefined } },
          { id: 2, meta: { b: "value" } },
        ],
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        data: [{ id: 1 }, { id: 2, meta: { b: "value" } }],
      });
    });
    it("should handle extension arrays within nested objects", function () {
      var obj = {
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
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({
        patient: {
          extension: [{ url: "http://example.com/ext", valueString: "test" }],
        },
      });
    });
    it("should handle hasOwnProperty check correctly", function () {
      var obj = Object.create({ inherited: "value" });
      obj.own = "test";
      obj.empty = undefined;
      expect(
        (0, fhirDefinitionServiceUtilities_1.removeUndefinedProperties)(obj)
      ).toEqual({ own: "test" });
    });
  });
});
describe("getElementName", function () {
  it("returns the choiceType if exists", function () {
    var element = {
      id: "some.path[x]",
      min: 0,
      max: "1",
      path: "some.path[x]",
      type: [{ code: "boolean" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(element, "some", [])
    ).toBe("pathBoolean");
  });
  it("returns the slice if exists", function () {
    var element = {
      id: "some.path",
      min: 0,
      path: "some.path",
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(element, "some", [])
    ).toBe("Path");
  });
  it("should handles not a number index", function () {
    var element = {
      id: "Patient.name[asdf]",
      min: 1,
    };
    var basePath = "Patient";
    var result = (0, fhirDefinitionServiceUtilities_1.getElementName)(
      element,
      basePath,
      [{}, {}]
    );
    expect(result).toBe(" *Name Asdf");
  });
  it("should handle retrievedIndex and Number(retrievedIndex) > 0 to add correct index", function () {
    var element = {
      id: "Patient.name[1]",
      min: 1,
    };
    var basePath = "Patient";
    var result = (0, fhirDefinitionServiceUtilities_1.getElementName)(
      element,
      basePath,
      [{}, {}]
    );
    expect(result).toBe(" *Name 2 ");
  });
  it("should format for ChoiceType elements correctly", function () {
    var element = {
      id: "Patient.effective[x]",
      path: "Patient.effective[x]",
      min: 0,
      max: 1,
      type: [{ code: "dateTime" }],
    };
    var basePath = "Patient";
    var result = (0, fhirDefinitionServiceUtilities_1.formatChoiceType)(
      element,
      basePath
    );
    expect(result).toBe("effectiveDateTime");
  });
  it("handles index 0 correctly", function () {
    var element = {
      id: "Patient.name[0]",
      min: 0,
    };
    var basePath = "Patient";
    var result = (0, fhirDefinitionServiceUtilities_1.getElementName)(
      element,
      basePath,
      [{}, {}]
    );
    expect(result).toBe("Name 1 ");
  });
  it("returns path minus base", function () {
    var element = { id: "some.path", min: 0, path: "some.path" };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(element, "some", [])
    ).toBe("Path");
  });
  it("Should add required indicator when the attribute is required", function () {
    var element = { id: "some.path", min: 1, path: "some.path" };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(
        element,
        "some",
        null
      )
    ).toBe(" *Path");
  });
  it("adds required indicator", function () {
    var element = {
      id: "some.path",
      min: 1,
      path: "some.path",
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(element, "some", {})
    ).toBe(" *Path");
  });
  it("returns sliceName with index and requiredIndicator if sliceName exists", function () {
    var element = {
      id: "Patient.name[0].given",
      path: "Patient.name.given",
      min: 1,
      sliceName: "someothergivenname",
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(
        element,
        "Patient",
        []
      )
    ).toBe(" *Given (Someothergivenname)");
  });
  it("returns path without basePath and indexes if no sliceName", function () {
    var element = { id: "Patient.name[0].family", min: 0 };
    var nameFamily = (0, fhirDefinitionServiceUtilities_1.getElementName)(
      element,
      "Patient",
      []
    );
    expect(nameFamily).toBe("Family");
  });
  it("handles no index correctly", function () {
    var element = { id: "Patient.birthDate", min: 0 };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(
        element,
        "Patient",
        []
      )
    ).toBe("Birth Date");
  });
  it("adds required indicator if min > 0", function () {
    var element = { id: "Patient.gender", min: 1 };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getElementName)(
        element,
        "Patient",
        []
      )
    ).toBe(" *Gender");
  });
});
describe("getChildren", function () {
  it("returns immediate children under parentPath", function () {
    var formInfo = {
      "Patient.name": {},
      "Patient.name.given": {},
      "Patient.name.family": {},
      "Patient.address": {},
    };
    var result = (0, fhirDefinitionServiceUtilities_1.getChildren)(
      formInfo,
      "Patient.name"
    );
    expect(
      result.map(function (_a) {
        var key = _a[0];
        return key;
      })
    ).toEqual(["Patient.name.given", "Patient.name.family"]);
  });
  it("returns empty array if no children", function () {
    var formInfo = { "Patient.address": {} };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getChildren)(
        formInfo,
        "Patient.name"
      )
    ).toEqual([]);
  });
});
describe("buildFullValidationSchema", function () {
  it("should build validation schema including primitive validations and arrays", function () {
    var formInfo = {
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
    var schema = (0,
    fhirDefinitionServiceUtilities_1.buildFullValidationSchema)(formInfo);
    expect(schema).toBeInstanceOf(Yup.ObjectSchema);
    var validData = {
      Patient: {
        birthDate: "2000-01-01",
        name: [
          { given: "bolwin", family: "pw" },
          { given: "theo", family: "smith" },
        ],
      },
    };
    expect(function () {
      return schema.validateSync(validData);
    }).not.toThrow();
    var invalidData = {
      Patient: {
        name: [{ family: "invalid" }],
        birthDate: "",
      },
    };
    try {
      schema.validateSync(invalidData, { abortEarly: false });
    } catch (e) {
      expect(
        e.inner.map(function (err) {
          return err.path;
        })
      ).toEqual(["Patient.name[0].given", "Patient.birthDate"]);
    }
  });
});
describe("getParentDefinition", function () {
  it("finds the parent definition", function () {
    var formInfo = [
      ["Patient.name", { label: "Name" }],
      ["Patient.name.given", { label: "Given" }],
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.getParentDefinition)(
      "Patient.name.given",
      formInfo
    );
    expect(result).toEqual({ label: "Name" });
  });
  it("returns undefined if no parent found", function () {
    var formInfo = [["Patient.name", { label: "Name" }]];
    expect(
      (0, fhirDefinitionServiceUtilities_1.getParentDefinition)(
        "Patient.gender",
        formInfo
      )
    ).toBeUndefined();
  });
  it("returns undefined if root node", function () {
    var formInfo = [["Patient", { label: "Patient" }]];
    expect(
      (0, fhirDefinitionServiceUtilities_1.getParentDefinition)(
        "Patient",
        formInfo
      )
    ).toBeUndefined();
  });
});
describe("getFirstChildren", function () {
  it("returns first children correctly", function () {
    var formInfo = [
      ["Patient.name", {}],
      ["Patient.name.given", {}],
      ["Patient.name.given.family", {}],
      ["Patient.gender", {}],
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.getFirstChildren)(
      "Patient.name",
      formInfo
    );
    expect(result.length).toBe(1);
  });
  it("should exclude elements ending with '.id'", function () {
    var formInfo = [
      ["Patient.name", { id: "Patient.name" }],
      ["Patient.name.given", { id: "Patient.name.given" }],
      ["Patient.name.family", { id: "Patient.name.family" }],
      ["Patient.name.id", { id: "Patient.name.id" }],
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.getFirstChildren)(
      "Patient.name",
      formInfo
    );
    expect(result).toEqual([
      { id: "Patient.name.given" },
      { id: "Patient.name.family" },
    ]);
  });
  it("returns empty array if no children", function () {
    var formInfo = [["Patient.gender", {}]];
    expect(
      (0, fhirDefinitionServiceUtilities_1.getFirstChildren)(
        "Patient.name",
        formInfo
      )
    ).toEqual([]);
  });
});
describe("stripArrayIndices", function () {
  it("removes array indices from path", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.stripArrayIndices)(
        "Patient.name[0].given[1]"
      )
    ).toBe("Patient.name.given");
  });
  it("returns path unchanged if no indices", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.stripArrayIndices)("Patient.gender")
    ).toBe("Patient.gender");
  });
});
describe("removeLastPathSegment", function () {
  it("removes last segment from path", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.removeLastPathSegment)(
        "Patient.name.given"
      )
    ).toBe("Patient.name");
  });
  it("returns empty string if single segment", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.removeLastPathSegment)("Patient")
    ).toBe("");
  });
});
describe("getValueByPath", function () {
  it("retrieves nested value", function () {
    var obj = { Patient: { name: { given: "john" } } };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getValueByPath)(
        obj,
        "Patient.name.given"
      )
    ).toBe("john");
  });
  it("returns undefined if path does not exist", function () {
    var obj = { Patient: { name: {} } };
    expect(
      (0, fhirDefinitionServiceUtilities_1.getValueByPath)(
        obj,
        "Patient.address.street"
      )
    ).toBeUndefined();
  });
});
describe("mapElementsByPath", function () {
  it("maps elements by their path", function () {
    var structureDefinition = {
      definition: {
        snapshot: {
          element: [{ path: "Patient.name" }, { path: "Patient.name.given" }],
        },
      },
    };
    var result = (0, fhirDefinitionServiceUtilities_1.mapElementsByPath)(
      structureDefinition
    );
    expect(result["Patient.name"]).toEqual({ path: "Patient.name" });
    expect(result["Patient.name.given"]).toEqual({
      path: "Patient.name.given",
    });
  });
  it("returns empty object if no elements", function () {
    expect((0, fhirDefinitionServiceUtilities_1.mapElementsByPath)({})).toEqual(
      {}
    );
  });
});
describe("getIndexFromPath", function () {
  it("returns the index from path", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.getIndexFromPath)("Patient.name[2]")
    ).toBe("[2]");
  });
  it("returns null if no index", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.getIndexFromPath)("Patient.gender")
    ).toBeNull();
  });
});
describe("mergePathWithIndex", function () {
  it("merges paths correctly with existing index", function () {
    var pathWithIndex = "Patient.name[1]";
    var pathWithoutIndex = "Patient.name.given";
    expect(
      (0, fhirDefinitionServiceUtilities_1.mergePathWithIndex)(
        pathWithIndex,
        pathWithoutIndex
      )
    ).toBe("Patient.name[1].given");
  });
  it("merges paths correctly when base differs", function () {
    var pathWithIndex = "Patient.address[0]";
    var pathWithoutIndex = "Patient.contact.name";
    expect(
      (0, fhirDefinitionServiceUtilities_1.mergePathWithIndex)(
        pathWithIndex,
        pathWithoutIndex
      )
    ).toBe("Patient.address[0].Patient.contact.name");
  });
  it("fallbacks to joining paths if no index", function () {
    var pathWithIndex = "Patient.name";
    var pathWithoutIndex = "Patient.name.given";
    expect(
      (0, fhirDefinitionServiceUtilities_1.mergePathWithIndex)(
        pathWithIndex,
        pathWithoutIndex
      )
    ).toBe("Patient.name.Patient.name.given");
  });
});
describe("buildFullValidationSchema", function () {
  it("handles array of objects with children", function () {
    var formInfo = {
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
    var schema = (0,
    fhirDefinitionServiceUtilities_1.buildFullValidationSchema)(
      formInfo,
      "Patient"
    );
    expect(function () {
      return schema.validateSync(
        {
          Patient: {
            address: [{ line: "", city: "" }],
          },
        },
        { abortEarly: false }
      );
    }).toThrowError(
      expect.objectContaining({
        name: "ValidationError",
        inner: expect.arrayContaining([
          expect.objectContaining({ path: "Patient.address[0].city" }),
        ]),
      })
    );
  });
});
describe("recursiveAddYupObject", function () {
  it("wraps all nested objects with with shape, and skips objects that are already schemas", function () {
    var schemaObject = {
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
    var result = (0, fhirDefinitionServiceUtilities_1.recursiveAddYupObject)(
      schemaObject
    );
    expect(Yup.object().isType(result.patient)).toBe(true);
    expect(Yup.object().isType(result.meta)).toBe(true);
    expect(result.flag).toBe(true);
    var patientSchema = result.patient;
    expect(Yup.object().isType(patientSchema.fields.name)).toBe(true);
    expect(patientSchema.fields.age).toBeInstanceOf(Yup.NumberSchema);
  });
  it("returns the original object mutated", function () {
    var input = {
      group: {
        a: Yup.string(),
        b: Yup.number(),
      },
    };
    var yupObj = (0, fhirDefinitionServiceUtilities_1.recursiveAddYupObject)(
      input
    );
    expect(yupObj).toBe(input);
    expect(Yup.object().isType(yupObj.group)).toBe(true);
  });
});
describe("addCardinalityToElement", function () {
  var mockRootElement = {
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
  it("should add a new element when the path is missing", function () {
    var nextEntry = { resource: {} };
    var elemPath = "name";
    var result = (0, fhirDefinitionServiceUtilities_1.addCardinalityToElement)(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });
  it("should wrap a non-array element in an array and add a new element", function () {
    var nextEntry = { resource: { name: { given: "John" } } };
    var elemPath = "name";
    var result = (0, fhirDefinitionServiceUtilities_1.addCardinalityToElement)(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, ""]);
  });
  it("should append a el to existing array", function () {
    var nextEntry = { resource: { name: [{ given: "John" }] } };
    var elemPath = "name";
    var result = (0, fhirDefinitionServiceUtilities_1.addCardinalityToElement)(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, ""]);
  });
  it("should handle by converting to array", function () {
    var nextEntry = { resource: { name: {} } };
    var elemPath = "name";
    var result = (0, fhirDefinitionServiceUtilities_1.addCardinalityToElement)(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });
  it("should handle undefined paths by converting to array", function () {
    var nextEntry = { resource: { name: undefined } };
    var elemPath = "name";
    var result = (0, fhirDefinitionServiceUtilities_1.addCardinalityToElement)(
      nextEntry,
      elemPath,
      mockRootElement
    );
    expect(result.resource[elemPath]).toEqual([{}, ""]);
  });
  it("should return an empty array if no elements match the criteria", function () {
    var resource = {
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
    var result = (0, fhirDefinitionServiceUtilities_1.getTopLevelElements)(
      resource
    );
    expect(result).toEqual([
      { id: "Patient.name", max: "1", path: "Patient.name" },
    ]);
  });
  it("Should handle modifySliceNameForReadability all cases", function () {
    var r1 = (0,
    fhirDefinitionServiceUtilities_1.modifySliceNameForReadability)(
      "cardiology"
    );
    expect(r1).toBe("Cardiology");
    var r2 = (0,
    fhirDefinitionServiceUtilities_1.modifySliceNameForReadability)(
      "mental-health"
    );
    expect(r2).toBe("Mental Health");
    var r3 = (0,
    fhirDefinitionServiceUtilities_1.modifySliceNameForReadability)("us-core");
    expect(r3).toBe("US Core");
    var r4 = (0,
    fhirDefinitionServiceUtilities_1.modifySliceNameForReadability)(
      "us-vital-signs"
    );
    expect(r4).toBe("US Vital Signs");
    var r5 = (0,
    fhirDefinitionServiceUtilities_1.modifySliceNameForReadability)(
      "us-core-pediatric-growth"
    );
    expect(r5).toBe("US Core Pediatric Growth");
  });
});
describe("extractNameWithoutIndex", function () {
  var element = {
    id: "Patient.extension[x]",
  };
  it("should extract the name without index", function () {
    var result = (0, fhirDefinitionServiceUtilities_1.extractNameWithoutIndex)(
      element
    );
    expect(result).toBe("Patient.extension");
  });
  it("should handle empty id", function () {
    var emptyElement = { id: "" };
    var result = (0, fhirDefinitionServiceUtilities_1.extractNameWithoutIndex)(
      emptyElement
    );
    expect(result).toBe("");
  });
});
describe("filterUnusedExtensionsFromElements", function () {
  var allDisplayedElements = [
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
  it("should filter out unused extensions", function () {
    var selectedResource = {
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
    var result = (0,
    fhirDefinitionServiceUtilities_1.filterUnusedExtensionsFromElements)(
      selectedResource,
      allDisplayedElements
    );
    expect(result.length).toBe(1);
  });
});
describe("getParentPath", function () {
  it("returns parent path for deeply nested path", function () {
    var result = (0, fhirDefinitionServiceUtilities_1.getParentPath)(
      "Patient.name.given.text"
    );
    expect(result).toBe("Patient.name.given");
  });
  it("returns parent path for two-level path", function () {
    var result = (0, fhirDefinitionServiceUtilities_1.getParentPath)(
      "Patient.name"
    );
    expect(result).toBe("Patient");
  });
  it("returns null for single-level path", function () {
    var result = (0, fhirDefinitionServiceUtilities_1.getParentPath)("Patient");
    expect(result).toBeNull();
  });
  it("returns null for null or undefined input", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.getParentPath)(null)
    ).toBeNull();
    expect(
      (0, fhirDefinitionServiceUtilities_1.getParentPath)(undefined)
    ).toBeNull();
  });
});
describe("formatAttributeLabel", function () {
  it("formats paths ending with array indices", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "ClaimResponse.item[0]"
      )
    ).toBe("Item[0]");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.name[1]"
      )
    ).toBe("Name[1]");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Claim.item[2]"
      )
    ).toBe("Item[2]");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "ClaimResponse.itemSequence[0]"
      )
    ).toBe("Item Sequence[0]");
  });
  it("formats final attribute even when array indices exist earlier in path", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "ClaimResponse.item[0].itemSequence"
      )
    ).toBe("Item Sequence");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.name[1].family"
      )
    ).toBe("Family");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Claim.item[0].careTeamSequence"
      )
    ).toBe("Care Team Sequence");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.photo[0].data"
      )
    ).toBe("Data");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.photo[1].hash"
      )
    ).toBe("Hash");
  });
  it("formats simple attribute paths to Title Case", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.name.family"
      )
    ).toBe("Family");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Encounter.period.start"
      )
    ).toBe("Start");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Observation.status"
      )
    ).toBe("Status");
  });
  it("formats camelCase choice types to Title Case", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Claim.procedure.procedureCodeableConcept"
      )
    ).toBe("Procedure Codeable Concept");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Observation.valueQuantity"
      )
    ).toBe("Value Quantity");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "MedicationRequest.medicationCodeableConcept"
      )
    ).toBe("Medication Codeable Concept");
  });
  it("handles single-segment paths", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)("Patient")
    ).toBe("Patient");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)("itemSequence")
    ).toBe("Item Sequence");
  });
  it("handles null and undefined inputs", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(null)
    ).toBe(null);
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(undefined)
    ).toBe(undefined);
    expect((0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)("")).toBe(
      ""
    );
  });
  it("strips [x] choice type indicator from paths", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Observation.component[0].value[x]"
      )
    ).toBe("Value");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Observation.value[x]"
      )
    ).toBe("Value");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "MedicationRequest.medication[x]"
      )
    ).toBe("Medication");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Claim.procedure[0].procedure[x]"
      )
    ).toBe("Procedure");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.deceased[x]"
      )
    ).toBe("Deceased");
  });
  it("formats complex nested paths", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "Patient.contact.name.given"
      )
    ).toBe("Given");
    expect(
      (0, fhirDefinitionServiceUtilities_1.formatAttributeLabel)(
        "ClaimResponse.addItem.noteNumber"
      )
    ).toBe("Note Number");
  });
  it("handlesBuildPrefixSet", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.buildPrefixSet)([null])
    ).toEqual(new Set([]));
  });
  it("handles buildSkip", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.shouldSkip)(
        "Patient.name[0].given",
        ["Patient"]
      )
    ).toBe(true);
    expect(
      (0, fhirDefinitionServiceUtilities_1.shouldSkip)(
        "Patient.name[0].given",
        [null, "Patient"]
      )
    ).toBe(true);
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
describe("normalizeExtensionArray", function () {
  // Shared elementDefinitions representing the us-core-race extension slices
  var raceElementDefs = [
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
  it("returns the same array when extensions are already in the correct order", function () {
    // ombCategory at 0, detailed at 1, text at 2 — matches elementDefinitions
    var extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { url: "detailed", valueCoding: { code: "1023-1" } },
      { url: "text", valueString: "some text" },
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result).toEqual(extensions);
  });
  it("reorders extensions that are out of order", function () {
    // text (should be at 2) is first, ombCategory (should be at 0) is second
    var extensions = [
      { url: "text", valueString: "some text" },
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result[1]).toBeUndefined(); // "detailed" was not in the input
    expect(result[2]).toEqual({ url: "text", valueString: "some text" });
  });
  it("returns input unchanged when extensions is null", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
        null,
        raceElementDefs
      )
    ).toBeNull();
  });
  it("returns input unchanged when extensions is undefined", function () {
    expect(
      (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
        undefined,
        raceElementDefs
      )
    ).toBeUndefined();
  });
  it("returns input unchanged when elementDefinitions is empty", function () {
    var extensions = [{ url: "text", valueString: "hello" }];
    expect(
      (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
        extensions,
        []
      )
    ).toEqual(extensions);
  });
  it("returns input unchanged when elementDefinitions is null", function () {
    var extensions = [{ url: "text", valueString: "hello" }];
    expect(
      (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
        extensions,
        null
      )
    ).toEqual(extensions);
  });
  it("skips null entries in the extensions array (sparse Formik arrays)", function () {
    // Formik sometimes creates sparse arrays with null/undefined holes
    var extensions = [
      null,
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      undefined,
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result.length).toBe(1); // only ombCategory, no nulls
  });
  it("skips entries without a url property (incomplete form objects)", function () {
    // During form editing, Formik may create partial objects without a url
    var extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { valueCoding: { code: "incomplete" } }, // no url
      {}, // empty object, no url
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    expect(result.length).toBe(1); // only ombCategory
  });
  it("places unrecognized extensions at the end of the array", function () {
    // An extension with a url not in elementDefinitions gets appended
    var extensions = [
      { url: "ombCategory", valueCoding: { code: "ASKU" } },
      { url: "unknownSlice", valueString: "mystery" },
    ];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result[0]).toEqual({
      url: "ombCategory",
      valueCoding: { code: "ASKU" },
    });
    // unknownSlice is pushed to end (after the reserved indices 0,1,2)
    var lastElement = result[result.length - 1];
    expect(lastElement).toEqual({
      url: "unknownSlice",
      valueString: "mystery",
    });
  });
  it("handles only one extension present at a non-zero reserved index", function () {
    // Only "text" is present; its reserved index is 2
    var extensions = [{ url: "text", valueString: "just text" }];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      raceElementDefs
    );
    expect(result[0]).toBeUndefined();
    expect(result[1]).toBeUndefined();
    expect(result[2]).toEqual({ url: "text", valueString: "just text" });
  });
  it("handles elementDefinitions without sliceName (non-sliced elements)", function () {
    // If elementDefinitions have entries without sliceName, they are ignored
    var defsWithoutSlice = [
      { id: "Extension.url", path: "Extension.url" },
      { id: "Extension.id", path: "Extension.id" },
    ];
    var extensions = [{ url: "something", valueString: "val" }];
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      extensions,
      defsWithoutSlice
    );
    // "something" has no reserved index → pushed to end
    expect(result).toEqual([{ url: "something", valueString: "val" }]);
  });
  it("handles empty extensions array", function () {
    var result = (0, fhirDefinitionServiceUtilities_1.normalizeExtensionArray)(
      [],
      raceElementDefs
    );
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
describe("getEditableExtensionSubElements", function () {
  describe("complex extensions (with sliced sub-extensions)", function () {
    it("returns only elements that have a sliceName", function () {
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(3);
      expect(result[0].sliceName).toBe("ombCategory");
      expect(result[1].sliceName).toBe("detailed");
      expect(result[2].sliceName).toBe("text");
    });
    it("returns sliceName elements and ignores value[x] when both exist", function () {
      // A profile might have both sliced sub-extensions AND a value[x] element.
      // When slices exist, the slices take priority — value[x] is NOT returned.
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(1);
      expect(result[0].sliceName).toBe("mySlice");
    });
  });
  describe("simple extensions (no sliced sub-extensions, fallback to value[x])", function () {
    it("returns the value[x] element when no sliceName elements exist", function () {
      // Simple extensions like us-core-birthsex have no sliced sub-extensions.
      // They carry their value directly in Extension.value[x] (e.g., valueCode).
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("Extension.value[x]");
      expect(result[0].type[0].code).toBe("code");
    });
    it("preserves binding information on the value[x] element", function () {
      // Extensions like us-core-birthsex have a binding on value[x].
      // ExtensionComponent relies on this binding info to render a value set selector.
      // The function must return the full element definition including its binding.
      //
      // Example JSON: { "url": "http://.../us-core-birthsex", "valueCode": "M" }
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(1);
      expect(result[0].binding).toEqual({
        strength: "required",
        valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
      });
    });
    it("returns value[x] for a string-type simple extension", function () {
      // A simple extension whose value is a string.
      // Example JSON: { "url": "http://.../some-ext", "valueString": "hello" }
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(1);
      expect(result[0].type[0].code).toBe("string");
    });
    it("returns value[x] for a boolean-type simple extension", function () {
      // A simple extension whose value is a boolean.
      // Example JSON: { "url": "http://.../some-ext", "valueBoolean": true }
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toHaveLength(1);
      expect(result[0].type[0].code).toBe("boolean");
    });
    it("returns empty array when no sliceName AND no value[x] elements exist", function () {
      // Edge case: profile has neither sliced sub-extensions nor value[x]
      // If there is no type information available in elementDefinition.type[0].code,
      // we do not support such extensions.
      var profileDef = {
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
      var result = (0,
      fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
        profileDef
      );
      expect(result).toEqual([]);
    });
  });
  describe("edge cases", function () {
    it("returns empty array when profile has no snapshot", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)({
          definition: {},
        })
      ).toEqual([]);
    });
    it("returns empty array when profileDef is null", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
          null
        )
      ).toEqual([]);
    });
    it("returns empty array when profileDef is undefined", function () {
      expect(
        (0, fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
          undefined
        )
      ).toEqual([]);
    });
    it("returns empty array when snapshot has an empty element array", function () {
      var profileDef = {
        definition: {
          snapshot: {
            element: [],
          },
        },
      };
      expect(
        (0, fhirDefinitionServiceUtilities_1.getEditableExtensionSubElements)(
          profileDef
        )
      ).toEqual([]);
    });
  });
});
describe("stripOutUnusedAttributes", function () {
  it("does not remove used attributes from elements", function () {
    var elements = [
      { id: "1", path: "Observation.value[x]", type: [{ code: "string" }] },
      { id: "2", path: "Observation.value[x]", type: [{ code: "boolean" }] },
      { id: "3", path: "Observation.value[x]", type: [{ code: "integer" }] },
    ];
    var resourceTree = {
      definition: {
        snapshot: {
          element: elements,
        },
      },
    };
    var result = (0, fhirDefinitionServiceUtilities_1.stripOutUnusedAttributes)(
      resourceTree
    );
    expect(result.definition.snapshot.element).toHaveLength(3);
  });
  it("removes attributes that are not used in any element", function () {
    var elements = [
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
    var resourceTree = {
      definition: {
        snapshot: {
          element: elements,
        },
      },
    };
    var result = (0, fhirDefinitionServiceUtilities_1.stripOutUnusedAttributes)(
      resourceTree
    );
    expect(result.definition.snapshot.element).toHaveLength(1);
    expect(result.definition.snapshot.element[0].type[0].code).toBe(
      "CodeableConcept"
    );
    expect(result.definition.snapshot.element[0].type[1].code).toBe("time");
  });
  it("should filter out unused attrinbute", function () {
    var elements = [
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
    var result = (0,
    fhirDefinitionServiceUtilities_1.stripOutUsedAttributesForElements)(
      elements
    );
    expect(result).toHaveLength(1);
  });
  it("should not filter out used attrinbute", function () {
    var elements = [
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
    var result = (0,
    fhirDefinitionServiceUtilities_1.stripOutUsedAttributesForElements)(
      elements
    );
    expect(result).toHaveLength(1);
    expect(result[0].type[0].code).toBe("Integer");
  });
  it("stripOutUsedAttributesForElements filteredTypes 0", function () {
    var elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [{ code: "SampledData" }, { code: "SampledData" }],
      },
    ];
    var result = (0,
    fhirDefinitionServiceUtilities_1.stripOutUsedAttributesForElements)(
      elements
    );
    expect(result).toHaveLength(0); // All types filtered out, so element is removed
  });
  it("stripOutUsedAttributesForElements type length 0", function () {
    var elements = [
      {
        id: "Observation.value[x]",
        path: "Observation.value[x]",
        type: [],
      },
    ];
    var result = (0,
    fhirDefinitionServiceUtilities_1.stripOutUsedAttributesForElements)(
      elements
    );
    expect(result).toHaveLength(1);
  });
});
describe("isMultiCardinalityElement", function () {
  it("should return true when element max is '*'", function () {
    var element = {
      id: "Patient.name",
      path: "Patient.name",
      max: "*",
      type: [{ code: "HumanName" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(true);
  });
  it("should return true when element max is greater than 1", function () {
    var element = {
      id: "Patient.identifier",
      path: "Patient.identifier",
      max: "5",
      type: [{ code: "Identifier" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(true);
  });
  it("should return false when element max is '1' and base max is '1'", function () {
    var element = {
      id: "Patient.gender",
      path: "Patient.gender",
      max: "1",
      base: { path: "Patient.gender", min: 0, max: "1" },
      type: [{ code: "code" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(false);
  });
  it("should return true when base max is '*' even if element max is '1'", function () {
    var element = {
      id: "Patient.name",
      path: "Patient.name",
      max: "1",
      base: { path: "Patient.name", min: 0, max: "*" },
      type: [{ code: "HumanName" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(true);
  });
  it("should return false when element max is '0'", function () {
    var element = {
      id: "Patient.deceased[x]",
      path: "Patient.deceased[x]",
      max: "0",
      base: { path: "Patient.deceased[x]", min: 0, max: "1" },
      type: [{ code: "boolean" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(false);
  });
  it("should return false when element max is undefined and base max is '1'", function () {
    var element = {
      id: "Patient.active",
      path: "Patient.active",
      base: { path: "Patient.active", min: 0, max: "1" },
      type: [{ code: "boolean" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBeFalsy();
  });
  it("should return false when both max and base are undefined", function () {
    var element = {
      id: "Patient.active",
      path: "Patient.active",
      type: [{ code: "boolean" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBeFalsy();
  });
  it("should return true when element max is '2'", function () {
    var element = {
      id: "Patient.contact",
      path: "Patient.contact",
      max: "2",
      base: { path: "Patient.contact", min: 0, max: "2" },
      type: [{ code: "BackboneElement" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(true);
  });
  it("should return false when element max is '1' and base is undefined", function () {
    var element = {
      id: "Patient.birthDate",
      path: "Patient.birthDate",
      max: "1",
      type: [{ code: "date" }],
    };
    expect(
      (0, fhirDefinitionServiceUtilities_1.isMultiCardinalityElement)(element)
    ).toBe(false);
  });
});
