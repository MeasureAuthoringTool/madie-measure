import applyCode from "./codeApplier.ts";
import * as fs from "fs";
it("Should parse CQL", () => {
  //read cql from file

  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/LoincTest.cql",
    "utf8"
  );
  const codeJson = fs.readFileSync(
    "src/components/editMeasure/editor/LoincCode.json",
    "utf8"
  );

  const code = JSON.parse(codeJson);
  const resultCql: string = applyCode(cql, code);
  expect(resultCql).toContain("24353-5");
});

it("Should not add a CodeSystem that already exists", () => {
  //read cql from file

  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/LoincTest.cql",
    "utf8"
  );
  const codeJson = fs.readFileSync(
    "src/components/editMeasure/editor/LoincCode.json",
    "utf8"
  );

  expect(cql).toContain(
    "codesystem \"LOINC\": 'urn:oid:2.16.840.1.113883.6.1'"
  );
  expect(cql).not.toContain("24353-5");
  const code = JSON.parse(codeJson);
  let resultCql: string = applyCode(cql, code);

  resultCql = applyCode(resultCql, code);

  expect(cql).toContain(
    "codesystem \"LOINC\": 'urn:oid:2.16.840.1.113883.6.1'"
  );
  expect(resultCql).toContain("24353-5");

  var countCode = (resultCql.match(/24353/g) || []).length;
  var countCodeSystem = (resultCql.match(/urn/g) || []).length;
  expect(countCode).toBe(1);
  expect(countCodeSystem).toBe(1);
});
it("Should not add a Code that already exists", () => {
  //read cql from file

  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/LoincTest.cql",
    "utf8"
  );
  const codeJson = fs.readFileSync(
    "src/components/editMeasure/editor/LoincCode.json",
    "utf8"
  );

  const code = JSON.parse(codeJson);
  let resultCql: string = applyCode(cql, code);

  resultCql = applyCode(resultCql, code);

  expect(resultCql).toContain("24353-5");

  var count = (resultCql.match(/24353/g) || []).length;
  expect(count).toBe(1);
});

it("Should add CodeSystem and Code if necessary", () => {
  //read cql from file
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/CptTest.cql",
    "utf8"
  );
  const codeJson = fs.readFileSync(
    "src/components/editMeasure/editor/SnomedctCode.json",
    "utf8"
  );

  expect(cql).not.toContain(
    `codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'`
  );
  expect(cql).not.toContain("281302008");

  const code = JSON.parse(codeJson);
  let resultCql: string = applyCode(cql, code);

  expect(resultCql).toContain(
    `codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'`
  );
  expect(resultCql).toContain("281302008");
});
