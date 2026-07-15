import React, { useMemo, useState, useEffect, useRef } from "react";
import { TextField, InputLabel } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import {
  validate,
  getUcumCodeForTimingDisplay,
} from "../../../../../../../common/quantityInput/validate";
import { TypeComponentProps } from "./TypeComponentProps";
import { getIn, useFormikContext } from "formik";
import CodesComponent from "./CodesComponent";
import "./QuantityComponent.scss";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { set as lodashSet } from "lodash";
import { getMultipleCardinalityLabel } from "./TypeUtil";
import DecimalComponent from "./DecimalComponent";

export interface QuantityComponentProps extends TypeComponentProps {
  showLabel?: boolean;
  valueFieldLabel?: string;
  showComparator: boolean;
}

const QuantityComponent = ({
  canEdit,
  label,
  name,
  showLabel = true,
  valueFieldLabel,
  showComparator,
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

  const comparatorPath = `${label}.comparator`;
  const comparator = getIn(formik.values, comparatorPath);

  const valuePath = `${label}.value`;
  const codePath = `${label}.code`;
  const code = getIn(formik.values, codePath);
  const unitPath = `${label}.unit`;
  const unit = getIn(formik.values, unitPath);

  // Prefer the human-readable "unit" (e.g. "year") over "code" (e.g. "a").
  const [displayValue, setDisplayValue] = useState<string>(unit ?? code ?? "");

  // Track whether the user is actively typing so we don't override their input.
  const isUserTypingRef = useRef(false);

  // Keep displayValue in sync when formik code/unit changes externally
  // (e.g. form reset, programmatic update), but not when the user is
  // actively typing.
  useEffect(() => {
    if (isUserTypingRef.current) {
      // Change originated from user typing — don't override displayValue.
      isUserTypingRef.current = false;
      return;
    }
    const formikCode = code ?? "";
    // Prefer unit (human-readable) over code when available
    setDisplayValue(unit ?? formikCode);
  }, [code, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  const validationResult = useMemo(() => validate(code), [code]);

  return (
    <div
      className="element-editor-add-row"
      data-component-type="QuantityComponent"
    >
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
            <DecimalComponent
              label={valueFieldLabel}
              {...formik.getFieldProps(valuePath)}
              canEdit={canEdit}
              required={false}
            />
          </div>

          {/* Unit(s) field (corresponds to the "code" key in Formik. Labeled as "Unit(s)" in the UI for the user) */}
          <div className="code-input">
            <TextField
              id={"code-input"}
              data-testid={`code-input-${label}`}
              readOnly={!canEdit}
              label="Unit(s)"
              tooltipText="Enter the UCUM (Unified Code for Units of Measure) code value."
              error={!!validationResult.error}
              helperText={validationResult.helperText}
              value={displayValue}
              onChange={(e) => {
                const inputCode = e.target.value;
                setDisplayValue(inputCode);
                isUserTypingRef.current = true;

                if (!inputCode) {
                  // Code cleared so remove code, unit, system
                  updateQuantityCode(undefined, undefined, undefined);
                  return;
                }

                // Check if input is a QI-Core timing display value (e.g. "days" → "d")
                const mappedCode = getUcumCodeForTimingDisplay(inputCode);
                if (mappedCode) {
                  updateQuantityCode(
                    mappedCode,
                    inputCode.trim(),
                    "http://unitsofmeasure.org"
                  );
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

          {canEdit && (
            <div tw="mt-5 flex items-center">
              {showDeleteButton && (
                <Tooltip title="Delete" placement="top" arrow>
                  <span>
                    <IconButton
                      onClick={handleDeleteElement}
                      data-testid={`delete-button-${label}`}
                      aria-label={`delete ${label}`}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" color="error" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {showAddAttributeButton && (
                <AddElementButton name={addTitle} onClick={handleAddElement} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantityComponent;
