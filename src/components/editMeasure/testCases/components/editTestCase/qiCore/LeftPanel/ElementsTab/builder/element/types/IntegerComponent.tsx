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
  const { value } = props;
  return (
    <div className="element-editor-add-row">
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`integer-field-${label}`}
        label={label}
        inputProps={{
          "data-testid": `integer-field-input-${label}`,
          "aria-describedby": `integer-field-input-helper-text-${label}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`integer-field-${label}`}
        size="small"
        fullWidth
        onKeyPress={(e) => {
          const inputValue = e.target.value;

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
        value={value || ""}
      />
      {showDeleteButton && canEdit && (
        <Tooltip title="Delete" placement="top" arrow>
          <IconButton
            onClick={handleDeleteElement}
            data-testid={`delete-button-${label}`}
            aria-label={`delete ${label}`}
            size="small"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}
    </div>
  );
};

export default IntegerComponent;
