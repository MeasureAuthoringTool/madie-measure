import React from "react";
import PropTypes from "prop-types";
import { InputLabel, TextField } from "@madie/madie-design-system/dist/react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { kebabCase } from "lodash";
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
  id,
  label,
  value,
  handleDateChange,
  disabled,
  error,
  helperText,
  ...rest
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <InputLabel
        data-testid={`${kebabCase(label)}`}
        style={{ marginBottom: 0, height: 16 }}
        sx={[
          {
            backgroundColor: "transparent",
            textTransform: "none",
            height: 17,
            left: 0,
            right: 0,
            top: 0,
            fontFamily: "Rubik",
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: 14,
            color: "#333333",
          },
        ]}
      >
        {`${label}`}
      </InputLabel>
      <DatePicker
        value={value ? dayjs.utc(value) : null}
        onChange={handleDateChange}
        disabled={disabled}
        slotProps={{
          textField: (params) => {
            const { InputProps } = params;
            InputProps["data-testid"] = id;
            InputProps["aria-required"] = true;

            return {
              id: id,
              sx: dateTextFieldStyle,
              value: value ? dayjs.utc(value) : null,
              onChange: handleDateChange,
              //...rest,
              error: error,
              helperText: helperText,
            };
          },
        }}
        slots={{ textField: TextField }}
      />
    </LocalizationProvider>
  );
};
DateField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.object,
  handleDateChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default DateField;
