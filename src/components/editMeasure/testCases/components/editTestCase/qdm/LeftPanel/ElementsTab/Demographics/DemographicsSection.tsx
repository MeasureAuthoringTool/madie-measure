import React, { useEffect, useState } from "react";
import ElementSection from "../../../../../common/UIOnlyModelAgnostic/ElementSection";
import { MadieTooltip, Select } from "@madie/madie-design-system/dist/react";
import FormControl from "@mui/material/FormControl";
import { DataElement, ValueSet } from "cqm-models";
import DateTimeInput from "../../../../../QDM/dateTimeInput/DateTimeInput";
import dayjs from "dayjs";
import "./DemographicsSection.scss";
import utc from "dayjs/plugin/utc";

// utils for
import {
  getBirthDateElement,
  getEthnicityDataElement,
  getGenderDataElement,
  getLivingStatusDataElement,
  getRaceDataElement,
  LIVING_STATUS_CODE_OPTIONS,
  PATIENT_CHARACTERISTIC_EXPIRED,
  getPatientCharacteristicExpiredDateElement,
  getValueSetsForDemographic,
  getDataElementByStatus,
} from "./DemographicsSectionConst";
import { MenuItem, Tooltip } from "@mui/material";
import {
  PatientActionType,
  useQdmPatient,
} from "../../../../../../util/QdmPatientContext";
import { useQdmExecutionContext } from "../../../../../routes/qdm/QdmExecutionContext";

export const DEMOGRAPHICS_WARNING_MESSAGE =
  "Your measure's Race, Sex, or Ethnicity value set has changed. The value in this test case is no longer valid. Please update the value to successfully match your measure.";

// Check if a DataElement's code exist in the corresponding ValueSet
const checkMismatch = (
  dataElement: DataElement,
  valueSets: Array<ValueSet>
): boolean => {
  if (!dataElement || !valueSets?.length) return false;
  // check if the dataElement's codeListId matches any valueSet OID
  const valueSet = valueSets.find((vs) => vs.oid === dataElement.codeListId);
  if (!valueSet) return true;

  // There is only one code if set
  const dataCode = dataElement?.dataElementCodes?.[0];
  const concepts = valueSet?.concepts;

  // If no code or no concepts, it a mismatch
  if (!dataCode || !concepts?.length) return true;

  // Check if the dataCode matches any concept in the valueSet
  return !concepts.some(
    (concept) =>
      concept.code === dataCode.code &&
      concept.system === dataCode.system &&
      concept.version === dataCode.version
  );
};

