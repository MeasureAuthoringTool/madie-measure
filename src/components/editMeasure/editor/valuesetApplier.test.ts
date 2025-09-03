import applyValueset from "./valuesetApplier";
import * as fs from "fs";
import { CqlApplyActionResult } from "./CqlApplyActionResult";
import { Model } from "@madie/madie-models";

it("Should add valuset to CQL that does not exist when no valusets present", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/LoincTest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valusetJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain("Emergency Department Evaluation");
  expect(result.status).toBeTruthy();
  expect(result.message).toEqual(
    `Value Set Emergency Department Evaluation has been successfully added to the CQL.`
  );
});

it("Should add valuset to CQL that does not exist when valususets are present", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/CptTest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valusetJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain("Emergency Department Evaluation");
  expect(result.status).toBeTruthy();
  expect(result.message).toEqual(
    `Value Set Emergency Department Evaluation has been successfully added to the CQL.`
  );
});

it("Should not add a valuset that already exists", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/CptTest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valuesetEthnicityJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  let result: CqlApplyActionResult = applyValueset(cql, Model.QDM_5_6, valuset);
  result = applyValueset(result.cql, Model.QDM_5_6, valuset);
  expect(cql).toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  expect(result.message).toBe("This valueset is already defined in the CQL.");
  expect(result.status).toBe("info");
});

it("Should add valuset, priotiy location usings array", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/usingsTest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valuesetEthnicityJson.json",
    "utf8"
  );

  expect(cql).not.toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  expect(result.message).toBe(
    "Value Set Ethnicity has been successfully added to the CQL."
  );
  expect(result.status).toBeTruthy();
});

it("Should add valuset, priotiy location includes array", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/includesTest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valuesetEthnicityJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(cql).not.toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  expect(result.message).toBe(
    "Value Set Ethnicity has been successfully added to the CQL."
  );
  expect(result.cql).toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  expect(result.status).toBeTruthy();
});

it("Should add valuset, priotiy location valuset array", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/vsArraytest.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valuesetEthnicityJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  expect(cql).not.toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain(
    "valueset \"Ethnicity\": 'urn:oid:2.16.840.1.114222.4.11.837'"
  );
  expect(result.message).toBe(
    "Value Set Ethnicity has been successfully added to the CQL."
  );
  expect(result.status).toBeTruthy();
});

it("Should not add valuset to CQL when value set was already added", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/CptTestWithEDE.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valusetJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain("Emergency Department Evaluation");
  expect(result.status).toBe("info");
  expect(result.message).toEqual(
    `This valueset is already defined in the CQL.`
  );
});

it("Should remove valuset suffix to already present CQL", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/CptTestWithSuffix.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valusetJson.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).not.toContain("Emergency Department Evaluation (1)");
  expect(result.cql).toContain("Emergency Department Evaluation");
  expect(result.status).toBe("success");
  expect(result.message).toEqual(
    `Value Set Emergency Department Evaluation has been successfully updated in the CQL.`
  );
});

it("Should add valuset suffix to already present CQL", () => {
  const cql = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/CptTestWithEDE.cql",
    "utf8"
  );
  const valusetJson = fs.readFileSync(
    "src/components/editMeasure/editor/__mocks__/valusetJsonWithSuffix.json",
    "utf8"
  );

  const valuset = JSON.parse(valusetJson);
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QDM_5_6,
    valuset
  );
  expect(result.cql).toContain("Emergency Department Evaluation (1)");
  expect(result.cql).not.toContain('Emergency Department Evaluation":');
  expect(result.status).toBe("success");
  expect(result.message).toEqual(
    `Value Set Emergency Department Evaluation (1) has been successfully updated in the CQL.`
  );
});

it("should add a new value set", () => {
  const cql =
    "library SimpleEncounterMeasure version '4.0.000'\n" +
    "using QICore version '4.1.1'";
  const valueSet = {
    title: "Sex",
    name: "Sex",
    url: "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1240.3",
    oid: "urn:oid:2.16.840.1.113762.1.4.1240.3",
  };
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QICORE_6_0_0,
    valueSet
  );
  expect(result.cql).toContain(valueSet.name);
  expect(result.cql).toContain(valueSet.url);
  expect(result.status).toBe("success");
  expect(result.message).toEqual(
    `Value Set Sex has been successfully added to the CQL.`
  );
});

it("should update an existing value set if exists", () => {
  const cql =
    "library SimpleEncounterMeasure version '4.0.000'\n" +
    "using QICore version '4.1.1'\n" +
    "valueset \"Sex\": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1240.3'";
  const valueSet = {
    title: "Sex",
    name: "Sex",
    url: "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1240.3",
    oid: "urn:oid:2.16.840.1.113762.1.4.1240.3",
    suffix: "1",
  };
  const result: CqlApplyActionResult = applyValueset(
    cql,
    Model.QICORE_6_0_0,
    valueSet,
    { ...valueSet, name: "Sex" }
  );
  expect(result.cql).toContain("Sex");
  expect(result.cql).toContain(valueSet.url);
  expect(result.status).toBe("success");
  expect(result.message).toEqual(
    `Value Set Sex (1) has been successfully updated in the CQL.`
  );
});
