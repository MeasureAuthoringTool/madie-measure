import React from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import { TextField, InputLabel } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import {
  ValidationResult,
  validate,
} from "../../../../../../../common/quantityInput/validate";
import { TypeComponentProps } from "./TypeComponentProps";
import { getIn, useFormikContext } from "formik";
import CodesComponent from "./CodesComponent";
import DecimalInput from "../../../../../../../common/DecimalInput/DecimalInput";
import "./QuantityComponent.scss";
import AddElementButton from "../../../../../../../common/AddElementButton";

export interface QuantityComponentProps extends TypeComponentProps {
  showLabel?: boolean;
  valueFieldLabel?: string;
}

const QuantityComponent = ({
  canEdit,
  label,
  showLabel = true,
  valueFieldLabel = "Value",
  structureDefinition,
  showAddAttributeButton = false,
  addTitle = "",
  handleAddElement = () => {},
}: QuantityComponentProps) => {
  const formik = useFormikContext();

  /*
    Determine whether to display the comparator field:

    - Shown only for "Quantity" types that are NOT SimpleQuantity.
    - Hidden for:
        - SimpleQuantity (profile includes SimpleQuantity)
        - Range types or any other type
  */
  const showComparator = structureDefinition?.type?.some(
    ({ code, profile }) =>
      code === "Quantity" &&
      !profile?.includes(
        "http://hl7.org/fhir/StructureDefinition/SimpleQuantity"
      )
  );

  const comparatorPath = `${label}.comparator`;
  const valuePath = `${label}.value`;

  const unitPath = `${label}.unit`;
  const unitValue = getIn(formik.values, unitPath);
  const validationResult: ValidationResult = validate(unitValue);

  return (
    <div className="element-editor-add-row">
      <div className="quantity-component">
        {showLabel && <InputLabel>{label}</InputLabel>}

        <div className="quantity-fields">
          {/* Comparator field */}
          {showComparator && (
            <div className="comparator-input">
              <CodesComponent
                label="Comparator"
                structureDefinition={{
                  path: label,
                  binding: {
                    valueSet:
                      "http://hl7.org/fhir/ValueSet/quantity-comparator",
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
              label={valueFieldLabel}
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

          {showAddAttributeButton && addTitle && canEdit && (
            <AddElementButton name={addTitle} onClick={handleAddElement} />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantityComponent;
