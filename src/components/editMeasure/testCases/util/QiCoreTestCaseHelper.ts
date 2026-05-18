import { TestCase } from "@madie/madie-models";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";

export const QICORE_PATIENT_PROFILE =
  "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient";

export function buildDefaultQiCorePatientBundle() {
  const patientId = uuidv4();
  return {
    id: uuidv4(),
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        fullUrl: `https://madie.cms.gov/Patient/${patientId}`,
        resource: {
          id: patientId,
          resourceType: "Patient",
          meta: {
            profile: [QICORE_PATIENT_PROFILE],
          },
        },
      },
    ],
  };
}

export function defaultQiCoreTestCaseJson(testCase: TestCase) {
  if (_.isNil(testCase)) {
    return;
  }
  const clonedTestCase = _.cloneDeep(testCase);
  if (_.isEmpty(clonedTestCase.json)) {
    clonedTestCase.json = JSON.stringify(buildDefaultQiCorePatientBundle());
  }
  return clonedTestCase;
}
