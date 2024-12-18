import applyCQLFunction, { deleteCQLFunction } from "./cqlFunctionApplier";
import * as fs from "fs";

const getMock = (name) => {
  return fs.readFileSync(
    `src/components/editMeasure/editor/__mocks__/${name}.cql`,
    "utf8"
  );
};

describe("Definition Apply Function tests", () => {
  const testFunction = {
    fluentFunction: false,
    functionName: "Function name here",
    comment: "I'm a comment about nothing at all",
    functionsArguments: [
      { argumentName: "arg1", dataType: "Integer" },
      { argumentName: "arg2", dataType: "Integer" },
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
  it("format the function when fluent are not provided", () => {
    const updatedCqlObject = applyCQLFunction(mockCql, {
      ...testFunction,
      comment: "",
      fluentFunction: true,
    });
    const updatedCql = updatedCqlObject.cql;
    expect(updatedCql).toContain(
      `define fluent function \"Function name here\"`
    );
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

  it("canInsert when no ExpressionDefinitions", () => {
    const mockCql = getMock("cqlFunctionAppliernoDefines");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("will not insert when function is found", () => {
    const mockCql = getMock("cqlFunctionApplierDuplicateEntry");
    const result = applyCQLFunction(mockCql, testFunction);
    expect(result.message).toBe(
      "Function Function name here has already been defined in CQL."
    );
  });

  it("will check arg length and skip if not same length", () => {
    const mockCql = getMock("cqlFunctionApplierDuplicateEntry");
    const result = applyCQLFunction(mockCql, {
      ...testFunction,
      functionsArguments: [{ argumentName: "arg1", dataType: "Integer" }],
    });
    expect(result.message).toBe(
      "Function Function name here has been successfully added to the CQL."
    );
  });

  it("will add fn if dataTypes differ", () => {
    const mockCql = getMock("cqlFunctionApplierDuplicateEntry");
    const result = applyCQLFunction(mockCql, {
      ...testFunction,
      functionsArguments: [
        { argumentName: "arg1", dataType: "Other" },
        { argumentName: "arg2", dataType: "Integer" },
      ],
    });
    expect(result.message).toBe(
      "Function Function name here has been successfully added to the CQL."
    );
  });

  it("canInsert when no parameters", () => {
    const mockCql = getMock("cqlFunctionAppliernoCodes");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no codes", () => {
    const mockCql = getMock("cqlFunctionAppliernoCodeSystems");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no valuesets", () => {
    const mockCql = getMock("cqlFunctionAppliernoValuesets");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no params", () => {
    const mockCql = getMock("cqlFunctionAppliernoParams");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no codeSystems", () => {
    const mockCql = getMock("cqlFunctionAppliernoCodeSystems");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no includes", () => {
    const mockCql = getMock("cqlFunctionAppliernoIncludes");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("canInsert when no usings", () => {
    const mockCql = getMock("cqlFunctionAppliernoUsings");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });
  it("canInsert when no library", () => {
    const mockCql = getMock("cqlFunctionAppliernoLibrary");
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(
      `define function \"Function name here\"(arg1 \"Integer\", arg2 \"Integer\"):`
    );
  });

  it("Can insert a function with no args that's not defined", () => {
    const mockCql = getMock("cqlFunctionApplierFunctionNoArgs");
    const testFunction = {
      fluentFunction: true,
      functionName: "anyName",
      comment: "",
      functionsArguments: [],
      expressionValue: "true",
    };
    const { cql } = applyCQLFunction(mockCql, testFunction);
    expect(cql).toContain(`define fluent function \"anyName\"():`);
  });

  it("Will fail to insert a function with no args that is defined", () => {
    const mockCql = getMock("cqlFunctionApplierFunctionNoArgs");
    const testFunction = {
      fluentFunction: true,
      functionName: "test",
      comment: "",
      functionsArguments: [],
      expressionValue: "true",
    };
    const result = applyCQLFunction(mockCql, testFunction);
    expect(result.message).toBe(
      "Function test has already been defined in CQL."
    );
  });

  it("Will not delete a function when function not found", () => {
    const mockCql = getMock("cqlFunctionApplierFunctionNoArgs");

    const testFunction = {
      fluentFunction: true,
      functionName: "test",
      expression: `define function "test"():\n  undefined`,
      comment: "test comment",
      functionsArguments: [],
      expressionValue: "true",
    };
    const result = deleteCQLFunction(mockCql, testFunction);
    expect(result.message).toBe("Function test has not been defined in CQL.");
  });

  it("Will delete a function successfully", () => {
    const mockCql = `library TestLib version '0.0.000'
using QICore version '4.1.1'
include FHIRHelpers version '4.1.000' called FHIRHelpers

context Patient

define function MeasureObservation(e Encounter):
  2`;

    const functionToDelete = {
      functionName: "MeasureObservation",
      fluentFunction: false,
      expressionValue: "define function MeasureObservation(e Encounter):\n  2",
      expression: "define function MeasureObservation(e Encounter):\n  2",
    };

    const result = deleteCQLFunction(mockCql, functionToDelete);
    expect(result.message).toBe(
      "Function MeasureObservation has been successfully removed from the CQL."
    );
  });
});
