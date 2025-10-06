import React from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import { TextField, InputLabel } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import { Box } from "@mui/material";
import {
  ValidationResult,
  validate,
} from "../../../../../../../common/quantityInput/validate";
import { TypeComponentProps } from "./TypeComponentProps";
import { getIn, useFormikContext } from "formik";
import CodesComponent from "./CodesComponent";
import DecimalInput from "../../../../../../../common/DecimalInput/DecimalInput";
import "./QuantityComponent.scss";

const QuantityComponent = ({
  canEdit,
  label,
  structureDefinition,
}: TypeComponentProps) => {
  const formik = useFormikContext();

  /*
  Determine if the structureDefinition represents a SimpleQuantity.
  The comparator is not used on a SimpleQuantity (https://hl7.org/fhir/datatypes.html#SimpleQuantity).
  Use this flag to conditionally hide the comparator field in the UI.
  */
  const isSimpleQuantity = structureDefinition?.type?.[0]?.profile?.includes(
    "http://hl7.org/fhir/StructureDefinition/SimpleQuantity"
  );

  const comparatorPath = `${label}.comparator`;
  const valuePath = `${label}.value`;

  const unitPath = `${label}.unit`;
  const unitValue = getIn(formik.values, unitPath);
  const validationResult: ValidationResult = validate(unitValue);

  return (
    <div className="quantity-component">
      <InputLabel>{label}</InputLabel>
      <Box className="quantity-fields">
        {/* Comparator field */}
        {!isSimpleQuantity && (
          <div className="comparator-input">
            <CodesComponent
              label="Comparator"
              structureDefinition={{
                path: label,
                binding: {
                  valueSet: "http://hl7.org/fhir/ValueSet/quantity-comparator",
                  strength: "required",
                },
              }}
              value={getIn(formik.values, comparatorPath)}
              onChange={(val) => {
                const existing = getIn(formik.values, label) || {};
                formik.setFieldValue(label, {
                  ...existing,
                  comparator: val,
                });
              }}
              canEdit={canEdit}
              fieldRequired={false}
            />
          </div>
        )}

        {/* Value field */}
        <div className="value-input">
          <DecimalInput
            label="Value"
            value={getIn(formik.values, valuePath) ?? ""}
            handleChange={(val) => {
              const existing = getIn(formik.values, label) || {};
              formik.setFieldValue(label, {
                ...existing,
                value: val !== "" ? parseFloat(val) : null,
              });
            }}
            canEdit={canEdit}
            required={false}
            placeholder=""
          />
        </div>

        {/* Unit(s) field */}
        <div className="unit-input">
          <TextField
            id={"unit-input"}
            data-testid="unit-input"
            readOnly={!canEdit}
            label="Unit(s)"
            error={!!validationResult.error}
            helperText={validationResult.helperText}
            value={getIn(formik.values, label)?.unit ?? ""}
            onChange={(e) => {
              const existing = getIn(formik.values, label) || {};
              formik.setFieldValue(label, {
                ...existing,
                unit: e.target.value,
              });
            }}
          />
        </div>
      </Box>
    </div>
  );
};

export default QuantityComponent;
