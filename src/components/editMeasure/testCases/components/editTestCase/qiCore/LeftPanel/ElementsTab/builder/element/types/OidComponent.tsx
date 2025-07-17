import React, { useState } from "react";
import { FormHelperText } from "@mui/material";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react";
import _ from "lodash";
import AddElementButton from "../../../../../../../common/AddElementButton";

const OidComponent = ({
  canEdit,
  fieldRequired,
  label = "OID",
  value,
  onChange,
  structureDefinition,
  showAddAttributeButton,
  addTitle,
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
    <div className="element-editor-add-row">
      <TextField
        label={`${label}`}
        required={fieldRequired}
        readOnly={!canEdit}
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
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} />
      )}
    </div>
  );
};

export default OidComponent;
