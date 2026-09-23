import { Model, TestCase } from "@madie/madie-models";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";

export const FHIR_PATIENT_PROFILE =
  "http://hl7.org/fhir/StructureDefinition/Patient";
export const QICORE_PATIENT_PROFILE =
  "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient";
export const US_QUALITY_CORE_PATIENT_PROFILE =
  "http://fhir.org/guides/onc/us-quality-core/StructureDefinition/us-quality-core-patient";
//Switch here so that we can easily implement new profiles later
export function getDefaultFhirPatientProfile(model?: string) {
  switch (model) {
    case Model.QICORE:
    case Model.QICORE_6_0_0:
    case Model.QICORE_7_0_2:
      return QICORE_PATIENT_PROFILE;
    case Model.US_QUALITY_0_5_0:
      return US_QUALITY_CORE_PATIENT_PROFILE;
    default:
      return FHIR_PATIENT_PROFILE;
  }
}

export function buildDefaultFhirPatientBundle(
  patientProfile = FHIR_PATIENT_PROFILE
) {
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
            profile: [patientProfile],
          },
        },
      },
    ],
  };
}

export function defaultFhirTestCaseJson(
  testCase: TestCase,
  patientProfile = FHIR_PATIENT_PROFILE
) {
  if (_.isNil(testCase)) {
    return;
  }
  const clonedTestCase = _.cloneDeep(testCase);
  if (_.isEmpty(clonedTestCase.json)) {
    clonedTestCase.json = JSON.stringify(
      buildDefaultFhirPatientBundle(patientProfile)
    );
  }
  return clonedTestCase;
}

export function buildDefaultQiCorePatientBundle() {
  return buildDefaultFhirPatientBundle(QICORE_PATIENT_PROFILE);
}

export function defaultQiCoreTestCaseJson(testCase: TestCase) {
  return defaultFhirTestCaseJson(testCase, QICORE_PATIENT_PROFILE);
}
