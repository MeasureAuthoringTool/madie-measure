import applyParameter from "./parameterApplier";
import * as fs from "fs";
import { CqlApplyActionResult } from "./CqlApplyActionResult";
import { Parameter } from "../../../../../madie-editor/src/api/useTerminologyServiceApi";

const mockParameter = {
  parameterName: "testName",
  expression: "testExpression",
} as unknown as Parameter;

describe("applyCode test cases", () => {
  it("Should apply parameter to CQL", () => {
    //read cql from file
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincTest1.cql",
      "utf8"
    );
    const parameterJSON = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/testParameter.json",
      "utf8"
    );

    const parameter = JSON.parse(parameterJSON);
    const result: CqlApplyActionResult = applyParameter(cql, parameter);
    expect(result.cql).toContain("Measurement Period");
    expect(result.status).toEqual("success");
    expect(result.message).toEqual(
      "Parameter Measurement Period has been successfully added to the CQL."
    );
  });

  it("Should not add a parameter that already exists- duplicate parameter", () => {
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincTest.cql",
      "utf8"
    );
    const parameterJSON = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/testParameter.json",
      "utf8"
    );
    // already has
    expect(cql).toContain(`parameter "Measurement Period" Interval<DateTime>`);
    const parameter = JSON.parse(parameterJSON);
    let result: CqlApplyActionResult = applyParameter(cql, parameter);
    result = applyParameter(result.cql, parameter);
    // already exists
    expect(result.message).toBe(
      "Parameter Measurement Period has already been defined in CQL."
    );
    expect(result.status).toBe("info");
  });

  it("Should add Parameter if not present", () => {
    //read cql from file
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincTest1.cql",
      "utf8"
    );
    const parameterJSON = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/testParameter.json",
      "utf8"
    );

    expect(cql).not.toContain(
      `parameter "Measurement Period" Interval<DateTime>`
    );
    const parameter = JSON.parse(parameterJSON);
    let result: CqlApplyActionResult = applyParameter(cql, parameter);
    result = applyParameter(result.cql, parameter);

    expect(result.cql).toContain(
      `parameter "Measurement Period" Interval<DateTime>`
    );
  });

  it("Should insert parameter if editor is blank", () => {
    let result = applyParameter("", mockParameter);
    expect(result.message).toContain(
      `Parameter ${mockParameter.parameterName} has been successfully added to the CQL.`
    );
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[1]).toEqual('parameter "testName" testExpression');
  });

  it("Should insert Parameter if CQL has only library statement", () => {
    const libraryStatement = "library ABC version '0.0.000'";
    let result = applyParameter(libraryStatement, mockParameter);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual('parameter "testName" testExpression');
  });

  it("Should insert code if CQL contains using statement", () => {
    const usingStatement = "using QDM version '5.6'";
    const libraryStatement = "library ABC version '0.0.000'";
    const cql = `${libraryStatement}\n${usingStatement}`;
    let result = applyParameter(cql, mockParameter);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual(usingStatement);
    expect(cqlArray[2]).toEqual('parameter "testName" testExpression');
  });

  it("Should insert code if CQL contains code systems", () => {
    const libraryStatement = "library ABC version '0.0.000'";
    const usingStatement = "using QDM version '5.6'";
    const codeSystemStatement =
      "codesystem \"CPT\": 'urn:oid:2.16.840.1.113883.6.12'";
    const cql = `${libraryStatement}\n${usingStatement}\n${codeSystemStatement}`;
    let result = applyParameter(cql, mockParameter);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual(usingStatement);
    expect(cqlArray[2]).toEqual(codeSystemStatement);
    expect(cqlArray[3]).toEqual('parameter "testName" testExpression');
  });
});
