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
    const element = {
      id: "testSlice",
      min: 0,
      sliceName: "testSlice",
      path: "some.path",
    };
    expect(getElementName(element, "some")).toBe("testSlice");
  });

  it("returns path minus base", () => {
    const element = { id: "some.path", min: 0, path: "some.path" };
    expect(getElementName(element, "some")).toBe("path");
  });

  it("adds required indicator", () => {
    const element = { id: "some.path", min: 1, path: "some.path" };
    expect(getElementName(element, "some")).toBe("path *");
  });

  it("adds required indicator", () => {
    const element = {
      id: "some.path",
      min: 1,
      sliceName: "testSlice",
      path: "some.path",
    };
    expect(getElementName(element, "some")).toBe("testSlice *");
  });
});

describe("getElementName", () => {
  it("returns sliceName with index and requiredIndicator if sliceName exists", () => {
    const element = {
      id: "Patient.name[0].given",
      min: 1,
      sliceName: "givenName",
    };
    expect(getElementName(element as any, "Patient")).toBe("givenName *");
  });

  it("returns path without basePath and indexes if no sliceName", () => {
    const element = { id: "Patient.name[0].family", min: 0 };
    expect(getElementName(element as any, "Patient")).toBe("name.family");
  });

  it("handles no index correctly", () => {
    const element = { id: "Patient.birthDate", min: 0 };
    expect(getElementName(element as any, "Patient")).toBe("birthDate");
  });

  it("adds required indicator if min > 0", () => {
    const element = { id: "Patient.gender", min: 1 };
    expect(getElementName(element as any, "Patient")).toBe("gender *");
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
