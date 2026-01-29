import React, { useEffect, useState } from "react";
import { TextField } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import { TypeComponentProps } from "./TypeComponentProps";
import {
  SIGNED_MINIMUM,
  INTEGER_MAXIMUM,
} from "../typesValidations/FhirNumbers";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getMultipleCardinalityLabel } from "./TypeUtil";
export enum IntegerType {
  UNSIGNED = "Unsigned",
  SIGNED = "Signed",
  POSITIVE_INT = "PositiveInt",
}

interface IntegerComponentProps extends TypeComponentProps {
  integerType: IntegerType;
}

const IntegerComponent = ({
  canEdit,
  fieldRequired,
  label = "Integer",
  integerType,
  helperText,
  error,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton = false,
  handleDeleteElement,
  ...props
}: IntegerComponentProps) => {
  // Use name for test IDs in array scenarios (when it contains '['), otherwise use original label
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase =
    props.name && props.name.includes("[") ? props.name : label;

  return (
    <div
      className="element-editor-add-row"
      data-component-type="IntegerComponent"
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`integer-field-${formattedLabel}`}
        label={formattedLabel}
        inputProps={{
          "data-testid": `integer-field-input-${testIdBase}`,
          "aria-describedby": `integer-field-input-helper-text-${testIdBase}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`integer-field-${testIdBase}`}
        size="small"
        fullWidth
        onKeyPress={(e) => {
          const inputValue = e.target.value;
          // Allow control keys (backspace, delete, arrows, etc.)
          // Allow all characters, but validate the input later
          if (integerType === IntegerType.SIGNED) {
            if (
              Number(inputValue + e.key) < SIGNED_MINIMUM ||
              Number(inputValue + e.key) > INTEGER_MAXIMUM
            ) {
              e.preventDefault();
            }
          } else if (integerType === IntegerType.UNSIGNED) {
            if (Number(inputValue + e.key) > INTEGER_MAXIMUM) {
              e.preventDefault();
            }
          } else if (integerType === IntegerType.POSITIVE_INT) {
            if (Number(inputValue + e.key) > INTEGER_MAXIMUM) {
              e.preventDefault();
            }
          }
        }}
        error={error}
        helperText={error}
        {...props}
      />
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
  );
};

export default IntegerComponent;
