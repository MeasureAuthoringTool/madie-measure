import { getAttributes, getMaxAttributes } from "./TestCaseSummaryGridUtils";

describe("getAttributes", () => {
  test("should return all nonfiltered values", () => {
    const row = {
      resource: {
        resourceType: "Patient",
        id: "123",
        name: "baldwin",
        age: 30,
        address: "",
        active: true,
        status: null,
      },
    };
    const result = getAttributes(row);
    expect(result).toEqual(["name", "age", "active"]);
  });

  test("should return empty", () => {
    const row = {
      resource: {
        resourceType: "Observation",
        id: "456",
      },
    };
    const result = getAttributes(row);
    expect(result).toEqual([]);
  });

  test("should return empty array", () => {
    expect(getAttributes({})).toEqual([]);
    expect(getAttributes({ resource: {} })).toEqual([]);
  });
});

describe("getMaxAttributes", () => {
  test("should return the maximum", () => {
    const data = [
      { resource: { name: "asdf ", id: "123" } },
      { resource: { age: 25, address: "1123123", id: "123" } },
      {
        resource: {
          resourceType: "Patient",
          id: "003",
          active: true,
          gender: "female",
        },
      },
    ];
    const result = getMaxAttributes(data);
    expect(result).toBe(2);
  });

  test("should return 0 if all resources are empty", () => {
    const data = [
      { resource: { resourceType: "Patient", id: "001" } },
      { resource: { resourceType: "Patient", id: "002" } },
    ];
    const result = getMaxAttributes(data);
    expect(result).toBe(0);
  });

  test("should handle empty or undefined", () => {
    expect(getMaxAttributes([])).toBe(-Infinity);
    expect(getMaxAttributes([{}])).toBe(0);
  });
});
