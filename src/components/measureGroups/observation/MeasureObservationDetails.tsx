import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { MenuItem } from "@mui/material";
import {
  MeasureObservation,
  AGGREGATE_FUNCTION_KEYS,
} from "@madie/madie-models";
import {
  DSLink,
  Select,
  TextArea,
} from "@madie/madie-design-system/dist/react";
import camelCaseConverter from "../../../utils/camelCaseConverter";

const AGGREGATE_FUNCTIONS = Array.from(AGGREGATE_FUNCTION_KEYS.keys()).sort();

export interface MeasureObservationProps {
  required: boolean;
  name: string;
  elmJson: string;
  measureObservation: MeasureObservation;
  label?: string;
  onChange?: (measureObservation) => void;
  onRemove?: (measureObservation) => void;
  canEdit: boolean;
  errors;
}

const MeasureObservationDetails = ({
  required = false,
  name,
  label,
  elmJson,
  measureObservation,
  onChange,
  onRemove,
  canEdit,
  errors,
}: MeasureObservationProps) => {
  const [cqlFunctionNames, setCqlFunctionNames] = useState([]);
  useEffect(() => {
    if (elmJson) {
      const elm = JSON.parse(elmJson);
      const functions = elm.library?.statements?.def
        ?.filter((s) => s.type === "FunctionDef")
        .map((s) => s.name);
      setCqlFunctionNames(functions ? functions : []);
    }
  }, [elmJson]);

  // todo elmJson doesn't have any functions
  return (
    <>
      <div className="first">
        <div className="population-col-gap-24">
          <Select
            placeHolder={{ name: "Select Observation", value: "" }}
            required={required}
            disabled={!canEdit}
            label={label ? label : "Observation"}
            id={`measure-observation-${name}`}
            data-testid={`select-measure-observation-${name}`}
            inputProps={{
              "data-testid": `measure-observation-${name}-input`,
            }}
            error={!!errors?.definition}
            helperText={errors?.definition}
            value={measureObservation?.definition || ""}
            onChange={(e) => {
              if (onChange) {
                onChange({
                  ...measureObservation,
                  definition: e.target.value,
                });
              }
            }}
            options={[
              !required && (
                <MenuItem key="-" value="">
                  -
                </MenuItem>
              ),
              ...cqlFunctionNames.map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              )),
            ]}
          />
          <TextArea
            id={`${name}-description`}
            data-testid={`${name}-description`}
            name={`${name} Description`}
            label={
              label ? `${camelCaseConverter(label)} Description` : undefined
            }
            placeholder="-"
            // to do: input following props
            value={measureObservation?.description || ""}
            onChange={(e) => {
              if (onChange) {
                onChange({
                  ...measureObservation,
                  description: e.target.value,
                });
              }
            }}
            inputProps={{ "data-testid": `${name}-description` }}
          />
        </div>
      </div>
      <div className="second" style={{ width: 300 }}>
        <Select
          placeHolder={{ name: "Select Aggregate Function", value: "" }}
          disabled={!canEdit}
          required={required}
          label="Aggregate Function"
          id={`measure-observation-aggregate-${name}`}
          data-testid={`select-measure-observation-aggregate-${name}`}
          inputProps={{
            "data-testid": `measure-observation-aggregate-${name}-input`,
          }}
          value={measureObservation?.aggregateMethod || ""}
          onChange={(e) => {
            if (onChange) {
              onChange({
                ...measureObservation,
                aggregateMethod: e.target.value,
              });
            }
          }}
          size="small"
          options={[
            !required && (
              <MenuItem key="-" value="">
                -
              </MenuItem>
            ),
            ...AGGREGATE_FUNCTIONS.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            )),
          ]}
        />
      </div>
      {!required && canEdit && (
        <div className="add-population-button remove">
          <DSLink
            className="madie-link remove"
            href=""
            variant="text"
            onClick={(e) => {
              e.preventDefault();
              if (onRemove) {
                onRemove(measureObservation);
              }
            }}
            data-testid={`measure-observation-${name}-remove`}
          >
            Remove
          </DSLink>
        </div>
      )}
    </>
  );
};

export default MeasureObservationDetails;
