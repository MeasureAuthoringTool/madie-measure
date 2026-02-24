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
} from "./fhirDefinitionServiceUtilities";

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
