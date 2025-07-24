import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import Box from "@mui/material/Box";
import { TextField } from "@madie/madie-design-system/dist/react/";

const UriComponent = ({
  canEdit,
  fieldRequired,
  label,
  structureDefinition,
  ...props
}: TypeComponentProps) => {
  const { value } = props;
  return (
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
  );
};

export default UriComponent;
