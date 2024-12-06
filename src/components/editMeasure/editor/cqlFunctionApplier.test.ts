import applyCQLFunction from "./cqlFunctionApplier";

describe("Definition Apply Function tests", () => {
  const testFunction = {
    fluentFunction: false,
    functionName: "Function name here",
    comment: "I'm a comment about nothing at all",
    functionsArguments: [
      { name: "arg1", dataType: "Integer" },
      { name: "arg2", dataType: "Integer" },
    ],
    expressionValue: "true",
  };
  const mockCql = `library TestNow version '0.0.000'
    using QDM version '5.6'
    codesystem "LOINC": 'urn:oid:2.16.840.1.113883.6.1'
    define "Initial Population":
    "Qualifying Encounters"`;

  it("format the function when the comments are not provided", () => {
    const updatedCqlObject = applyCQLFunction(mockCql, {
      ...testFunction,
      comment: "",
    });
    const updatedCql = updatedCqlObject.cql;
    expect(updatedCql).toContain(`define function \"Function name here\"`);
  });

  it("format the definition when the comments are not provided", () => {
    const updatedCqlObject = applyCQLFunction(mockCql, {
      ...testFunction,
      comment: "numerator comment",
    });
    const updatedCql = updatedCqlObject.cql;
    expect(updatedCql).toContain("/* numerator comment */");
    expect(updatedCql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });
});
