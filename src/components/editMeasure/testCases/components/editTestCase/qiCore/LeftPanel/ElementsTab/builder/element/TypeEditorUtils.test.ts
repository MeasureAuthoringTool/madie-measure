import { getEmptyValueForType, hasNonEmptyValue } from "./TypeEditorUtils";

describe("TypeEditorUtils", () => {
  it("getEmptyValueForType should return null for case: http://hl7.org/fhirpath/System.Boolean", () => {
    expect(getEmptyValueForType("http://hl7.org/fhirpath/System.Boolean")).toBe(
      null
    );
  });
});

describe("hasNonEmptyValue", () => {
  it("returns false for null and undefined", () => {
    expect(hasNonEmptyValue(null)).toBe(false);
    expect(hasNonEmptyValue(undefined)).toBe(false);
  });

  it("returns false for empty or whitespace-only strings", () => {
    expect(hasNonEmptyValue("")).toBe(false);
    expect(hasNonEmptyValue("   ")).toBe(false);
  });

  it("returns true for non-empty strings", () => {
    expect(hasNonEmptyValue("data")).toBe(true);
  });

  it("returns true for booleans and numbers including false and zero", () => {
    expect(hasNonEmptyValue(true)).toBe(true);
    expect(hasNonEmptyValue(false)).toBe(true);
    expect(hasNonEmptyValue(0)).toBe(true);
    expect(hasNonEmptyValue(42)).toBe(true);
  });

  it("returns false for empty arrays and objects", () => {
    expect(hasNonEmptyValue([])).toBe(false);
    expect(hasNonEmptyValue({})).toBe(false);
  });

  it("returns false for arrays/objects whose nested values are all empty", () => {
    expect(hasNonEmptyValue([{ a: "" }, { b: {} }])).toBe(false);
    expect(hasNonEmptyValue({ start: "", end: "", nested: { x: "" } })).toBe(
      false
    );
  });

  it("returns true when any nested value contains data", () => {
    expect(hasNonEmptyValue([{ a: "" }, { b: "value" }])).toBe(true);
    expect(hasNonEmptyValue({ start: "2020-01-01", end: "" })).toBe(true);
    expect(hasNonEmptyValue({ coding: [{ code: "abc" }] })).toBe(true);
  });
});
