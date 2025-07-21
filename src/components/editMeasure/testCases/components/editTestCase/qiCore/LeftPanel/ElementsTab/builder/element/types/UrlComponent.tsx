import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react/";

const UrlComponent = ({
  canEdit,
  fieldRequired,
  label = "URL",
  ...rest
}: TypeComponentProps) => {
  return (
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
  );
};

export default UrlComponent;
