import React from "react";
import { MenuItem as MuiMenuItem, IconButton, Tooltip } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import { TypeComponentProps } from "./TypeComponentProps";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getMultipleCardinalityLabel } from "./TypeUtil";
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
  const formattedLabel = getMultipleCardinalityLabel(label);
  return (
    <div
      className="element-editor-add-row"
      data-component-type="BooleanComponent"
    >
      <Select
        id={`boolean-selector-${testIdBase}`}
        label={formattedLabel}
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
        value={value === true ? "true" : value === false ? "false" : ""}
      ></Select>
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

export default BooleanComponent;
