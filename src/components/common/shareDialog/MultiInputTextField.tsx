import React from "react";
import { Autocomplete, Chip } from "@mui/material";
import { TextField } from "@madie/madie-design-system/dist/react/";

const multiChipStyles = {
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
    paddingTop: 1,
    paddingBottom: 1,
  },
  "& input::placeholder": {
    fontSize: "14px",
  },
  width: "100%",
};

interface MultiInputTextFieldProps {
  id: string;
  label: string;
  value: string[];
  onChipsChange: (chips: string[]) => void;
  inputValue: string;
  onInputValueChange: (val: string) => void;
  error?: boolean;
  helperText?: string;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
}

const MultiInputTextField = ({
  id,
  label,
  value,
  onChipsChange,
  inputValue,
  onInputValueChange,
  error,
  helperText,
  onBlur,
  onFocus,
}: MultiInputTextFieldProps) => {
  const handleInputChange = (
    _: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    if (reason === "reset") return;
    if (newInputValue.includes(",")) {
      const parts = newInputValue.split(",");
      const newChips = parts
        .slice(0, -1)
        .map((p) => p.replace(/\s/g, ""))
        .filter(Boolean);
      if (newChips.length > 0) {
        const toAdd = newChips.filter((chip) => !value.includes(chip));
        if (toAdd.length > 0) {
          onChipsChange([...value, ...toAdd]);
        }
      }
      onInputValueChange(parts[parts.length - 1]);
    } else {
      onInputValueChange(newInputValue);
    }
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      id={id}
      options={[]}
      value={value}
      inputValue={inputValue}
      sx={multiChipStyles}
      onChange={(_, newValue) => onChipsChange(newValue as string[])}
      onInputChange={handleInputChange}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option}
            size="small"
            {...getTagProps({ index })}
            data-testid={`harp-chip-${option}`}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          inputProps={{
            ...params.inputProps,
            "data-testid": `${id}`,
          }}
          error={error}
          helperText={helperText}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      )}
    />
  );
};

export default MultiInputTextField;
