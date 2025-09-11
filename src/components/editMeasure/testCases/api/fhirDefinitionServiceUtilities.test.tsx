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
  removeIndicesFromPath,
  buildFullValidationSchema,
  recursiveAddYupObject,
  addCardinalityToElement,
  formatChoiceType,
  modifySliceNameForReadability,
  extractNameWithoutIndex,
} from "./fhirDefinitionServiceUtilities";

describe("FhirDefinitionServiceUtilities", () => {
  const mockResource = {
    definition: {
      snapshot: {
        element: [
          { path: "Patient", min: 1, type: [{ code: "Resource" }] },
          { path: "Patient.name", min: 0, type: [{ code: "HumanName" }] },
          { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
          {
            path: "Patient.address.street",
            min: 0,
            type: [{ code: "string" }],
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

    it("Should remove indeces from path", () => {
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
      expect(result).toEqual([
        { path: "Patient.name", min: 0, type: [{ code: "HumanName" }] },
        { path: "Patient.age", min: 1, type: [{ code: "integer" }] },
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
      ]);
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

    it("should return array by removing empty/null/undefined values", () => {
      expect(
        removeUndefinedAndEmptyObjects([
          "2024",
          "",
          undefined,
          null,
          "08/09/2025",
        ])
      ).toEqual(["2024", "08/09/2025"]);
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
    expect(getElementName(element, "some", [])).toBe("path");
  });
  it("should handles not a number index", () => {
    const element = {
      id: "Patient.name[asdf]",
      min: 1,
    } as any;
    const basePath = "Patient";
    const result = getElementName(element, basePath, [{}, {}]);
    expect(result).toBe(" *name[asdf]");
  });

  it("should handle retrievedIndex and Number(retrievedIndex) > 0 to add correct index", () => {
    const element = {
      id: "Patient.name[1]",
      min: 1,
    } as any;
    const basePath = "Patient";
    const result = getElementName(element, basePath, [{}, {}]);
    expect(result).toBe(" *name 2 ");
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
    expect(result).toBe("name 1 ");
  });

  it("returns path minus base", () => {
    const element = { id: "some.path", min: 0, path: "some.path" };
    expect(getElementName(element, "some", [])).toBe("path");
  });

  it("Should add required indicator when the attribute is required", () => {
    const element = { id: "some.path", min: 1, path: "some.path" };
    expect(getElementName(element, "some", null)).toBe(" *path");
  });

  it("adds required indicator", () => {
    const element = {
      id: "some.path",
      min: 1,
      path: "some.path",
    };
    expect(getElementName(element, "some", {})).toBe(" *path");
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
    expect(nameFamily).toBe("name.family");
  });

  it("handles no index correctly", () => {
    const element = { id: "Patient.birthDate", min: 0 };
    expect(getElementName(element as any, "Patient", [])).toBe("birthDate");
  });

  it("adds required indicator if min > 0", () => {
    const element = { id: "Patient.gender", min: 1 };
    expect(getElementName(element as any, "Patient", [])).toBe(" *gender");
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
  it("should add a new element when the path is missing", () => {
    const nextEntry = { resource: {} };
    const elemPath = "name";
    const result = addCardinalityToElement(nextEntry, elemPath);
    expect(result.resource[elemPath]).toEqual([{}, {}]);
  });

  it("should wrap a non-array element in an array and add a new element", () => {
    const nextEntry = { resource: { name: { given: "John" } } };
    const elemPath = "name";
    const result = addCardinalityToElement(nextEntry, elemPath);
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, {}]);
  });

  it("should append a el to existing array", () => {
    const nextEntry = { resource: { name: [{ given: "John" }] } };
    const elemPath = "name";
    const result = addCardinalityToElement(nextEntry, elemPath);
    expect(result.resource[elemPath]).toEqual([{ given: "John" }, {}]);
  });

  it("should handle by converting to array", () => {
    const nextEntry = { resource: { name: {} } };
    const elemPath = "name";
    const result = addCardinalityToElement(nextEntry, elemPath);
    expect(result.resource[elemPath]).toEqual([{}, {}]);
  });

  it("should handle undefined paths by converting to array", () => {
    const nextEntry = { resource: { name: undefined } };
    const elemPath = "name";
    const result = addCardinalityToElement(nextEntry, elemPath);
    expect(result.resource[elemPath]).toEqual([{}, {}]);
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
