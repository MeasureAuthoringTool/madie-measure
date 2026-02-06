import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { getMultipleCardinalityLabel } from "./TypeUtil";
const UrlComponent = ({
  canEdit,
  fieldRequired,
  label = "URL",
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton,
  handleDeleteElement,
  name,
  ...rest
}: TypeComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase = name && name.includes("[") ? name : label;
  return (
    <div
      className="element-editor-add-row"
      data-component-type="UrlComponent"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`url-field-${formattedLabel}`}
        label={formattedLabel}
        placeholder={label}
        inputProps={{
          "data-testid": `url-input-field-${testIdBase}`,
          "aria-describedby": `url-input-field-helper-text-${testIdBase}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`url-field-${testIdBase}`}
        size="small"
        fullWidth
        {...rest}
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

export default UrlComponent;
