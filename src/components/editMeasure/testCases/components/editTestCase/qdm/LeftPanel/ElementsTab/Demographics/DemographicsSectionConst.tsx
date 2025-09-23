import {
  Measure,
  QDMPatient,
  DataElement,
  DataElementCode,
  PatientCharacteristicRace,
  PatientCharacteristicEthnicity,
  PatientCharacteristicBirthdate,
  PatientCharacteristicSex,
  PatientCharacteristicExpired,
} from "cqm-models";

export const BIRTHDATE_CODE: DataElementCode = {
  code: "21112-8",
  system: "2.16.840.1.113883.6.1",
  version: undefined,
  display: "Birth date",
};

export const LIVING_STATUS_CODE_OPTIONS = ["Living", "Expired"];
export const PATIENT_CHARACTERISTIC_EXPIRED: DataElementCode = {
  code: "419099009",
  system: "2.16.840.1.113883.6.96",
  version: "2022-09",
  display: "Dead (finding)",
};
export const getPatientCharacteristicExpiredDateElement = (
  value,
  existingElement: DataElement
): DataElement => {
  const expired: DataElement = existingElement
    ? new PatientCharacteristicExpired(existingElement)
    : new PatientCharacteristicExpired();
  expired.expiredDatetime = value;
  expired.dataElementCodes = [PATIENT_CHARACTERISTIC_EXPIRED];
  return expired;
};

export const getBirthDateElement = (
  value,
  existingElement: DataElement
): DataElement => {
  const pcb: DataElement = existingElement
    ? new PatientCharacteristicBirthdate(existingElement)
    : new PatientCharacteristicBirthdate();
  pcb.birthDatetime = value;
  pcb.dataElementCodes = [BIRTHDATE_CODE];
  return pcb;
};

// given a value, return a data element
export const getRaceDataElement = (
  value: string,
  raceValueSet,
  existingElement: DataElement
): DataElement => {
  const newCode: DataElementCode = getNewCode(raceValueSet.concepts, value);
  const pcr: DataElement = existingElement
    ? new PatientCharacteristicRace(existingElement)
    : new PatientCharacteristicRace();
  pcr.description = `${pcr.qdmTitle}: ${raceValueSet.name}`;
  pcr.dataElementCodes = [newCode];
  pcr.codeListId = raceValueSet.oid;
  return pcr;
};

export const getGenderDataElement = (
  value: string,
  genderValueSet,
  existingElement: DataElement
): DataElement => {
  const newCode: DataElementCode = getNewCode(genderValueSet?.concepts, value);
  const pcs: DataElement = existingElement
    ? new PatientCharacteristicSex(existingElement)
    : new PatientCharacteristicSex();
  pcs.description = `${pcs.qdmTitle}: ${genderValueSet.name}`;
  pcs.dataElementCodes = [newCode];
  pcs.codeListId = genderValueSet.oid;
  return pcs;
};

export const getEthnicityDataElement = (
  value: string,
  ethnicityValueSet,
  existingElement: DataElement
): DataElement => {
  const newCode: DataElementCode = getNewCode(
    ethnicityValueSet.concepts,
    value
  );
  const pce: DataElement = existingElement
    ? new PatientCharacteristicEthnicity(existingElement)
    : new PatientCharacteristicEthnicity();
  pce.description = `${pce.qdmTitle}: ${ethnicityValueSet.name}`;
  pce.dataElementCodes = [newCode];
  pce.codeListId = ethnicityValueSet.oid;
  return pce;
};

export const getLivingStatusDataElement = (): DataElement => {
  const pce: DataElement = new PatientCharacteristicExpired();
  pce.dataElementCodes = [PATIENT_CHARACTERISTIC_EXPIRED];
  return pce;
};

export const getNewCode = (options, selectedValue: string) => {
  const found = options.find((option) => selectedValue === option.display);
  const newCode: DataElementCode = {
    code: found?.code,
    system: found?.system,
    version: found?.version,
    display: found?.display,
  };
  return newCode;
};

export const getDataElementByStatus = (status: string, patient: QDMPatient) => {
  return patient?.dataElements?.find(
    (element) => element?.qdmStatus === status
  );
};

export const getValueSetsForDemographic = (
  cqmMeasure: Measure,
  demographicType: string
) => {
  const sourceDataCriteria = cqmMeasure?.source_data_criteria
    ?.filter((criteria) => criteria?.qdmStatus === demographicType)
    ?.map((criteria) => criteria.codeListId);
  if (!sourceDataCriteria) {
    return null;
  }
  const valueSets = cqmMeasure?.value_sets
    ?.filter((valueSet) => sourceDataCriteria.includes(valueSet.oid))
    .map((valueSet) => ({
      name: valueSet?.display_name,
      oid: valueSet?.oid,
      concepts: valueSet?.concepts.map((concept) => {
        return {
          system: concept?.code_system_oid,
          version: concept?.code_system_version,
          code: concept?.code,
          display: concept?.display_name,
        };
      }),
    }));
  if (!valueSets) {
    return null;
  }
  return valueSets;
};
