import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextArea } from "@madie/madie-design-system/dist/react";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getMultipleCardinalityLabel } from "./TypeUtil";
/*
  String component is either going to need to be very smart, or we're going to have to provide validations ahead of time. 
  We should figure out how to provide different validations depending on what type of string we're looking at, (UUID, Markdown?)
  Should always be read only if it's the root ID
*/

const StringComponent = ({
  canEdit,
  fieldRequired,
  helperText,
  label = "VALUE",
  structureDefinition,
  stringOnly = false,
  showAddAttributeButton = false,
  addTitle,
  handleAddElement,
  showDeleteButton = false,
  handleDeleteElement,
  ...props
}: TypeComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase =
    props.name && props.name.includes("[") ? props.name : label;

  function isRootLabel(label) {
    const parts = label.split(".");
    return parts.length === 2 && parts[1] === "id";
  }
  return (
    <div
      className="element-editor-add-row"
      data-component-type="StringComponent"
    >
      <TextArea
        required={fieldRequired}
        readOnly={!canEdit}
        id={`string-field-${formattedLabel}`}
        label={formattedLabel}
        helperText={helperText}
        labelColor="#1976d2"
        inputProps={{
          "data-testid": `string-field-input-${testIdBase}`,
          "aria-describedby": `string-field-input-helper-text-${testIdBase}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
          readOnly: isRootLabel(label),
        }}
        size="small"
        fullWidth
        onKeyPress={
          stringOnly
            ? (event) => {
                const filteredValue = event.key?.replace(/[^a-zA-Z]/g, "");
                if (!filteredValue) {
                  event.preventDefault();
                }
              }
            : undefined
        }
        maxRows={4}
        minRows={1}
        maxLength={500}
        {...props}
      />
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

export default StringComponent;
