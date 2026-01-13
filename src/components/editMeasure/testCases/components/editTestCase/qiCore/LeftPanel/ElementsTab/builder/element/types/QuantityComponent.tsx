import React, { Dispatch, SetStateAction, useMemo } from "react";
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
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { set as lodashSet } from "lodash";
import { getMultipleCardinalityLabel } from "./TypeUtil";

export interface QuantityComponentProps extends TypeComponentProps {
  showLabel?: boolean;
  valueFieldLabel?: string;
}

const QuantityComponent = ({
  canEdit,
  label,
  name,
  showLabel = true,
  valueFieldLabel = "Value",
  structureDefinition,
  showAddAttributeButton = false,
  addTitle = "",
  handleAddElement = () => {},
  showDeleteButton = false,
  handleDeleteElement,
}: QuantityComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase = name && name.includes("[") ? name : label;
  const formik = useFormikContext();

  const updateQuantityCode = (code: string, unit: string, system: string) => {
    formik.setValues((prev) => {
      const next = { ...prev };
      lodashSet(next, `${label}.code`, code);
      lodashSet(next, `${label}.unit`, unit);
      lodashSet(next, `${label}.system`, system);
      return next;
    });
    formik.validateForm();
  };

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
  const comparator = getIn(formik.values, comparatorPath);

  const valuePath = `${label}.value`;
  const value = getIn(formik.values, valuePath);

  const codePath = `${label}.code`;
  const code = getIn(formik.values, codePath);

  const validationResult = useMemo(() => validate(code), [code]);

  return (
    <div className="element-editor-add-row">
      <div className="quantity-component">
        {showLabel && <InputLabel>{formattedLabel}</InputLabel>}

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
                value={comparator ?? ""}
                onChange={(val) => formik.setFieldValue(comparatorPath, val)}
                canEdit={canEdit}
                fieldRequired={false}
              />
            </div>
          )}

          {/* Value field */}
          <div className="value-input">
            <DecimalInput
              label={valueFieldLabel}
              value={value ?? ""}
              handleChange={(val) =>
                formik.setFieldValue(
                  valuePath,
                  val !== "" ? parseFloat(val) : null
                )
              }
              canEdit={canEdit}
              required={false}
              placeholder=""
            />
          </div>

          {/* Unit(s) field (corresponds to the "code" key in Formik. Labeled as "Unit(s)" in the UI for the user) */}
          <div className="code-input">
            <TextField
              id={"code-input"}
              data-testid="code-input"
              readOnly={!canEdit}
              label="Unit(s)"
              tooltipText="Enter the UCUM (Unified Code for Units of Measure) code value."
              error={!!validationResult.error}
              helperText={validationResult.helperText}
              value={code ?? ""}
              onChange={(e) => {
                const inputCode = e.target.value;

                if (!inputCode) {
                  // Code cleared so remove code, unit, system
                  updateQuantityCode(undefined, undefined, undefined);
                  return;
                }

                // Validate the input code
                const validation = validate(inputCode);

                if (validation.label) {
                  // Valid code so set code, unit, system
                  // For bracketed code (ucumUnitCode === 1), set the unit (human readable name) to the input code too
                  const unit =
                    validation.ucumUnitCode === 1
                      ? inputCode
                      : validation.label;
                  updateQuantityCode(
                    inputCode,
                    unit,
                    "http://unitsofmeasure.org"
                  );
                } else {
                  // Invalid code so keep code, remove unit and system
                  updateQuantityCode(inputCode, undefined, undefined);
                }
              }}
            />
          </div>

          {showDeleteButton && canEdit && (
            <Tooltip title="Delete" placement="top" arrow>
              <IconButton
                onClick={handleDeleteElement}
                data-testid={`delete-button-${testIdBase}`}
                aria-label={`delete ${testIdBase}`}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {showAddAttributeButton && addTitle && canEdit && (
            <AddElementButton name={addTitle} onClick={handleAddElement} />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantityComponent;
