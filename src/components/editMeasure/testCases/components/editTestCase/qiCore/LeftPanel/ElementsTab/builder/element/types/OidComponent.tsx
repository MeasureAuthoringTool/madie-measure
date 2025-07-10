import React, { useState } from "react";
import { FormHelperText } from "@mui/material";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system";
import _ from "lodash";

const OidComponent = ({
  canEdit,
  fieldRequired,
  label = "OID",
  value,
  onChange,
  structureDefinition,
}: TypeComponentProps) => {
  const oidRegex = /urn:oid:[0-2](\.(0|[1-9][0-9]*))+/;
  const [isValid, setValid] = useState<boolean>(
    value ? value.match(oidRegex) : true
  );

  const handleChange = (oid) => {
    setValid(true);
    if (oid.match(oidRegex)) {
      onChange(oid);
    } else if (!_.isEmpty(oid)) {
      setValid(false);
    }
  };
  return (
    <TextField
      label={`${label}`}
      required={fieldRequired}
      disabled={!canEdit}
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
          {isValid ? "" : "Please enter a valid OID"}
        </FormHelperText>
      }
    />
  );
};

export default OidComponent;
