import React, { useState } from "react";
import { FormHelperText } from "@mui/material";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react";
import _ from "lodash";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { getMultipleCardinalityLabel } from "./TypeUtil";

const isBase64 = (str) => {
  try {
    const decoded = atob(str);
    return decoded && new RegExp(/(\s*([0-9a-zA-Z\+\=]){4}\s*)+/).test(str);
  } catch (err) {
    return false;
  }
};

const Base64BinaryComponent = ({
  canEdit,
  fieldRequired,
  label = "Base64Binary",
  value,
  onChange,
  structureDefinition,
  showAddAttributeButton,
  addTitle,
}: TypeComponentProps) => {
  const [isValid, setValid] = useState<boolean>(value ? isBase64(value) : true);

  const handleChange = (base64BinaryString) => {
    setValid(true);
    if (isBase64(base64BinaryString)) {
      onChange(base64BinaryString);
    } else if (!_.isEmpty(base64BinaryString)) {
      setValid(false);
    }
  };
  return (
    <div
      className="element-editor-add-row"
      data-component-type="Base64BinaryComponent"
    >
      <TextField
        label={`${getMultipleCardinalityLabel(label)}`}
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
            {isValid ? "" : "Please enter a valid Base64Binary"}
          </FormHelperText>
        }
      />
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} />
      )}
    </div>
  );
};

export default Base64BinaryComponent;
