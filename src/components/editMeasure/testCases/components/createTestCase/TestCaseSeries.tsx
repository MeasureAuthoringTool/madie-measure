import React, { useState, ChangeEvent } from "react";
import { TextField } from "@mui/material";
import * as _ from "lodash";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";

const filter = createFilterOptions();

export interface TestCaseSeriesProps {
  disabled?: boolean;
  value: string;
  onChange: (nextValue: string) => void;
  seriesOptions?: string[];
  sx: any;
}

const TestCaseSeries = ({
  disabled,
  value,
  onChange,
  seriesOptions = [],
  sx,
}: TestCaseSeriesProps) => {
  const maxLength = 250; // Define maxLength as a constant
  const [inputLength, setInputLength] = useState(value?.length || 0);
  const cleanedOptions = _.isArray(seriesOptions)
    ? seriesOptions.filter((o) => !_.isNil(o) && o.trim().length > 0)
    : [];

  return (
    <div style={{ position: "relative" }}>
      <Autocomplete
        disabled={disabled}
        id="test-case-series"
        freeSolo
        clearOnBlur
        value={value}
        onChange={(event, newValue) => {
          event.preventDefault();
          if (_.isNil(newValue)) {
            onChange("");
            return;
          }

          const v = newValue?.inputValue || newValue;
          const existingOption = cleanedOptions.find(
            (s) => s?.trim().toUpperCase() === v?.trim().toUpperCase()
          );
          _.isNil(existingOption) ? onChange(v) : onChange(existingOption);
        }}
        sx={sx}
        renderInput={(params) => {
          const { inputProps } = params;
          inputProps["maxLength"] = maxLength;
          return (
            <TextField
              sx={{
                "& .MuiInputBase-input": {
                  opacity: 1,
                  color: "#717171",
                  "&::placeholder": {
                    opacity: 1,
                    color: "#717171",
                  },
                },
              }}
              {...params}
              onChange={(
                e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
              ) => {
                params.inputProps.onChange(e as ChangeEvent<HTMLInputElement>);
                onChange(e.target.value);
                setInputLength(e.target.value.length);
              }}
              onKeyUp={(e) => {
                setInputLength((e.target as HTMLInputElement).value.length);
              }}
              data-testid="test-case-series"
              placeholder="Start typing or select"
            />
          );
        }}
        options={cleanedOptions}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) =>
              inputValue.trim().toUpperCase() === option?.trim().toUpperCase()
          );
          if (inputValue !== "" && !isExisting) {
            filtered.push({
              inputValue,
              title: `Add "${inputValue}"`,
            });
          }

          return filtered;
        }}
        getOptionLabel={(option: any): any => {
          // Value selected with enter, right from the input
          if (typeof option === "string") {
            return option;
          }
          // Add "xxx" option created dynamically
          if (option?.inputValue) {
            return option.inputValue;
          }
          return option?.title;
        }}
        renderOption={(props, option) => {
          if (typeof option === "string") {
            return (
              <li {...props} data-testid={`${option}-aa-option`}>
                {option}
              </li>
            );
          } else {
            return (
              <li {...props} data-testid={`${option?.title}-aa-option`}>
                {option?.title}
              </li>
            );
          }
        }}
      />
      {!disabled && (
        <span
          style={{
            fontFamily: "Rubik",
            fontSize: 12,
            color: "#717171",
            position: "absolute",
            bottom: -26,
            right: 0,
          }}
        >
          {inputLength}/{maxLength} Characters
        </span>
      )}
    </div>
  );
};

export default TestCaseSeries;
