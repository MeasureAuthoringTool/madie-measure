import React, { useState } from "react";
import { InputLabel, TextField } from "@madie/madie-design-system/dist/react/";
import { Autocomplete, FormControl } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Formik } from "formik";
import { HelperText } from "@madie/madie-components";

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
    "& .MuiOutlinedInput-notchedOutline": {
      borderRadius: "3px",
      "& legend": {
        width: 0,
      },
    },
    "& .MuiAutocomplete-inputFocused": {
      border: "none",
      boxShadow: "none",
      outline: "none",
    },
    "& .MuiAutocomplete-inputRoot": {
      paddingTop: 0,
      paddingBottom: 0,
      backgroundColor: !canEdit ? "#EDEDED" : "",
    },
    width: "100%",
  };
  interface Option {
    name: string;
    code: string;
    guidance: string;
    system: string;
  }

  const removeSpecificChars = (string) => {
    return string.trim().replace("-", "").replace(".", "");
  };

  const fnHelperText = (helperText: any) => {
    return helperText;
  };
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
        value={value?.value?.code || ""}
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
