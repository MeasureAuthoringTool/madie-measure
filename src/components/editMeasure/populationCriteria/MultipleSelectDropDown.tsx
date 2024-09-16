import React from "react";
import { FormControl, Autocomplete, Checkbox } from "@mui/material";
import PropTypes from "prop-types";
import { TextField } from "@madie/madie-design-system/dist/react/";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const autoCompleteStyles = {
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
  "& .Mui-disabled": {
    backgroundColor: "#EDEDED",
    border: "#EDEDED",
  },
  "& .MuiChip-deleteIcon": {
    color: "#757575 !important",
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
  textFieldInputProps = undefined,
  tooltipText = "",
  onClose,
  key = undefined,
  handleToggleSelectAll = undefined,
  value,
  ...rest
}) => {
  const requiredLabelReadable = <span className="sr-only">required</span>;
  const labelReadable = required ? (
    <span>
      {label} {requiredLabelReadable}
    </span>
  ) : (
    label
  );
  // we're putting Select All in as an option to please the 508 since other ways to add it will modify html bad
  return (
    <FormControl
      error={error}
      fullWidth
      key={key}
      data-testid={`${id}-formcontrol`}
    >
      <div
        style={{
          width: 1,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      />
      <Autocomplete
        value={value}
        aria-required
        size="small"
        limitTags={limitTags}
        multiple={multipleSelect}
        sx={autoCompleteStyles}
        disablePortal
        id={id}
        onClose={onClose}
        placeholder={placeHolder}
        defaultValue={defaultValue}
        disabled={disabled}
        data-testid={`${id}-dropdown`}
        options={options}
        disableCloseOnSelect
        getOptionLabel={(option) => option}
        renderOption={(props: any, option, { selected }) => {
          const inputKey = `${props.key}_${props.id}`;
          const uniqueProps = {
            ...props,
            key: inputKey === "_" ? option : inputKey,
          };
          if (option === "Select All") {
            // we're assuming Select All is provided as an option that is OUTSIDE of formik for a coherent source of truth. It cannot be added to the form
            const allSelected = value?.length === options?.length - 1;
            selected = allSelected;
            uniqueProps.onClick = handleToggleSelectAll;
          }
          return (
            <li
              {...uniqueProps}
              aria-label={`option ${option} ${
                selected ? "selected" : "not selected"
              }`}
            >
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
        renderInput={(params) => {
          const { inputProps } = params;
          inputProps["aria-required"] = required;
          inputProps["aria-describedby"] =
            textFieldInputProps?.["aria-describedby"] ??
            "measure-group-type-helper-text";
          inputProps["aria-label"] =
            textFieldInputProps?.["aria-label"] ??
            "Measure types multiple measure types can be selected";

          return (
            <TextField
              label={labelReadable}
              placeholder="Select All That Apply"
              tooltipText={tooltipText}
              {...params}
              required={required}
              helperText={helperText}
              error={error}
            />
          );
        }}
        {...rest}
      />
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
  defaultValue: PropTypes.any,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  handleToggleSelectAll: PropTypes.func,
  helperText: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  multipleSelect: PropTypes.bool,
  limitTags: PropTypes.number,
  textFieldInputProps: PropTypes.shape({
    "aria-describedby": PropTypes.string,
    "aria-label": PropTypes.string,
  }),
};

export default MultipleSelectDropDown;
