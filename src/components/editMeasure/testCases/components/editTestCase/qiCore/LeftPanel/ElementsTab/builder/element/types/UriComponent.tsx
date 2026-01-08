import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import Box from "@mui/material/Box";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { getMultipleCardinalityLabel } from "./TypeUtil";
const UriComponent = ({
  canEdit,
  fieldRequired,
  label,
  structureDefinition,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton,
  handleDeleteElement,
  ...props
}: TypeComponentProps) => {
  const { value } = props;
  return (
    <div
      className="element-editor-add-row"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`uri-field-${label}`}
        label={`${getMultipleCardinalityLabel(label)}`}
        labelColor="#1976d2"
        placeholder={label}
        inputProps={{
          "data-testid": `uri-input-field-${label}`,
          "aria-describedby": `uri-input-field-helper-text-${label}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`uri-field-${label}`}
        size="small"
        fullWidth
        {...props}
        value={value || ""}
      />
      {showDeleteButton && canEdit && (
        <Tooltip title="Delete" arrow>
          <IconButton
            onClick={handleDeleteElement}
            data-testid={`delete-button-${label}`}
            size="small"
            color="error"
            aria-label="delete element"
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

export default UriComponent;
