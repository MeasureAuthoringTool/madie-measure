import React from "react";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system";
import { TypeComponentProps } from "./TypeComponentProps";

const BooleanComponent = ({
  canEdit,
  fieldRequired,
  label,
  helperText,
  error,
  ...props
}: TypeComponentProps) => {
  const { value } = props;
  const booleanOptions = [
    <MuiMenuItem
      key={`boolean-True-${label}`}
      value={`true`}
      data-testid={`boolean-True-${label}`}
      defaultValue={`true`}
    >
      true
    </MuiMenuItem>,
    <MuiMenuItem
      key={`boolean-False-${label}`}
      value={`false`}
      data-testid={`boolean-False-${label}`}
    >
      false
    </MuiMenuItem>,
  ];
  return (
    <>
      <Select
        id={`boolean-selector-${label}`}
        label={label}
        inputProps={{
          "data-testid": `boolean-input-field-${label}`,
          "aria-describedby": `boolean-input-field-helper-text-${label}`,
        }}
        data-testid={`boolean-field-${label}`}
        disabled={!canEdit}
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        helperText={helperText}
        error={error}
        options={booleanOptions}
        {...props}
        value={value || ""} // mui thinks undefined is an uncontrolled input. We need to display this otherwise.
      ></Select>
    </>
  );
};

export default BooleanComponent;
