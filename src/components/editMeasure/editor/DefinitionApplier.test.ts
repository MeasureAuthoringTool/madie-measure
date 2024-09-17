import { applyDefinition } from "./DefinitionApplier";

describe("Definition Apply Utility tests", () => {
  const mockCql = `library TestNow version '0.0.000'
 using QDM version '5.6'
 codesystem "LOINC": 'urn:oid:2.16.840.1.113883.6.1'
 define "Initial Population":
  "Qualifying Encounters"`;

  it("format the definition when the comments are not provided", () => {
    const updatedCql = applyDefinition(
      {
        definitionName: "Denominator",
        comment: "",
        expressionValue: "Initial Population",
      },
      mockCql
    );
    expect(updatedCql).toContain(`define \"Denominator\":`);
  });

  it("format the definition when the comments are not provided", () => {
    const updatedCql = applyDefinition(
      {
        definitionName: "Numerator",
        comment: "numerator comment",
        expressionValue: "Initial Population",
      },
      mockCql
    );
    expect(updatedCql).toContain("numerator comment");
    expect(updatedCql).toContain(`define \"Numerator\":`);
  });
});
