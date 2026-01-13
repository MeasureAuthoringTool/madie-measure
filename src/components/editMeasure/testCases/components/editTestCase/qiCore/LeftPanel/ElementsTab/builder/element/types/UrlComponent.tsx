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
  name,
  ...rest
}: TypeComponentProps) => {
  const testIdBase = name && name.includes("[") ? name : label;
  return (
    <div
      className="element-editor-add-row"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`url-field-${testIdBase}`}
        label={label}
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
      {showDeleteButton && canEdit && (
        <Tooltip title="Delete" arrow>
          <IconButton
            onClick={handleDeleteElement}
            data-testid={`delete-button-${testIdBase}`}
            size="small"
            color="error"
            aria-label={`delete ${testIdBase}`}
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
