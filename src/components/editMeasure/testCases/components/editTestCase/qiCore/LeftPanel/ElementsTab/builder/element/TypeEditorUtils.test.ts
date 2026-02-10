import { getEmptyValueForType } from "./TypeEditorUtils";

describe("TypeEditorUtils", () => {
  it("getEmptyValueForType should return null for case: http://hl7.org/fhirpath/System.Boolean", () => {
    expect(getEmptyValueForType("http://hl7.org/fhirpath/System.Boolean")).toBe(
      null
    );
  });
});
