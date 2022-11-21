import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { MenuItem } from "@mui/material";
import {
  MeasureObservation,
  AGGREGATE_FUNCTION_KEYS,
} from "@madie/madie-models";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";

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
  const FieldLabel = tw.label`block capitalize text-sm font-medium text-slate-90`;
  // todo elmJson doesn't have any functions
  return (
    <>
      <div tw="relative">
        {!required && canEdit && (
          <DSLink
            className="madie-link"
            style={{
              position: "absolute",
              left: "13rem",
              bottom: "2.5rem",
              zIndex: "1",
            }}
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
        )}
        {canEdit && (
          <Select
            placeHolder={{ name: "-", value: "" }}
            required={required}
            label={label ? label : "Observation"}
            id={`measure-observation-${name}`}
            data-testid={`select-measure-observation-${name}`}
            inputProps={{
              "data-testid": `measure-observation-${name}-input`,
            }}
            style={{ width: 300 }}
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
        )}
        {!canEdit && (
          <div>
            <FieldLabel
              htmlFor={`select-measure-observation-${name}-disabled`}
              data-testid={`select-measure-observation-${name}-disabled`}
            >
              {label ? label : "Observation"}
            </FieldLabel>
            {measureObservation?.definition || ""}
          </div>
        )}
      </div>
      <div tw="pb-3 px-8 pt-6">
        {canEdit && (
          <Select
            placeHolder={{ name: "-", value: "" }}
            disabled={!canEdit}
            required={required}
            label="Aggregate Function"
            id={`measure-observation-aggregate-${name}`}
            data-testid={`select-measure-observation-aggregate-${name}`}
            inputProps={{
              "data-testid": `measure-observation-aggregate-${name}-input`,
            }}
            style={{ width: 300 }}
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
        )}
        {!canEdit && (
          <div>
            <FieldLabel
              htmlFor={`measure-observation-aggregate-${name}-disabled`}
              data-testid={`select-measure-observation-aggregate-${name}-disabled`}
            >
              Aggregate Function
            </FieldLabel>
            {measureObservation?.aggregateMethod || ""}
          </div>
        )}
      </div>
    </>
  );
};

export default MeasureObservationDetails;
