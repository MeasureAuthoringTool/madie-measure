import React from "react";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import { TypeComponentProps } from "./TypeComponentProps";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const BooleanComponent = ({
  canEdit,
  fieldRequired,
  label,
  helperText,
  error,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton = false,
  handleDeleteElement,
  ...props
}: TypeComponentProps) => {
  const { value } = props;
  const booleanOptions = [
    <MuiMenuItem
      key={`boolean-True-${label}`}
      value={`true`}
      data-testid={`boolean-True-${label}`}
      defaultValue={`true`}
    >
      true
    </MuiMenuItem>,
    <MuiMenuItem
      key={`boolean-False-${label}`}
      value={`false`}
      data-testid={`boolean-False-${label}`}
    >
      false
    </MuiMenuItem>,
  ];
  return (
    <div className="element-editor-add-row">
      <Select
        id={`boolean-selector-${label}`}
        label={label}
        inputProps={{
          "data-testid": `boolean-input-field-${label}`,
          "aria-describedby": `boolean-input-field-helper-text-${label}`,
        }}
        data-testid={`boolean-field-${label}`}
        readOnly={!canEdit}
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        helperText={helperText}
        error={error}
        options={booleanOptions}
        {...props}
        value={value || ""} // mui thinks undefined is an uncontrolled input. We need to display this otherwise.
      ></Select>
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

export default BooleanComponent;
