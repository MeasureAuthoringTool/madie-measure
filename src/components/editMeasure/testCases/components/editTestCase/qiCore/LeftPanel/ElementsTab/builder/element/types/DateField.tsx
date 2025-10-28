import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { TextField } from "@madie/madie-design-system/dist/react";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.utc();

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
  placeholder = "",
  format = null,
  ...rest
}) => {
  return (
    <Box sx={{ ...containerSx }}>
      <DatePicker
        emptyLabel="custom label"
        value={value}
        onChange={onChange}
        views={views}
        disabled={disabled}
        onClose={() => rest?.onBlur()}
        slotProps={{
          textField: (params) => {
            const { InputProps } = params;
            InputProps["data-testid"] = id;
            InputProps["aria-required"] = required;
            return {
              id: id,
              label,
              sx: { ...dateTextFieldStyle, ...textFieldSx },
              placeholder,
              error: error,
              helperText: helperText,
              onBlur: rest?.onBlur,
            };
          },
          field: (params) => {
            const copyParams = { ...params };
            // this code change fixes an edge case where the format psuedostate of the placeholder does not match the format.
            if (format === "YYYY-MM") {
              //@ts-ignore
              copyParams.format = "MM-YYYY";
            }
            return copyParams;
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
