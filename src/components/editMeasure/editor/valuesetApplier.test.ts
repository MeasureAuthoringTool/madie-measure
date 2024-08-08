import { CodeChangeResult } from "./codeApplier.ts";
import applyValueset from "./valuesetApplier.ts";
import * as fs from "fs";

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
  const result: CodeChangeResult = applyValueset(cql, valuset);
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
  const result: CodeChangeResult = applyValueset(cql, valuset);
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
  let result: CodeChangeResult = applyValueset(cql, valuset);
  result = applyValueset(result.cql, valuset);
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
  let result: CodeChangeResult = applyValueset(cql, valuset);
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
  let result: CodeChangeResult = applyValueset(cql, valuset);
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
  let result: CodeChangeResult = applyValueset(cql, valuset);
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
  const result: CodeChangeResult = applyValueset(cql, valuset);
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
  const result: CodeChangeResult = applyValueset(cql, valuset);
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
  const result: CodeChangeResult = applyValueset(cql, valuset);
  expect(result.cql).toContain("Emergency Department Evaluation (1)");
  expect(result.cql).not.toContain('Emergency Department Evaluation":');
  expect(result.status).toBe("success");
  expect(result.message).toEqual(
    `Value Set Emergency Department Evaluation (1) has been successfully updated in the CQL.`
  );
});
