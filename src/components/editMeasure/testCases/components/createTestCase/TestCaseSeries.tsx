import React, { useState, useEffect } from "react";
import { AutoComplete, TextField } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";

export interface TestCaseSeriesProps {
  readOnly?: boolean;
  value: string;
  onChange: (nextValue: string) => void;
  seriesOptions?: string[];
  sx: any;
  error?: boolean;
  helperText?: string;
}

const TestCaseSeries = ({
  readOnly,
  value,
  onChange,
  seriesOptions = [],
  sx,
  error,
  helperText,
}: TestCaseSeriesProps) => {
  const maxLength = 250;
  const [inputLength, setInputLength] = useState(value?.length || 0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputLength(value?.length || 0);
  }, [value]);

  const cleanedOptions = _.isArray(seriesOptions)
    ? seriesOptions.filter((o) => !_.isNil(o) && o.trim().length > 0)
    : [];

  const getOptions = () => {
    if (!inputValue) {
      return cleanedOptions;
    }

    const matchingOptions = cleanedOptions.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );

    const exactMatch = cleanedOptions.some(
      (option) => option.toLowerCase() === inputValue.toLowerCase()
    );

    if (!exactMatch && inputValue.trim() !== "") {
      return [...matchingOptions, `Add "${inputValue}"`];
    }

    return matchingOptions;
  };

  const handleAutoCompleteChange = (id, selectedValue, reason, details) => {
    if (reason === "clear") {
      onChange("");
      setInputValue("");
      return;
    }

    if (selectedValue === null || selectedValue === undefined) {
      onChange("");
      setInputValue("");
      return;
    }

    if (
      typeof selectedValue === "string" &&
      selectedValue.startsWith('Add "') &&
      selectedValue.endsWith('"')
    ) {
      const newValue = selectedValue.substring(5, selectedValue.length - 1);
      onChange(newValue);
      setInputValue(newValue);
      return;
    }

    const existingOption = cleanedOptions.find(
      (option) => option.toLowerCase() === selectedValue.toLowerCase()
    );

    onChange(existingOption || selectedValue);
    setInputValue("");
  };

  const renderOption = (props, option) => {
    return (
      <li {...props} data-testid={`${option}-aa-option`}>
        {option}
      </li>
    );
  };
  return (
    <div
      style={{ position: "relative" }}
      data-testid="test-case-series-container"
      id="test-case-series-container"
    >
      <AutoComplete
        id="test-case-series"
        dataTestId="test-case-series"
        readOnly={readOnly}
        placeholder="Start typing or select"
        label="Group"
        helperText={helperText}
        options={getOptions()}
        freeSolo={true}
        value={value}
        onChange={handleAutoCompleteChange}
        sx={sx}
        renderOption={renderOption}
        inputProps={{
          maxLength: maxLength,
          "data-testid": "test-case-series-input",
          value: inputValue || value,
        }}
        error={error}
        onInputChange={(event, newInputValue) => {
          if (event) {
            setInputValue(newInputValue);
            setInputLength(newInputValue.length || 0);
          }
        }}
      />
      {!readOnly && (
        <span
          style={{
            fontFamily: "Rubik",
            fontSize: 12,
            color: "#717171",
            position: "absolute",
            bottom: -26,
            right: 0,
          }}
          data-testid="character-count"
        >
          {inputLength}/{maxLength} Characters
        </span>
      )}
    </div>
  );
};

export default TestCaseSeries;
