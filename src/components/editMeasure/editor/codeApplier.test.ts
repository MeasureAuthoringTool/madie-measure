import applyCode, { CodeChangeResult } from "./codeApplier";
import * as fs from "fs";
import { Code } from "@madie/madie-models";

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
  const result: CodeChangeResult = applyCode(cql, code);
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
  let result: CodeChangeResult = applyCode(cql, code);

  result = applyCode(result.cql, code);

  expect(cql).toContain(
    "codesystem \"LOINC\": 'urn:oid:2.16.840.1.113883.6.1'"
  );
  expect(result.cql).toContain("24353-5");

  const countCode = (result.cql.match(/24353/g) || []).length;
  const countCodeSystem = (result.cql.match(/urn/g) || []).length;
  expect(countCode).toBe(1);
  expect(countCodeSystem).toBe(1);
  expect(result.message).toBe("Code 24353-5 has already been defined in CQL.");
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
  let result: CodeChangeResult = applyCode(cql, code);

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

  const code = {
    name: "1178689",
    display: "Mifeprex Pill",
    svsVersion: "2022-05",
    codeSystem: "RXNORM",
    codeSystemOid: "2.16.840.1.113883.6.96",
    suffix: "12",
    isVersionIncluded: true,
    status: "NA",
  } as unknown as Code;

  let result = applyCode(cql, code);
  expect(result.cql).toContain(
    `codesystem "${code.codeSystem}:${code.svsVersion}": 'urn:oid:${code.codeSystemOid}' version 'urn:hl7:version:${code.svsVersion}'`
  );
  expect(result.message).toContain(
    `Code ${code.name} has been updated successfully.`
  );
  expect(result.status).toContain("success");
  expect(result.cql).toContain(
    `code "${code.display} (${code.suffix})": '${code.name}' from "${code.codeSystem}:${code.svsVersion}" display '${code.display}'`
  );
});
