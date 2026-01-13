import React from "react";
import { MenuItem as MuiMenuItem, IconButton, Tooltip } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import { TypeComponentProps } from "./TypeComponentProps";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
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
  name,
  ...props
}: TypeComponentProps) => {
  const testIdBase = name && name.includes("[") ? name : label;
  const { value } = props;
  const booleanOptions = [
    <MuiMenuItem
      key={`boolean-True-${testIdBase}`}
      value={`true`}
      data-testid={`boolean-True-${testIdBase}`}
      defaultValue={`true`}
    >
      true
    </MuiMenuItem>,
    <MuiMenuItem
      key={`boolean-False-${testIdBase}`}
      value={`false`}
      data-testid={`boolean-False-${testIdBase}`}
    >
      false
    </MuiMenuItem>,
  ];
  return (
    <div className="element-editor-add-row">
      <Select
        id={`boolean-selector-${testIdBase}`}
        label={label}
        inputProps={{
          "data-testid": `boolean-input-field-${testIdBase}`,
          "aria-describedby": `boolean-input-field-helper-text-${testIdBase}`,
        }}
        data-testid={`boolean-field-${testIdBase}`}
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
            data-testid={`delete-button-${testIdBase}`}
            aria-label={`delete ${testIdBase}`}
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
