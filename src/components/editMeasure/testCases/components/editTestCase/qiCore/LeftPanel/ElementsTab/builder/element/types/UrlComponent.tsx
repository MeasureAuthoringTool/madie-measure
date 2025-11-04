import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";

const UrlComponent = ({
  canEdit,
  fieldRequired,
  label = "URL",
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton,
  handleDeleteElement,
  ...rest
}: TypeComponentProps) => {
  return (
    <div
      className="element-editor-add-row"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`url-field-${label}`}
        label={label}
        placeholder={label}
        inputProps={{
          "data-testid": `url-input-field-${label}`,
          "aria-describedby": `url-input-field-helper-text-${label}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`url-field-${label}`}
        size="small"
        fullWidth
        {...rest}
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

export default UrlComponent;
