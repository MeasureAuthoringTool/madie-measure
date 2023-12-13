import React, { useState } from "react";
import { TextField } from "@madie/madie-design-system/dist/react/";

export interface ScoringUnitProps {
  value: any;
  onChange: (newValue: any) => void;
  canEdit: boolean;
  placeholder: string;
  error: any;
  helperText: any;
}

const MeasureGroupScoringUnit = ({
  value,
  onChange,
  canEdit,
  placeholder,
  error,
  helperText,
}: ScoringUnitProps) => {
  const autoCompleteStyles = {
    minHeight: "40px",
    borderRadius: "3px",
    height: "auto",
    width: "100%",
  };
  interface Option {
    name: string;
    code: string;
    guidance: string;
    system: string;
  }

  /* The value is passed to auto complete as
  / {label: "code + name", value: {code, guidance, name, system}}
  To prevent backwards compatability issues this pattern will stay. The auto complete will expect this
  On save the auto complete will repackage this in the same way through onChange
  */
  const parsedValue = value?.value || null;
  return (
    // {
    // data test id is now passed to formControl instead of wrapping div.
    <>
      <TextField
        error={error}
        helperText={helperText}
        disabled={!canEdit}
        inputProps={{ "data-testid": "scoring-unit-text-input" }}
        label="Scoring Unit"
        id="scoring-unit-text-input"
        placeholder={placeholder}
        value={value?.value?.code}
        onChange={(event: any) => {
          const label = `${event.target.value}`;
          const transformedResult = {
            label,
            value: {
              code: event.target.value,
              guidance: undefined,
              name: "",
              system: "https://clinicaltables.nlm.nih.gov/",
            },
          };

          onChange(transformedResult);
        }}
      />
    </>
  );
};

export default MeasureGroupScoringUnit;
