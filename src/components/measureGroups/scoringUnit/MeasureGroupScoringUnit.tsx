import React, { useState } from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import { Autocomplete, FormControl, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export interface ScoringUnitProps {
  options?: any;
  value: any;
  onChange: (newValue: any) => void;
  canEdit: boolean;
}

const MeasureGroupScoringUnit = ({
  options,
  value,
  onChange,
  canEdit,
}: ScoringUnitProps) => {
  const autoCompleteStyles = {
    borderRadius: "3px",
    height: 40,
    border: "1px solid #DDDDDD",
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
  /* The value is passed to auto complete as
  / {label: "code + name", value: {code, guidance, name, system}}
  To prevent backwards compatability issues this pattern will stay. The auto complete will expect this
  On save the auto complete will repackage this in the same way through onChange
  */
  const parsedValue = value?.value || null;
  const [inputValue, setInputValue] = useState("");

  return (
    <div
      data-testid="measure-group-scoring-unit"
      style={{ paddingLeft: "16px" }}
    >
      {canEdit && (
        <FormControl fullWidth>
          <InputLabel
            id="scoring-unit-dropdown-label"
            data-testid="scoring-unit-dropdown-label"
            required={false}
          >
            Scoring Unit
          </InputLabel>
          <Autocomplete
            readOnly={!canEdit}
            options={options}
            data-testid="scoring-unit-dropdown"
            popupIcon={<SearchIcon sx={{ color: "#1C2556" }} />}
            freeSolo
            sx={autoCompleteStyles}
            value={parsedValue}
            getOptionLabel={(option: Option): string =>
              `${option.code} ${option.name}`
            }
            disablePortal
            limitTags={10}
            filterOptions={(options, state): any[] => {
              const { inputValue } = state;
              if (inputValue) {
                const input = removeSpecificChars(inputValue);
                const filteredOptions = options.filter((opt: Option) => {
                  const match = removeSpecificChars(`${opt.code} ${opt.name}`);
                  return match.includes(input);
                });
                return filteredOptions;
              }
              return [];
            }}
            onChange={(event: any, values: any, reason: string) => {
              event.preventDefault();
              // We need to find a way to kill reason === create-option. This breaks it.
              // if (reason === 'create-option') {
              //   setInputValue('');
              //   values[values.length - 1] = null;
              // }
              if (values && typeof values !== "string") {
                const label = `${values.code} ${values.name}`;
                const transformedResult = {
                  label,
                  value: values,
                };
                onChange(transformedResult);
              } else {
                onChange("");
              }
            }}
            autoHighlight={true}
            id="scoring-unit-dropdown"
            renderInput={(params) => {
              const { inputProps } = params;
              // inputProps["aria-required"] = false;
              // inputProps["aria-describedby"] = ""; no description necessary
              inputProps["aria-labelledby"] = "scoring-unit-dropdown-label";
              return (
                <TextField
                  {...params}
                  data-testid="measure-scoring-unit-text-input"
                  inputProps={inputProps}
                  sx={{
                    input: {
                      color: "#333",
                      "&::placeholder": {
                        opacity: 1,
                        color: "#717171",
                      },
                    },
                  }}
                  placeholder="UCUM Code or Name"
                  value={value ? `${value.code} ${value.name}` : ""}
                />
              );
            }}
          />
        </FormControl>
      )}
    </div>
  );
};

export default MeasureGroupScoringUnit;
