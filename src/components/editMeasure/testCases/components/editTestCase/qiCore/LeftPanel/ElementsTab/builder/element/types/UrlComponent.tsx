import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react/";

const UrlComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "URL",
}: TypeComponentProps) => {
  return (
    <TextField
      required={fieldRequired}
      disabled={!canEdit}
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default UrlComponent;
