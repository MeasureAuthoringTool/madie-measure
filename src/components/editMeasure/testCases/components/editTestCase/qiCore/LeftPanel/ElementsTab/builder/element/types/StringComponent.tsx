import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react";
import AddElementButton from "../../../../../../../common/AddElementButton";

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
  stringOnly = true,
  showAddAttributeButton = false,
  addTitle,
  ...props
}: TypeComponentProps) => {
  function isRootLabel(label) {
    const parts = label.split(".");
    return parts.length === 2 && parts[1] === "id";
  }
  const { value } = props;
  return (
    <div className="element-editor-add-row">
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`string-field-${label}`}
        label={label}
        helperText={helperText}
        labelColor="#1976d2"
        inputProps={{
          "data-testid": `string-field-input-${label}`,
          "aria-describedby": `string-field-input-helper-text-${label}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
          readOnly: isRootLabel(label),
        }}
        data-testid={`string-field-${label}`}
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
        {...props}
        value={value || ""}
      />
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} />
      )}
    </div>
  );
};

export default StringComponent;
