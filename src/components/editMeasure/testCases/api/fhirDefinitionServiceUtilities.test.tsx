import {
  getBasePath,
  getTopLevelElements,
  getRequiredElements,
  stripResourcePath,
  getAllChildren,
  updateChildrenPaths,
  isComponentDataType,
  setNestedValue,
  getDisplayedElementsTree,
  removeUndefinedAndEmptyObjects,
} from "./fhirDefinitionServiceUtilities";

describe("FhirDefinitionServiceUtilities", () => {
  const mockResource = {
    definition: {
      snapshot: {
        element: [
          { path: "Patient", min: 1 },
          { path: "Patient.name", min: 0 },
          { path: "Patient.age", min: 1 },
          { path: "Patient.address.street", min: 0 },
        ],
      },
    },
  };

  describe("getBasePath", () => {
    it("should return the base path from the first element", () => {
      const result = getBasePath(mockResource);
      expect(result).toBe("Patient");
    });

    it("should return undefined if no elements are present", () => {
      const result = getBasePath({});
      expect(result).toBeUndefined();
    });
  });

  describe("getTopLevelElements", () => {
    it("should return elements with a path length of 2", () => {
      const result = getTopLevelElements(mockResource);
      expect(result).toEqual([
        { path: "Patient.name", min: 0 },
        { path: "Patient.age", min: 1 },
      ]);
    });
  });

  describe("getRequiredElements", () => {
    it("should return elements with min > 0 and path length of 2", () => {
      const result = getRequiredElements(mockResource);
      expect(result).toEqual([{ path: "Patient.age", min: 1 }]);
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
        { path: "Patient.name", min: 0 },
        { path: "Patient.age", min: 1 },
        { path: "Patient.address.street", min: 0 },
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
  describe("getDisplayedElementsTree", () => {
    it("should return an empty object when no elements are provided", () => {
      expect(getDisplayedElementsTree([])).toEqual({});
    });

    it("should build a nested structure from paths", () => {
      const elements = [{ path: "a.b" }, { path: "a.c" }, { path: "a.b.d" }];
      expect(getDisplayedElementsTree(elements)).toEqual({
        a: {
          b: { d: true },
          c: true,
        },
      });
    });

    it("should handle duplicate paths", () => {
      const elements = [{ path: "x.y" }, { path: "x.y" }, { path: "x.y.z" }];
      expect(getDisplayedElementsTree(elements)).toEqual({
        x: {
          y: { z: true },
        },
      });
    });

    it("should ignore undefined or empty paths", () => {
      const elements = [{ path: "a.b" }, { path: "" }, { path: undefined }];
      expect(getDisplayedElementsTree(elements)).toEqual({ a: { b: true } });
    });
  });
  describe("removeUndefinedAndEmptyObjects", () => {
    it("should remove undefined values from an object", () => {
      const obj = { a: 1, b: undefined, c: 3 };
      expect(removeUndefinedAndEmptyObjects(obj)).toEqual({ a: 1, c: 3 });
    });

    it("should remove empty nested objects", () => {
      const obj = { a: { b: {} }, c: 3 };
      expect(removeUndefinedAndEmptyObjects(obj)).toEqual({ c: 3 });
    });

    it("should handle deeply nested empty objects", () => {
      const obj = { a: { b: { c: {} } }, d: 4 };
      expect(removeUndefinedAndEmptyObjects(obj)).toEqual({ d: 4 });
    });

    it("should keep nested objects with values", () => {
      const obj = { a: { b: { c: 5 } }, d: 4 };
      expect(removeUndefinedAndEmptyObjects(obj)).toEqual({
        a: { b: { c: 5 } },
        d: 4,
      });
    });

    it("should return the same value if not an object", () => {
      expect(removeUndefinedAndEmptyObjects(null)).toBe(null);
      expect(removeUndefinedAndEmptyObjects(12)).toBe(12);
      expect(removeUndefinedAndEmptyObjects("test")).toBe("test");
    });
  });
});

describe("getElementName", () => {
  it("returns the slice if exists", () => {
    const element = { min: 0, sliceName: "testSlice", path: "some.path" };
    expect(getElementName(element, "some")).toBe("testSlice");
  });

  it("returns path minus base", () => {
    const element = { min: 0, path: "some.path" };
    expect(getElementName(element, "some")).toBe("path");
  });

  it("adds required indicator", () => {
    const element = { min: 1, path: "some.path" };
    expect(getElementName(element, "some")).toBe("path *");
  });

  it("adds required indicator", () => {
    const element = { min: 1, sliceName: "testSlice", path: "some.path" };
    expect(getElementName(element, "some")).toBe("testSlice *");
  });
});
