import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
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
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase =
    props.name && props.name.includes("[") ? props.name : label;
  return (
    <div
      className="element-editor-add-row"
      data-component-type="UriComponent"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`uri-field-${formattedLabel}`}
        label={formattedLabel}
        labelColor="#1976d2"
        placeholder={label}
        inputProps={{
          "data-testid": `uri-input-field-${testIdBase}`,
          "aria-describedby": `uri-input-field-helper-text-${testIdBase}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`uri-field-${testIdBase}`}
        size="small"
        fullWidth
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

export default UriComponent;
