import applyCode, { CodeChangeResult } from "./codeApplier.ts";
import * as fs from "fs";
it("Should parse CQL", () => {
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
  expect(result.status).toBeTruthy();
  expect(result.message).toEqual(
    "Code 24353-5 has been successfully added to the CQL."
  );
});

it("Should not add a CodeSystem that already exists", () => {
  //read cql from file

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

  var countCode = (result.cql.match(/24353/g) || []).length;
  var countCodeSystem = (result.cql.match(/urn/g) || []).length;
  expect(countCode).toBe(1);
  expect(countCodeSystem).toBe(1);
});
it("Should not add a Code that already exists", () => {
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
  let result: CodeChangeResult = applyCode(cql, code);

  result = applyCode(result.cql, code);

  expect(result.cql).toContain("24353-5");
  expect(result.status).toBeFalsy();
  expect(result.message).toEqual("This code is already defined in the CQL.");
  var count = (result.cql.match(/24353/g) || []).length;
  expect(count).toBe(1);
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
