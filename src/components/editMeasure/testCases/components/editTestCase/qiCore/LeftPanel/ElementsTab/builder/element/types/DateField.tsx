import React from "react";
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
  handleDateChange,
  disabled,
  error,
  helperText,
  required = false,
  containerSx = {},
  textFieldSx = {},
  ...rest
}) => {
  if (containerSx === undefined || containerSx === null) {
    containerSx = {};
  }
  if (textFieldSx === undefined || textFieldSx === null) {
    textFieldSx = {};
  }
  let coercedValue = null;

  let generatedStringInput = generateTextFieldInput(value);


  if (isYearFormat(value)) {
    console.log("truth it is ", value);
    // if it's a year format we want to avoid populating the other dayjs values
    const yearOnly = dayjs(value).utc();
    // @ts-ignore
    yearOnly.$D = 0;
    // @ts-ignore
    yearOnly.$W = 0;

    console.log(yearOnly);
    // value = yearOnly;
    coercedValue = yearOnly;
  }

  console.log("value passed into dateField", value);

  const isOnlyYear = (date) =>
    date.year() && date.month() === "NaN" && date.date() === "NaN";
  console.log("value is", value);
  const manipulateDate = (v) => {
    if (isOnlyYear(v)) {
    }
  };
  const handleInput = (v) => {
    console.log("input is", v);
    handleDateChange(v);
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ ...containerSx }}>
        <DatePicker
          // value={value ? dayjs.utc(value) : null}
          // value={dayjs(value)}
          onChange={(v) => {
            manipulateDate(v);
          }}
          // views={['year']}
          disabled={disabled}
          onClose={() => rest?.onBlur()}
          slotProps={{
            textField: (params) => {
              const { InputProps } = params;
              InputProps["data-testid"] = id;
              InputProps["aria-required"] = required;
              InputProps.value = generatedStringInput;
              return {
                id: id,
                label,
                sx: { ...dateTextFieldStyle, ...textFieldSx },
                value: value ? value : null,
                onChange: handleDateChange,
                // onChange: (v) => {
                //   handleInput(v);
                // },
                //...rest,
                error: error,
                helperText: helperText,
                onBlur: rest?.onBlur,
              };
            },
            openPickerButton: {
              id: `${id}-open-picker-button`,
              //@ts-ignore
              dataTestId: `${id}-open-picker-button`,
            },
          }}
          slots={{ textField: TextField }}
        />
      </Box>
    </LocalizationProvider>
  );
};
export default DateField;
