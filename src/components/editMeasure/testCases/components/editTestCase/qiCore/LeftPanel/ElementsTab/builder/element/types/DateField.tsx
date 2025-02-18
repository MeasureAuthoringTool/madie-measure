// import React from "react";
import React, { useRef, useState } from "react";

import PropTypes from "prop-types";
import { TextField } from "@madie/madie-design-system/dist/react";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  isYearFormat,
  getCurrentFormat,
  isValidDateTimeFormat,
  isYearMonthDayFormat,
  isYearMonthFormat,
} from "./DateTimeComponent";
dayjs.extend(utc);
dayjs.utc();

const generateTextFieldInput = (value) => {
  if (isValidDateTimeFormat(value)) {

  } else if (isYearMonthDayFormat(value)) {

  } else if (isYearMonthFormat(value)) {

  } else if (isYearFormat(value)) {
    return `00/00/${value}`
  }
};

export const dateTextFieldStyle = {
  width: "170px",
  height: 40,
  marginTop: "8px",
  "& .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #8C8C8C",
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    "&&": {
      borderRadius: "3px",
    },
  },
  "& .MuiInputBase-input": {
    color: "#333333",
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px",
    Width: "170px",
    "&::placeholder": {
      opacity: 1,
      color: "#717171",
      fontFamily: "Rubik",
      fontSize: 14,
    },
  },
};

const DateField = ({
  id = "default_id",
  label,
  value,
  disabled,
  error,
  helperText,
  required = false,
  containerSx = {},
  textFieldSx = {},
  views,
  onChange,
  ...rest
}) => {
  // const inputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef()

  if (containerSx === undefined || containerSx === null) {
    containerSx = {};
  }
  if (textFieldSx === undefined || textFieldSx === null) {
    textFieldSx = {};
  }
  console.log("value passed into dateField", value);

  const isOnlyYear = (date) =>
    date.year() && date.month() === "NaN" && date.date() === "NaN";
  console.log("value is", value);
  console.log('views are',)
  return (
      <Box sx={{ ...containerSx }}>
        <DatePicker
          // key={value?.toISOString() || "empty"}
          emptyLabel="custom label"
          // value={value ? dayjs.utc(value) : null}
          value={value || null}
          onChange={onChange}
          views={views}
          disabled={disabled}
          onClose={() => rest?.onBlur()}
          slotProps={{
            textField: (params) => {
              const { InputProps } = params;
              console.log('inputProps', InputProps);
              InputProps["data-testid"] = id;
              InputProps["aria-required"] = required;
              // InputProps: {
                // ...InputProps,
                // InputProps.value=  value ? dayjs(value).format("MM/DD/YYYY") : "" // Override display value
              // },
              // InputProps.value = generatedStringInput;
              return {
                id: id,
                label,
                sx: { ...dateTextFieldStyle, ...textFieldSx },
                placeholder: "TEST",
                error: error,
                helperText: helperText,
                onBlur: rest?.onBlur,
                // key: value?.toISOString() || "empty"
              };
            },
            openPickerButton: {
              id: `${id}-open-picker-button`,
              //@ts-ignore
              dataTestId: `${id}-open-picker-button`,
            },
          }}
          slots={{ textField: TextField }}
          {...rest}
        />
      </Box>
  );
};
export default DateField;
