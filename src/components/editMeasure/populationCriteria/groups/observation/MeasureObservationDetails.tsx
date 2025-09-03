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
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import camelCaseConverter from "../../../../../utils/camelCaseConverter";

const AGGREGATE_FUNCTIONS = Array.from(AGGREGATE_FUNCTION_KEYS.keys()).sort();

export interface MeasureObservationProps {
  required: boolean;
  ratio: boolean;
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
  ratio = false,
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
        <div className="population-column">
          <Select
            placeHolder={{ name: "Select Observation", value: "" }}
            required={required}
            SelectDisplayProps={{
              "aria-required": required ? true : false,
            }}
            readOnly={!canEdit}
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
          <RichTextEditor
            label={
              label ? `${camelCaseConverter(label)} Description` : undefined
            }
            required={required}
            id={`${name}-observation-description`}
            readOnly={!canEdit}
            content={measureObservation?.description || ""}
            onChange={(value: string) => {
              if (onChange) {
                onChange({
                  ...measureObservation,
                  description: value,
                });
              }
            }}
          />
        </div>
      </div>
      <div className="second" style={{ width: 300 }}>
        <Select
          placeHolder={{ name: "Select Aggregate Function", value: "" }}
          readOnly={!canEdit}
          required={required}
          label="Aggregate Function"
          id={`measure-observation-aggregate-${name}`}
          data-testid={`select-measure-observation-aggregate-${name}`}
          inputProps={{
            "data-testid": `measure-observation-aggregate-${name}-input`,
          }}
          value={measureObservation?.aggregateMethod || ""}
          error={!!errors?.aggregateMethod}
          helperText={errors?.aggregateMethod}
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
      {/* required fields can be removed, but only for ratio measures */}
      {ratio && canEdit && (
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
