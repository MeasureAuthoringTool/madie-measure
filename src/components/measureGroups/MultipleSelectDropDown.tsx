import React from "react";
import { FormControl, Autocomplete, TextField, Checkbox } from "@mui/material";
import PropTypes from "prop-types";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import FormHelperText from "@mui/material/FormHelperText";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const autoCompleteStyles = {
  borderRadius: "3px",
  border: "1px solid #DDDDDD",
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
  width: "100%",
};

const MultipleSelectDropDown = ({
  id,
  label,
  placeHolder = undefined,
  defaultValue = undefined,
  required = false,
  disabled = false,
  error = false,
  helperText = undefined,
  options,
  multipleSelect = true,
  limitTags = 1,
  formControl,
  ...rest
}) => {
  return (
    <FormControl error={error} fullWidth sx={{ paddingRight: 2 }}>
      <InputLabel htmlFor={`${id}`} required={required}>
        {label}
      </InputLabel>
      {!disabled && (
        <Autocomplete
          size="small"
          limitTags={limitTags}
          multiple={multipleSelect}
          sx={autoCompleteStyles}
          disablePortal
          id={id}
          placeholder={placeHolder}
          defaultValue={defaultValue}
          disabled={disabled}
          data-testid={`${id}-dropdown`}
          options={options}
          disableCloseOnSelect
          getOptionLabel={(option) => option}
          renderOption={(props: any, option, { selected }) => {
            const uniqueProps = {
              ...props,
              key: `${props.key}_${props.id}`,
            };
            return (
              <li {...uniqueProps}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select All That Apply"
              /* Setting the describedby here does make MacOS's VoiceOver
                read the helper text, but it also messes up the styling for some reason... */
              // inputProps={{
              //   "aria-describedby": "measure-group-type-helper-text",
              // }}
            />
          )}
          {...rest}
        />
      )}
      {helperText && (
        <FormHelperText
          data-testid={`${id}-helper-text`}
          id={`${id}-helper-text`}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

MultipleSelectDropDown.propTypes = {
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
  multipleSelect: PropTypes.bool,
  limitTags: PropTypes.number,
  formControl: PropTypes.any,
};

export default MultipleSelectDropDown;
