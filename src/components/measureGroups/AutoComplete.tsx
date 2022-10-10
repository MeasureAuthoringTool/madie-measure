import React from "react";
import { FormControl, Autocomplete, TextField } from "@mui/material";
import PropTypes from "prop-types";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import FormHelperText from "@mui/material/FormHelperText";

const autoCompleteStyles = {
  height: 40,
  border: "1px solid #DDDDDD",
  "& .MuiOutlinedInput-root": {
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
    padding: 0,
    height: 40,
  },

  "& .MuiInputBase-input": {
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 0.6,
    },
  },
};

const AutoComplete = ({
  id,
  label,
  placeHolder = undefined,
  defaultValue = undefined,
  required = false,
  disabled = false,
  error = false,
  helperText = undefined,
  options = [],
  ...rest
}) => {
  return (
    <FormControl error={error} fullWidth sx={{ paddingRight: 2 }}>
      <InputLabel htmlFor={`${label}-dropdown`} required={required}>
        {label}
      </InputLabel>
      {!disabled && (
        <Autocomplete
          sx={autoCompleteStyles}
          disablePortal
          id={id}
          placeholder={placeHolder}
          defaultValue={defaultValue}
          disabled={disabled}
          data-testid={`${id}-combo-box`}
          {...rest}
          options={options}
          renderInput={(params) => <TextField {...params} label="" />}
        />
      )}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

AutoComplete.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  placeHolder: PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.any,
  }), // expects placeholder objects of { name: value } and inserts into the render item function.
  defaultValue: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  formControl: PropTypes.any,
};

export default AutoComplete;
