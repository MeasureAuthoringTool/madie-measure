import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import { MenuItem } from "@mui/material";
import {
  MeasureObservation,
  AGGREGATE_FUNCTION_KEYS,
} from "@madie/madie-models";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";

const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);

const Row = styled.section`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;
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

  // todo elmJson doesn't have any functions
  return (
    <>
      <div>
        <Row>
          <Col>
            <Select
              placeHolder={{ name: "-", value: "" }}
              required={required}
              readOnly={!canEdit}
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
          </Col>
          {!required && canEdit && (
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
        <Row>
          <Col>
            <Select
              placeHolder={{ name: "-", value: "" }}
              readOnly={!canEdit}
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
          </Col>
        </Row>
      </FormControl>
    </>
  );
};

export default MeasureObservationDetails;
