import { applyDefinition, editDefinition } from "./DefinitionApplier";

describe("Definition Apply Utility tests", () => {
  const mockCql = `library TestNow version '0.0.000'
 using QDM version '5.6'
 codesystem "LOINC": 'urn:oid:2.16.840.1.113883.6.1'
 define "Initial Population":
  "Qualifying Encounters"`;

  const selectedDefinition = {
    definitionName: "Initial Population",
    expressionValue: "  Qualifying Encounters",
  };

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

  it("format the definition and replace the new editted content in the cql", () => {
    const updatedCql = editDefinition(
      selectedDefinition,
      {
        definitionName: "Edited Initial Population",
        comment: "edited def",
        expressionValue: "  Qualifying Encounters\n  editedtext",
      },
      mockCql
    );
    expect(updatedCql).toContain("edited def");
    expect(updatedCql).toContain(`define \"Edited Initial Population\":`);
  });
});
