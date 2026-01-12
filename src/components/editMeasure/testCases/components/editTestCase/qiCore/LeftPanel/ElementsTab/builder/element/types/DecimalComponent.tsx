import React from "react";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import "./DecimalComponent.scss";

interface DecimalComponentProps {
  label: string;
  canEdit: boolean;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  showAddAttributeButton?: boolean;
  showDeleteButton?: boolean;
  handleAddElement?: () => void;
  handleDeleteElement?: () => void;
  addTitle?: string;
  value?: string | number;
  [key: string]: any;
}

const DecimalComponent = ({
  label,
  canEdit,
  helperText,
  error,
  required,
  showAddAttributeButton,
  showDeleteButton,
  handleAddElement,
  handleDeleteElement,
  addTitle,
  value,
  ...rest
}: DecimalComponentProps) => {
  const { onChange } = rest;
  return (
    <>
      <TextField
        className="decimal-component"
        value={value ?? ""}
        readOnly={!canEdit}
        required={required}
        error={error}
        helperText={helperText}
        type="number"
        inputMode="decimal"
        min="0"
        label={label}
        placeholder={`Enter ${label.split(".").pop()}`}
        id={`decimal-field-${label}`}
        data-testid={`decimal-field-${label}`}
        inputProps={{
          "data-testid": `decimal-field-input-${label}`,
          "aria-describedby": `decimal-field-input-helper-text-${label}`,
          required: required,
          "aria-required": required,
        }}
        onWheel={(e) => e.target.blur()}
        onChange={onChange}
        {...rest}
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
    </>
  );
};

export default DecimalComponent;
