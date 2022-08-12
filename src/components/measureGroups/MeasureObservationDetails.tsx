import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import { Button, TextField } from "@mui/material";
import {
  MeasureObservation,
  AGGREGATE_FUNCTION_KEYS,
} from "@madie/madie-models";
import { DSLink } from "@madie/madie-design-system/dist/react";

const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);
const HeavyLabel = styled.label`
  color: #505d68;
  font-weight: 500;
`;

const Required = styled.span`
  display: inline-block;
  padding-left: 0.25rem;
`;

const Row = styled.section`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;
  margin-top: 14px;
`;
const Col = styled.article`
  display: flex;
  flex-direction: column;
`;

const AGGREGATE_FUNCTIONS = Array.from(AGGREGATE_FUNCTION_KEYS.keys()).sort();

export interface MeasureObservationProps {
  required: boolean;
  name: string;
  elmJson: string;
  measureObservation: MeasureObservation;
  label?: string;
  onChange?: (measureObservation) => void;
  onRemove?: (measureObservation) => void;
}

const MeasureObservationDetails = ({
  required = false,
  name,
  label,
  elmJson,
  measureObservation,
  onChange,
  onRemove,
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

  return (
    <>
      <div>
        <HeavyLabel
          htmlFor={`measure-observation-${name}`}
          id={`measure-observation-${name}-label`}
          data-testid={`select-measure-observation-${name}-label`}
        >
          {label ? label : "Observation"}
          {required && <Required>*</Required>}
        </HeavyLabel>
        <Row>
          <Col>
            <TextField
              id={`measure-observation-${name}`}
              data-testid={`select-measure-observation-${name}`}
              InputLabelProps={{ shrink: false }}
              label=" "
              sx={{
                "& .MuiInputLabel-root": {
                  display: "none",
                },
              }}
              select
              value={measureObservation?.definition || ""}
              style={{ width: 300 }}
              SelectProps={{
                native: true,
              }}
              onChange={(e) => {
                if (onChange) {
                  onChange({
                    ...measureObservation,
                    definition: e.target.value,
                  });
                }
              }}
            >
              <option disabled value="">
                -
              </option>
              {cqlFunctionNames.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </TextField>
          </Col>
          {!required && (
            <Col style={{ marginLeft: 10 }}>
              <DSLink
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
            </Col>
          )}
        </Row>
      </div>
      <FormControl style={{ marginLeft: 40 }}>
        <HeavyLabel
          htmlFor={`measure-observation-aggregate-${name}`}
          id={`measure-observation-aggregate-${name}-label`}
          data-testid={`select-measure-observation-aggregate-${name}-label`}
        >
          Aggregate Function
          <Required>*</Required>
        </HeavyLabel>
        <Row>
          <Col>
            <TextField
              id={`measure-observation-aggregate-${name}`}
              data-testid={`select-measure-observation-${name}`}
              InputLabelProps={{ shrink: false }}
              label=" "
              sx={{
                "& .MuiInputLabel-root": {
                  display: "none",
                },
              }}
              select
              value={measureObservation?.aggregateMethod || ""}
              style={{ width: 300 }}
              SelectProps={{
                native: true,
              }}
              onChange={(e) => {
                if (onChange) {
                  onChange({
                    ...measureObservation,
                    aggregateMethod: e.target.value,
                  });
                }
              }}
            >
              <option disabled value="">
                -
              </option>
              {AGGREGATE_FUNCTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </TextField>
          </Col>
        </Row>
      </FormControl>
    </>
  );
};

export default MeasureObservationDetails;
