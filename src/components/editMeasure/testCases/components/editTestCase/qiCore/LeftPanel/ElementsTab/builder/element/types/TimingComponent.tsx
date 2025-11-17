import React, { useState } from "react";
import { getIn, useFormikContext } from "formik";
import { TypeComponentProps } from "./TypeComponentProps";
import DecimalInput from "../../../../../../../common/DecimalInput/DecimalInput";
import CodesComponent from "./CodesComponent";
import IntegerComponent, { IntegerType } from "./IntegerComponent";
import { camelCase } from "lodash";
import TimeComponent from "./TimeComponent";
import DateTimeComponent from "./DateTimeComponent";
import { MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import StringComponent from "./StringComponent";
import PeriodDateTimeComponent from "./PeriodDateTimeComponent";
import "./TimingComponent.scss";
import RangeComponent from "./RangeComponent";
import ElementSection from "../../../../../../../common/UIOnlyModelAgnostic/ElementSection";
import CodeableConceptComponent from "./CodeableConceptComponent";

const GROUP_GAP = "1.5rem";
const boundsOptions = ["-", "Duration", "Range", "Period"];

const TimingComponent = ({
  label,
  canEdit,
  resource,
  structureDefinition,
  fieldRequired,
}: TypeComponentProps) => {
  const formik = useFormikContext();

  const handleAddElement = (path: string) => {
    formik.setFieldValue(path, [...(getIn(formik.values, path) || [""]), ""]);
  };

  const eventArrayPath = `${label}.event`;
  const eventValues = getIn(formik.values, eventArrayPath) || [""];

  const boundsRangePath = `${label}.repeat.boundsRange`;
  const boundsPeriodPath = `${label}.repeat.boundsPeriod`;

  const countPath = `${label}.repeat.count`;
  const countMaxPath = `${label}.repeat.countMax`;

  const durationPath = `${label}.repeat.duration`;
  const durationMaxPath = `${label}.repeat.durationMax`;
  const durationUnitPath = `${label}.repeat.durationUnit`;

  const frequencyPath = `${label}.repeat.frequency`;
  const frequencyMaxPath = `${label}.repeat.frequencyMax`;

  const periodPath = `${label}.repeat.period`;
  const periodMaxPath = `${label}.repeat.periodMax`;
  const periodUnitPath = `${label}.repeat.periodUnit`;

  const dayOfWeekArrayPath = `${label}.repeat.dayOfWeek`;
  const dayOfWeekValues = getIn(formik.values, dayOfWeekArrayPath) || [""];

  const timeOfDayArrayPath = `${label}.repeat.timeOfDay`;
  const timeOfDayValues = getIn(formik.values, timeOfDayArrayPath) || [""];

  const whenArrayPath = `${label}.repeat.when`;
  const whenValues = getIn(formik.values, whenArrayPath) || [""];

  const offsetPath = `${label}.repeat.offset`;

  const codePath = `${label}.code`;

  const [boundsValue, setBoundsValue] = useState(() => {
    if (getIn(formik.values, boundsRangePath)) return "Range";
    if (getIn(formik.values, boundsPeriodPath)) return "Period";
    return "-";
  });

  return (
    <ElementSection title={"Timing"} startOpen={false}>
      <div id="timing-component">
        {/* Event */}
        {eventValues.map((_, index) => (
          <DateTimeComponent
            key={`${eventArrayPath}-${index}`}
            label={`Event[${index}]`}
            canEdit={canEdit}
            fieldRequired={false}
            showAddAttributeButton={index === eventValues.length - 1}
            addTitle={"Event"}
            handleAddElement={() => handleAddElement(eventArrayPath)}
            {...formik.getFieldProps(`${eventArrayPath}[${index}]`)}
            onChange={(value) => {
              formik.setFieldTouched(`${eventArrayPath}[${index}]`);
              formik.setFieldValue(`${eventArrayPath}[${index}]`, value);
            }}
            setTouched={() => {
              formik.setFieldTouched(`${eventArrayPath}[${index}]`);
            }}
          />
        ))}

        {/* Bounds */}
        <div className={"repeat-bounds"}>
          <Select
            label="Repeat.Bounds"
            id="repeat-bounds"
            inputProps={{ "data-testid": "repeat-bounds-input" }}
            data-testid="repeat-bounds"
            readOnly={!canEdit}
            size="small"
            value={boundsValue}
            onChange={(e) => {
              const selectedBounds = e.target.value;

              setBoundsValue(selectedBounds);

              // Clear all Formik bound fields whenever selection changes
              formik.setFieldValue(boundsRangePath, undefined);
              formik.setFieldValue(boundsPeriodPath, undefined);
            }}
            options={boundsOptions.map((boundsOption, i) => (
              <MenuItem
                key={`${boundsOption}-${i}`}
                data-testid={`${camelCase(boundsOption)}-option`}
                value={boundsOption}
              >
                {boundsOption}
              </MenuItem>
            ))}
          />
        </div>

        {boundsValue === "Duration" && (
          <StringComponent
            label="Duration"
            fieldRequired={fieldRequired}
            canEdit={false}
            value="Not supported"
          />
        )}

        {boundsValue === "Range" && (
          <RangeComponent
            canEdit={canEdit}
            label={boundsRangePath}
            structureDefinition={structureDefinition}
            fieldRequired={false}
          />
        )}

        {boundsValue === "Period" && (
          <PeriodDateTimeComponent
            label="Period"
            fieldRequired={false}
            canEdit={canEdit}
            value={getIn(formik.values, boundsPeriodPath) || {}}
            onChange={(value) => {
              formik.setFieldValue(boundsPeriodPath, value);
            }}
          />
        )}

        {/* Count + CountMax row */}
        <div style={{ display: "flex", gap: GROUP_GAP }}>
          <div style={{ display: "flex" }}>
            <div className="decimal-input">
              <IntegerComponent
                label="Repeat.Count"
                canEdit={canEdit}
                integerType={IntegerType.POSITIVE_INT}
                fieldRequired={false}
                {...formik.getFieldProps(countPath)}
              />
            </div>

            <div className="decimal-input">
              <IntegerComponent
                label="Repeat.CountMax"
                canEdit={canEdit}
                integerType={IntegerType.POSITIVE_INT}
                fieldRequired={false}
                {...formik.getFieldProps(countMaxPath)}
              />
            </div>
          </div>

          {/* Duration + Duration Max + Unit(s) row */}
          <div style={{ display: "flex" }}>
            <div className="decimal-input">
              <DecimalInput
                label="Repeat.Duration"
                value={getIn(formik.values, durationPath)}
                handleChange={(val) =>
                  formik.setFieldValue(
                    durationPath,
                    val !== "" ? parseFloat(val) : null
                  )
                }
                canEdit={canEdit}
                required={false}
                placeholder=""
              />
            </div>

            <div className="decimal-input">
              <DecimalInput
                label="Repeat.DurationMax"
                value={getIn(formik.values, durationMaxPath)}
                handleChange={(val) =>
                  formik.setFieldValue(
                    durationMaxPath,
                    val !== "" ? parseFloat(val) : null
                  )
                }
                canEdit={canEdit}
                required={false}
                placeholder=""
              />
            </div>

            <div className="repeat-unit" data-testid="repeat-duration-unit">
              <CodesComponent
                label="Repeat.Unit(s)"
                resource={resource}
                structureDefinition={{
                  path: label,
                  binding: {
                    valueSet: "http://hl7.org/fhir/ValueSet/units-of-time",
                    strength: "required",
                  },
                }}
                value={getIn(formik.values, durationUnitPath)}
                onChange={(val) => formik.setFieldValue(durationUnitPath, val)}
                canEdit={canEdit}
                fieldRequired={false}
              />
            </div>
          </div>
        </div>

        {/* Frequency + Frequency Max row */}
        <div style={{ display: "flex", gap: GROUP_GAP }}>
          <div style={{ display: "flex" }}>
            <div className="decimal-input">
              <IntegerComponent
                label="Repeat.Frequency"
                canEdit={canEdit}
                integerType={IntegerType.POSITIVE_INT}
                fieldRequired={false}
                {...formik.getFieldProps(frequencyPath)}
              />
            </div>

            <div className="decimal-input">
              <IntegerComponent
                label="Repeat.FrequencyMax"
                canEdit={canEdit}
                integerType={IntegerType.POSITIVE_INT}
                fieldRequired={false}
                {...formik.getFieldProps(frequencyMaxPath)}
              />
            </div>
          </div>

          {/* Period + Period Max + Unit(s) row */}
          <div style={{ display: "flex" }}>
            <div className="decimal-input">
              <DecimalInput
                label="Repeat.Period"
                value={getIn(formik.values, periodPath)}
                handleChange={(val) =>
                  formik.setFieldValue(
                    periodPath,
                    val !== "" ? parseFloat(val) : null
                  )
                }
                canEdit={canEdit}
                required={false}
                placeholder=""
              />
            </div>
            <div className="decimal-input">
              <DecimalInput
                label="Repeat.PeriodMax"
                value={getIn(formik.values, periodMaxPath)}
                handleChange={(val) =>
                  formik.setFieldValue(
                    periodMaxPath,
                    val !== "" ? parseFloat(val) : null
                  )
                }
                canEdit={canEdit}
                required={false}
                placeholder=""
              />
            </div>
            <div className="repeat-unit" data-testid="repeat-period-unit">
              <CodesComponent
                label="Repeat.Unit(s)"
                resource={resource}
                structureDefinition={{
                  path: label,
                  binding: {
                    valueSet: "http://hl7.org/fhir/ValueSet/units-of-time",
                    strength: "required",
                  },
                }}
                value={getIn(formik.values, periodUnitPath)}
                onChange={(val) => formik.setFieldValue(periodUnitPath, val)}
                canEdit={canEdit}
                fieldRequired={false}
              />
            </div>
          </div>
        </div>

        {/* Day of Week */}
        {dayOfWeekValues.map((_, index) => (
          <CodesComponent
            key={`${dayOfWeekArrayPath}-${index}`}
            label={`Repeat.Day of Week[${index}]`}
            resource={resource}
            structureDefinition={{
              path: label,
              binding: {
                valueSet: "http://hl7.org/fhir/ValueSet/days-of-week",
                strength: "required",
              },
            }}
            value={getIn(formik.values, `${dayOfWeekArrayPath}[${index}]`)}
            onChange={(val) =>
              formik.setFieldValue(`${dayOfWeekArrayPath}[${index}]`, val)
            }
            canEdit={canEdit}
            fieldRequired={false}
            showAddAttributeButton={index === dayOfWeekValues.length - 1}
            addTitle="Repeat.Day of Week"
            handleAddElement={() => handleAddElement(dayOfWeekArrayPath)}
          />
        ))}

        {/* Time of Day */}
        {timeOfDayValues.map((_, index) => (
          <TimeComponent
            key={`${timeOfDayArrayPath}-${index}`}
            label={`Repeat.Time of Day[${index}]`}
            canEdit={canEdit}
            fieldRequired={false}
            showAddAttributeButton={index === timeOfDayValues.length - 1}
            addTitle="Repeat.Time of Day"
            handleAddElement={() => handleAddElement(timeOfDayArrayPath)}
            {...formik.getFieldProps(`${timeOfDayArrayPath}[${index}]`)}
            onChange={(value) =>
              formik.setFieldValue(`${timeOfDayArrayPath}[${index}]`, value)
            }
          />
        ))}

        {/* When */}
        {whenValues.map((_, index) => (
          <CodesComponent
            key={`${whenArrayPath}-${index}`}
            label={`Repeat.When[${index}]`}
            resource={resource}
            structureDefinition={{
              path: label,
              binding: {
                valueSet: "http://hl7.org/fhir/ValueSet/event-timing",
                strength: "required",
              },
            }}
            value={getIn(formik.values, `${whenArrayPath}[${index}]`)}
            onChange={(val) =>
              formik.setFieldValue(`${whenArrayPath}[${index}]`, val)
            }
            canEdit={canEdit}
            fieldRequired={false}
            showAddAttributeButton={index === whenValues.length - 1}
            addTitle="Repeat.When"
            handleAddElement={() => handleAddElement(whenArrayPath)}
          />
        ))}

        {/* Offset */}
        <div className="repeat-offset">
          <IntegerComponent
            label="Repeat.Offset"
            canEdit={canEdit}
            integerType={IntegerType.UNSIGNED}
            fieldRequired={false}
            {...formik.getFieldProps(offsetPath)}
          />
        </div>

        {/* Code */}
        <CodeableConceptComponent
          label="Code"
          canEdit={canEdit}
          structureDefinition={{
            path: label,
            binding: {
              valueSet: "http://hl7.org/fhir/ValueSet/timing-abbreviation",
              strength: "preferred",
            },
          }}
          showAddAttributeButton={false}
          addTitle={null}
          value={getIn(formik.values, codePath)}
          onChange={(value) => {
            formik.setFieldTouched(codePath);
            formik.setFieldValue(codePath, value);
          }}
        />
      </div>
    </ElementSection>
  );
};

export default TimingComponent;
