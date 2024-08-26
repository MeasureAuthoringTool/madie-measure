import applyCode from "./codeApplier";
import * as fs from "fs";
import { Code } from "@madie/madie-models";
import { CqlApplyActionResult } from "./CqlApplyActionResult";

const mockCode = {
  name: "1178689",
  display: "Mifeprex Pill",
  svsVersion: "2022-05",
  codeSystem: "RXNORM",
  codeSystemOid: "2.16.840.1.113883.6.96",
  suffix: "12",
  versionIncluded: true,
  status: "NA",
} as unknown as Code;

describe("applyCode test cases", () => {
  it("Should apply new code to CQL", () => {
    //read cql from file
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincTest.cql",
      "utf8"
    );
    const codeJson = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincCode.json",
      "utf8"
    );

    const code = JSON.parse(codeJson);
    const result: CqlApplyActionResult = applyCode(cql, code);
    expect(result.cql).toContain("24353-5");
    expect(result.status).toEqual("success");
    expect(result.message).toEqual(
      "Code 24353-5 has been successfully added to the CQL."
    );
  });

  it("Should not add a code that already exists- duplicate code", () => {
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincTest.cql",
      "utf8"
    );
    const codeJson = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/LoincCode.json",
      "utf8"
    );

    expect(cql).toContain(
      "codesystem \"LOINC\": 'urn:oid:2.16.840.1.113883.6.1'"
    );
    expect(cql).not.toContain("24353-5");
    const code = JSON.parse(codeJson);
    let result: CqlApplyActionResult = applyCode(cql, code);

    result = applyCode(result.cql, code);

    expect(cql).toContain(
      "codesystem \"LOINC\": 'urn:oid:2.16.840.1.113883.6.1'"
    );
    expect(result.cql).toContain("24353-5");

    const countCode = (result.cql.match(/24353/g) || []).length;
    const countCodeSystem = (result.cql.match(/urn/g) || []).length;
    expect(countCode).toBe(1);
    expect(countCodeSystem).toBe(1);
    expect(result.message).toBe(
      "Code 24353-5 has already been defined in CQL."
    );
    expect(result.status).toBe("info");
  });

  it("Should add CodeSystem and Code if necessary", () => {
    //read cql from file
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/CptTest.cql",
      "utf8"
    );
    const codeJson = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/SnomedctCode.json",
      "utf8"
    );

    expect(cql).not.toContain(
      `codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'`
    );
    expect(cql).not.toContain("281302008");

    const code = JSON.parse(codeJson);
    let result: CqlApplyActionResult = applyCode(cql, code);

    expect(result.cql).toContain(
      `codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'`
    );
    expect(result.cql).toContain("281302008");
  });

  it("Should update existing code- add suffix and version", () => {
    //read cql from file
    const cql = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/CptTest.cql",
      "utf8"
    );
    const codeJson = fs.readFileSync(
      "src/components/editMeasure/editor/__mocks__/SnomedctCode.json",
      "utf8"
    );

    expect(cql).not.toContain(
      `codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'`
    );
    expect(cql).not.toContain("281302008");
    let result = applyCode(cql, mockCode);
    expect(result.cql).toContain(
      `codesystem "${mockCode.codeSystem}:${mockCode.svsVersion}": 'urn:oid:${mockCode.codeSystemOid}' version 'urn:hl7:version:${mockCode.svsVersion}'`
    );
    expect(result.message).toContain(
      `Code ${mockCode.name} has been updated successfully.`
    );
    expect(result.status).toContain("success");
    expect(result.cql).toContain(
      `code "${mockCode.display} (${mockCode.suffix})": '${mockCode.name}' from "${mockCode.codeSystem}:${mockCode.svsVersion}" display '${mockCode.display}'`
    );
  });

  it("Should insert code if editor is blank", () => {
    let result = applyCode("", mockCode);
    expect(result.message).toContain(
      `Code ${mockCode.name} has been successfully added to the CQL.`
    );
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(
      `codesystem "${mockCode.codeSystem}:${mockCode.svsVersion}": 'urn:oid:${mockCode.codeSystemOid}' version 'urn:hl7:version:${mockCode.svsVersion}'`
    );
    expect(cqlArray[1]).toEqual("");
    expect(cqlArray[2]).toEqual(
      `code "${mockCode.display} (${mockCode.suffix})": '${mockCode.name}' from "${mockCode.codeSystem}:${mockCode.svsVersion}" display '${mockCode.display}'`
    );
  });

  it("Should insert code if CQL has only library statement", () => {
    const libraryStatement = "library ABC version '0.0.000'";
    let result = applyCode(libraryStatement, mockCode);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual(
      `codesystem "${mockCode.codeSystem}:${mockCode.svsVersion}": 'urn:oid:${mockCode.codeSystemOid}' version 'urn:hl7:version:${mockCode.svsVersion}'`
    );
    expect(cqlArray[2]).toEqual(
      `code "${mockCode.display} (${mockCode.suffix})": '${mockCode.name}' from "${mockCode.codeSystem}:${mockCode.svsVersion}" display '${mockCode.display}'`
    );
  });

  it("Should insert code if CQL contains using statement", () => {
    const usingStatement = "using QDM version '5.6'";
    const libraryStatement = "library ABC version '0.0.000'";
    const cql = `${libraryStatement}\n${usingStatement}`;
    let result = applyCode(cql, mockCode);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual(usingStatement);
    expect(cqlArray[2]).toEqual(
      `codesystem "${mockCode.codeSystem}:${mockCode.svsVersion}": 'urn:oid:${mockCode.codeSystemOid}' version 'urn:hl7:version:${mockCode.svsVersion}'`
    );
    expect(cqlArray[3]).toEqual(
      `code "${mockCode.display} (${mockCode.suffix})": '${mockCode.name}' from "${mockCode.codeSystem}:${mockCode.svsVersion}" display '${mockCode.display}'`
    );
  });

  it("Should insert code if CQL contains code systems", () => {
    const libraryStatement = "library ABC version '0.0.000'";
    const usingStatement = "using QDM version '5.6'";
    const codeSystemStatement =
      "codesystem \"CPT\": 'urn:oid:2.16.840.1.113883.6.12'";
    const cql = `${libraryStatement}\n${usingStatement}\n${codeSystemStatement}`;
    let result = applyCode(cql, mockCode);
    const cqlArray = result.cql.split("\n");
    expect(cqlArray[0]).toEqual(libraryStatement);
    expect(cqlArray[1]).toEqual(usingStatement);
    expect(cqlArray[2]).toEqual(codeSystemStatement);
    expect(cqlArray[3]).toEqual(
      `codesystem "${mockCode.codeSystem}:${mockCode.svsVersion}": 'urn:oid:${mockCode.codeSystemOid}' version 'urn:hl7:version:${mockCode.svsVersion}'`
    );
    expect(cqlArray[4]).toEqual(
      `code "${mockCode.display} (${mockCode.suffix})": '${mockCode.name}' from "${mockCode.codeSystem}:${mockCode.svsVersion}" display '${mockCode.display}'`
    );
  });
});
