import {
  getBasePath,
  getTopLevelElements,
  getRequiredElements,
  stripResourcePath,
  getAllChildren,
  updateChildrenPaths,
  isComponentDataType,
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
});
