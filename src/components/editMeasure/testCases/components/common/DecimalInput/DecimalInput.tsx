import React from "react";
import { TextField } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import "./DecimalInput.scss";

export interface DecimalProps {
  value?: number | null;
  handleChange: Function;
  canEdit: boolean;
  label?: string;
  containerStyle?: React.CSSProperties;
  required?: boolean;
}

const DecimalInput = ({
  value = null,
  handleChange,
  canEdit,
  label = "Decimal",
  containerStyle,
  required = true,
}: DecimalProps) => {
  return (
    <div tw="flex flex-row">
      <div tw="w-28" style={containerStyle}>
        <TextField
          value={value}
          readOnly={!canEdit}
          type="number"
          min="0"
          label={label}
          placeholder={`Enter ${label}`}
          id={`decimal-field-${label}`}
          data-testid={`decimal-field-${label}`}
          inputProps={{
            "data-testid": `decimal-input-field-${label}`,
            "aria-describedby": `decimal-input-field-helper-text-${label}`,
            required: required,
          }}
          onWheel={(e) => e.target.blur()}
          onKeyPress={(e) => {
            if (!Number(e.key) && e.key != "0" && e.key != ".") {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            if (Number(e.target.value) >= 0) {
              handleChange(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
};

export default DecimalInput;
