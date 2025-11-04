import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import Box from "@mui/material/Box";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";

const UriComponent = ({
  canEdit,
  fieldRequired,
  label,
  structureDefinition,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  ...props
}: TypeComponentProps) => {
  const { value } = props;
  return (
    <div className="element-editor-add-row">
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`uri-field-${label}`}
        label={`${label}`}
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
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}
    </div>
  );
};

export default UriComponent;
