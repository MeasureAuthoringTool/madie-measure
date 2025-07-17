import React, { useState } from "react";
import { FormHelperText } from "@mui/material";
import { validate as uuidValidate } from "uuid";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react";
import _ from "lodash";

const UuidComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "uuid",
  structureDefinition,
}: TypeComponentProps) => {
  const [isValid, setValid] = useState<boolean>(true);
  const handleChange = (uuid: string) => {
    setValid(true);
    if (uuidValidate(uuid)) {
      onChange(uuid);
    } else if (!_.isEmpty(uuid)) {
      setValid(false);
    }
  };
  return (
    <TextField
      required={fieldRequired}
      readOnly={!canEdit}
      label={`> ${label}`}
      labelColor="#1976d2"
      inputProps={{
        "data-testid": `field-input-${label}`,
        "aria-describedby": `field-input-helper-text-${label}`,
        required: fieldRequired,
        "aria-required": fieldRequired,
      }}
      size="small"
      fullWidth
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      helperText={
        <FormHelperText
          data-testid={`field-input-helper-text-${label}`}
          error={!isValid}
        >
          {isValid ? "" : "Please enter a valid uuid"}
        </FormHelperText>
      }
    />
  );
};

export default UuidComponent;