const DemographicsSection = ({ handleTestCaseWarnings, canEdit }) => {
  canEdit = true;
  dayjs.extend(utc);
  dayjs.utc().format(); // utc format
  const { state, dispatch } = useQdmPatient();
  const { patient } = state;
  // Access cqmMeasure from QdmExecutionContext
  const { cqmMeasureState, executionContextReady } = useQdmExecutionContext();
  const [cqmMeasure] = cqmMeasureState;
  // this will be local
  const [raceDataElement, setRaceDataElement] = useState<DataElement>();
  const [genderDataElement, setGenderDataElement] = useState<DataElement>();
  const [ethnicityDataElement, setEthnicityDataElement] =
    useState<DataElement>();
  const [livingStatusDataElement, setLivingStatusDataElement] =
    useState<DataElement>();

  // value sets for Demographics
  const genderValueSets = getValueSetsForDemographic(cqmMeasure, "gender");
  const raceValueSets = getValueSetsForDemographic(cqmMeasure, "race");
  const ethnicityValueSets = getValueSetsForDemographic(
    cqmMeasure,
    "ethnicity"
  );

  const selectOptions = (valueSets, includeDash = false) => {
    // Always render a single dash MenuItem if includeDash is true
    const options = includeDash
      ? [
          <MenuItem
            key="-"
            value=""
            aria-label="No selection"
            data-testid="dash-option"
          >
            -
          </MenuItem>,
        ]
      : [];

    // loading skeleton
    if (!executionContextReady) {
      options.push(
        <MenuItem value="" disabled>
          Loading...
        </MenuItem>
      );
    }

    if (!valueSets) {
      return options;
    }
    for (const valueSet of valueSets) {
      if (valueSet.concepts?.length) {
        const conceptOptions = valueSet.concepts
          .sort((a, b) =>
            a.display && b.display
              ? a.display.localeCompare(b.display)
              : a.localeCompare(b)
          )
          .map((opt, i) => {
            const { display } = opt || {};
            const sanitizedString = display
              ? display.replace(/"/g, "")
              : opt?.replace(/"/g, "");
            return (
              <MenuItem
                key={`${sanitizedString}-${i}`}
                value={`${sanitizedString}__${valueSet.oid}`} // append oid to identify which value set code belongs to
              >
                {sanitizedString}
              </MenuItem>
            );
          });

        options.push(...conceptOptions);
      }
    }
    return options;
  };

  // this populates the json making it able to be edited. we should only do this before change
  useEffect(() => {
    // save local patient
    if (patient) {
      const raceElement = getDataElementByStatus("race", patient);
      if (raceElement) {
        setRaceDataElement(raceElement);
      } else {
        setRaceDataElement(undefined);
      }

      const genderElement = getDataElementByStatus("gender", patient);
      if (genderElement) {
        setGenderDataElement(genderElement);
      } else {
        setGenderDataElement(undefined);
      }

      const ethnicity = getDataElementByStatus("ethnicity", patient);
      if (ethnicity) {
        setEthnicityDataElement(ethnicity);
      } else {
        setEthnicityDataElement(undefined);
      }

      const expiredElement = getDataElementByStatus("expired", patient);
      if (expiredElement) {
        expiredElement.dataElementCodes = PATIENT_CHARACTERISTIC_EXPIRED;
        setLivingStatusDataElement(expiredElement);
      } else {
        setLivingStatusDataElement("Living");
      }
    }
  }, [patient]);

  // Check if demographics selected are from one of the value sets of cqmMeasure
  if (cqmMeasure && executionContextReady) {
    const hasRaceMismatch = checkMismatch(raceDataElement, raceValueSets);

    const hasGenderMismatch = checkMismatch(genderDataElement, genderValueSets);

    const hasEthnicityMismatch = checkMismatch(
      ethnicityDataElement,
      ethnicityValueSets
    );

    if (hasRaceMismatch || hasGenderMismatch || hasEthnicityMismatch) {
      handleTestCaseWarnings(DEMOGRAPHICS_WARNING_MESSAGE);
    } else {
      handleTestCaseWarnings(null);
    }
  }

  const handleRaceChange = (event) => {
    const existingElement = getDataElementByStatus("race", patient);

    if (event.target.value === "") {
      setRaceDataElement(undefined);
      if (existingElement) {
        dispatch({
          type: PatientActionType.REMOVE_DATA_ELEMENT,
          payload: existingElement,
        });
      }
      return;
    }

    // Split the value to get code and oid
    const [code, oid] = event.target.value.split("__");
    const raceValueSet = raceValueSets.find((vs) => vs.oid === oid);
    const newRaceDataElement: DataElement = getRaceDataElement(
      code,
      raceValueSet,
      existingElement
    );
    setRaceDataElement(newRaceDataElement);
    dispatch({
      type: existingElement
        ? PatientActionType.MODIFY_DATA_ELEMENT
        : PatientActionType.ADD_DATA_ELEMENT,
      payload: newRaceDataElement,
    });
  };

  const handleGenderChange = (event) => {
    const existingElement = getDataElementByStatus("gender", patient);

    if (event.target.value === "") {
      setGenderDataElement(undefined);
      if (existingElement) {
        dispatch({
          type: PatientActionType.REMOVE_DATA_ELEMENT,
          payload: existingElement,
        });
      }
      return;
    }
    // Split the value to get code and oid
    const [code, oid] = event.target.value.split("__");
    const genderValueSet = genderValueSets.find((vs) => vs.oid === oid);
    const newGenderDataElement: DataElement = getGenderDataElement(
      code,
      genderValueSet,
      existingElement
    );
    setGenderDataElement(newGenderDataElement);
    dispatch({
      type: existingElement
        ? PatientActionType.MODIFY_DATA_ELEMENT
        : PatientActionType.ADD_DATA_ELEMENT,
      payload: newGenderDataElement,
    });
  };

  const handleEthnicityChange = (event) => {
    const existingElement = getDataElementByStatus("ethnicity", patient);

    if (event.target.value === "") {
      setEthnicityDataElement(undefined);
      if (existingElement) {
        dispatch({
          type: PatientActionType.REMOVE_DATA_ELEMENT,
          payload: existingElement,
        });
      }
      return;
    }
    // Split the value to get code and oid
    const [code, oid] = event.target.value.split("__");
    const ethnicityValueSet = ethnicityValueSets.find((vs) => vs.oid === oid);
    const newEthnicityDataElement: DataElement = getEthnicityDataElement(
      code,
      ethnicityValueSet,
      existingElement
    );
    setEthnicityDataElement(newEthnicityDataElement);
    dispatch({
      type: existingElement
        ? PatientActionType.MODIFY_DATA_ELEMENT
        : PatientActionType.ADD_DATA_ELEMENT,
      payload: newEthnicityDataElement,
    });
  };

  const handleLivingStatusChange = (event) => {
    if (event.target.value !== "Living") {
      const newLivingStatusDataElement: DataElement =
        getLivingStatusDataElement();
      setLivingStatusDataElement(newLivingStatusDataElement);
      dispatch({
        type: PatientActionType.ADD_DATA_ELEMENT,
        payload: newLivingStatusDataElement,
      });
    } else {
      setLivingStatusDataElement(event.target.value);
      const expiredElement = getDataElementByStatus("expired", patient);
      if (expiredElement) {
        dispatch({
          type: PatientActionType.REMOVE_DATA_ELEMENT,
          payload: expiredElement,
        });
      }
    }
  };

  const handleDateTimeChange = (val) => {
    const formatted = dayjs.utc(val).format();
    const existingElement = getDataElementByStatus("birthdate", patient);
    const newTimeElement = getBirthDateElement(formatted, existingElement);
    if (val) {
      dispatch({
        type: existingElement
          ? PatientActionType.MODIFY_DATA_ELEMENT
          : PatientActionType.ADD_DATA_ELEMENT,
        payload: newTimeElement,
      });
    } else {
      dispatch({
        type: PatientActionType.REMOVE_DATA_ELEMENT,
        payload: existingElement,
      });
    }
    dispatch({
      type: PatientActionType.SET_BIRTHDATETIME,
      payload: val,
    });
  };

  const handleExpiredDateTimeChange = (val) => {
    const expiredElement = getDataElementByStatus("expired", patient);
    const newExpiredElement: DataElement =
      getPatientCharacteristicExpiredDateElement(val, expiredElement);
    setLivingStatusDataElement(newExpiredElement);
    dispatch({
      type: PatientActionType.MODIFY_DATA_ELEMENT,
      payload: newExpiredElement,
    });
  };

  return (
    <div>
      <ElementSection
        title="Demographics"
        children={
          <div className="demographics-container">
            {/* container */}
            <div className={`demographics-row ${!canEdit ? "readonly" : ""}`}>
              <DateTimeInput
                label="Date of Birth"
                canEdit={canEdit}
                dateTime={
                  patient?.birthDatetime ? dayjs(patient?.birthDatetime) : null
                }
                attributeName="DateTime"
                onDateTimeChange={(newValue) => {
                  handleDateTimeChange(newValue);
                }}
              />
              <FormControl>
                <Select
                  id="demographics-living-status-selector"
                  defaultValue="Living"
                  label="Living Status"
                  readOnly={!canEdit}
                  inputProps={{
                    "data-testid": `demographics-living-status-input`,
                  }}
                  value={
                    livingStatusDataElement?.qdmStatus === "expired"
                      ? "Expired"
                      : "Living"
                  }
                  onChange={handleLivingStatusChange}
                  options={LIVING_STATUS_CODE_OPTIONS.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                ></Select>
              </FormControl>

              {livingStatusDataElement?.qdmStatus === "expired" && (
                <FormControl>
                  <DateTimeInput
                    label="Date/Time Expiration"
                    canEdit={canEdit}
                    dateTime={
                      livingStatusDataElement?.expiredDatetime
                        ? dayjs(livingStatusDataElement?.expiredDatetime)
                        : null
                    }
                    attributeName="DateTime"
                    onDateTimeChange={(e) => {
                      handleExpiredDateTimeChange(e);
                    }}
                  />
                </FormControl>
              )}

              <FormControl>
                <Tooltip
                  title={`Code System Version: ${
                    raceValueSets?.[0]?.concepts?.[0]?.version ??
                    "not available"
                  }`}
                  data-testid={`demographics-race-tooltip`}
                >
                  <span>
                    <Select
                      id="demographics-race-selector"
                      label="Race"
                      readOnly={!canEdit}
                      inputProps={{
                        "data-testid": `demographics-race-input`,
                      }}
                      value={
                        raceDataElement?.dataElementCodes?.[0].display ?? ""
                      }
                      placeHolder={{ name: "Select a Race", value: "" }}
                      onChange={handleRaceChange}
                      options={selectOptions(raceValueSets, true)}
                    ></Select>
                  </span>
                </Tooltip>
              </FormControl>
              <FormControl>
                <Tooltip
                  title={`Code System Version: ${
                    genderValueSets?.[0]?.concepts?.[0]?.version ??
                    "not available"
                  }`}
                  data-testid={`demographics-gender-tooltip`}
                >
                  <span>
                    <Select
                      id="demographics-gender-selector"
                      label="Sex"
                      readOnly={!canEdit}
                      inputProps={{
                        "data-testid": `demographics-gender-input`,
                      }}
                      value={
                        genderDataElement?.dataElementCodes?.[0].display ?? ""
                      }
                      placeHolder={{ name: "Select a Gender", value: "" }}
                      onChange={handleGenderChange}
                      options={selectOptions(genderValueSets, true)}
                    ></Select>
                  </span>
                </Tooltip>
              </FormControl>
            </div>
            <div className="demographics-row">
              <FormControl>
                <Tooltip
                  title={`Code System Version: ${
                    ethnicityValueSets?.[0]?.concepts?.[0]?.version ??
                    "not available"
                  }`}
                  data-testid={`demographics-ethnicity-tooltip`}
                >
                  <span>
                    <Select
                      id="demographics-ethnicity-selector"
                      label="Ethnicity"
                      className="demographics-ethnicity"
                      readOnly={!canEdit}
                      inputProps={{
                        "data-testid": `demographics-ethnicity-input`,
                      }}
                      value={
                        ethnicityDataElement?.dataElementCodes?.[0].display ??
                        ""
                      }
                      placeHolder={{ name: "Select an Ethnicity", value: "" }}
                      onChange={handleEthnicityChange}
                      options={selectOptions(ethnicityValueSets, true)}
                    ></Select>
                  </span>
                </Tooltip>
              </FormControl>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default DemographicsSection;
