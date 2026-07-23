import React, { useEffect, useState } from "react";
import DateTimeInput from "../../../../../../../QDM/dateTimeInput/DateTimeInput";
import DateTimeInterval from "../../../../../../../QDM/dateTimeInterval/DateTimeInterval";
import { QDMDate } from "cqm-models";
import "./Timing.scss";
import { PRIMARY_TIMING_ATTRIBUTES } from "../../../../../../../../util/QdmAttributeHelpers";
import * as _ from "lodash";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { InputLabel } from "@mui/material";
import { labelStyle } from "./TimingStyles";

export const MEDICATION_ACTIVE_TYPE = "QDM::MedicationActive";
export const TIMING_TOOLTIP =
  "Only Relevant Date Time or Relevant Period can be entered, not both.";
export const TIMING_WARNING = `${TIMING_TOOLTIP} Please clear one timing out.`;

const Timing = ({ canEdit, onChange, selectedDataElement }) => {
  const handleChange = (newValue, attributeName) => {
    if (newValue === null || newValue === undefined) {
      selectedDataElement.set(attributeName, undefined);
    } else {
      selectedDataElement.set(attributeName, newValue);
    }
    onChange(selectedDataElement);
  };

  // Tracks in-progress content for the two Medication, Active timings, including
  // partial/invalid entries that never get persisted to the model. Without this,
  // typing an invalid date (e.g. "02/12") leaves the model empty and both timings
  // would remain editable.
  const [periodHasInput, setPeriodHasInput] = useState(false);
  const [datetimeHasInput, setDatetimeHasInput] = useState(false);

  // Reset the pending-input flags whenever a different element is selected.
  useEffect(() => {
    setPeriodHasInput(false);
    setDatetimeHasInput(false);
  }, [selectedDataElement?.id]);

  // This "either/or" rule only applies to Medication, Active, so scope the whole
  // calculation to that type and leave the flags disabled/false for every other element.
  const isMedicationActive =
    selectedDataElement?._type === MEDICATION_ACTIVE_TYPE;
  let bothTimingsPresent = false;
  let disableRelevantPeriod = false;
  let disableRelevantDatetime = false;

  if (isMedicationActive) {
    const relevantPeriod = selectedDataElement?.get?.("relevantPeriod");
    const relevantDatetime = selectedDataElement?.get?.("relevantDatetime");
    // for valid values in the model.
    const relevantPeriodHasValue = !!(
      relevantPeriod &&
      (relevantPeriod.low || relevantPeriod.high)
    );
    const relevantDatetimeHasValue = !!relevantDatetime;

    // "Both present" (legacy data) is based only on persisted values so a partial
    // entry doesn't spuriously trigger the warning.
    bothTimingsPresent = relevantPeriodHasValue && relevantDatetimeHasValue;

    // consider persisted values OR any in-progress including invalid input in the field.
    const relevantPeriodHasInput = relevantPeriodHasValue || periodHasInput;
    const relevantDatetimeHasInput =
      relevantDatetimeHasValue || datetimeHasInput;

    // Only disable the "other" timing when a single timing has been entered.
    // When both already exist (legacy data) leave both enabled and warn instead.
    disableRelevantPeriod = relevantDatetimeHasInput && !bothTimingsPresent;
    disableRelevantDatetime = relevantPeriodHasInput && !bothTimingsPresent;
  }

  const dateFormatToDisplay = (date) => {
    if (date) {
      const currentDate = dayjs();
      return dayjs(currentDate)
        .set("year", date?.year)
        .set("month", date?.month - 1)
        .set("date", date?.day);
    }
    return;
  };

  const displayTiming = () => {
    const displayTimingArray = [];
    for (const attr of PRIMARY_TIMING_ATTRIBUTES) {
      const timingAttr = selectedDataElement?.schema?.paths?.[attr];
      if (timingAttr) {
        if (timingAttr.instance == "Interval") {
          const disabled =
            timingAttr.path === "relevantPeriod" && disableRelevantPeriod;
          displayTimingArray.push(
            <div style={{ paddingRight: "30px", paddingBottom: "12px" }}>
              <DateTimeInterval
                label={_.startCase(timingAttr.path)}
                dateTimeInterval={selectedDataElement.get(timingAttr.path)}
                onDateTimeIntervalChange={handleChange}
                canEdit={canEdit}
                attributeName={timingAttr.path}
                disabled={disabled}
                tooltipText={disabled ? TIMING_TOOLTIP : undefined}
                onInputChange={
                  isMedicationActive && timingAttr.path === "relevantPeriod"
                    ? setPeriodHasInput
                    : undefined
                }
              />
            </div>
          );
        } else if (timingAttr.instance == "DateTime") {
          const disabled =
            timingAttr.path === "relevantDatetime" && disableRelevantDatetime;
          displayTimingArray.push(
            <div style={{ paddingRight: "30px", paddingBottom: "12px" }}>
              <DateTimeInput
                label={_.startCase(timingAttr.path)}
                canEdit={canEdit}
                dateTime={selectedDataElement.get(timingAttr.path)}
                onDateTimeChange={handleChange}
                attributeName={timingAttr.path}
                disabled={disabled}
                tooltipText={disabled ? TIMING_TOOLTIP : undefined}
                onInputChange={
                  isMedicationActive && timingAttr.path === "relevantDatetime"
                    ? setDatetimeHasInput
                    : undefined
                }
              />
            </div>
          );
        } else if (timingAttr.instance === "Date") {
          displayTimingArray.push(
            <div style={{ paddingRight: "30px" }}>
              <InputLabel
                htmlFor={"date-picker"}
                style={{ marginBottom: 8, height: 16 }} // force a heignt
                sx={labelStyle}
              >
                {_.startCase(timingAttr.path)}
              </InputLabel>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  className="datePicker"
                  disabled={!canEdit}
                  value={
                    dateFormatToDisplay(
                      selectedDataElement.get(timingAttr.path)
                    ) || null
                  }
                  onChange={(newValue: any) => {
                    const newDate = new QDMDate().cast({
                      year: newValue.$y,
                      month: newValue.$M + 1,
                      day: newValue.$D,
                    });
                    handleChange(newDate, timingAttr.path);
                  }}
                />
              </LocalizationProvider>
            </div>
          );
        }
      }
    }

    return displayTimingArray;
  };

  return (
    <>
      <h4>Timing</h4>
      <div className="box">{displayTiming()}</div>
      {bothTimingsPresent && (
        <div
          className="timing-warning"
          data-testid="timing-warning"
          role="alert"
          style={{ color: "#D92F2F", paddingBottom: "12px" }}
        >
          {TIMING_WARNING}
        </div>
      )}
    </>
  );
};

export default Timing;
