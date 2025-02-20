import React, { useState, useEffect } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Box from "@mui/material/Box";
import { LocalizationProvider } from "@mui/x-date-pickers";
import timezone from "dayjs/plugin/timezone";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { Select, InputLabel } from "@madie/madie-design-system/dist/react";
import DateField from "./DateField";
import {
  isFormatLessComplex,
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
} from "./DateTimeComponent";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.utc().format();

const formatOptions1 = [YEAR_FORMAT, YEAR_MONTH_FORMAT, YEAR_MONTH_DAY_FORMAT];
const formatMap = {
  [YEAR_FORMAT]: ["year"],
  [YEAR_MONTH_FORMAT]: ["year", "month"],
  [YEAR_MONTH_DAY_FORMAT]: ["year", "month", "day"],
};

export const isYearFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_FORMAT, true).isValid();
};
export const isYearMonthFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid();
};
export const isYearMonthDayFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid();
};

export const getCurrentFormat = (dateStr) => {
  if (dayjs(dateStr, YEAR_FORMAT, true).isValid()) {
    return YEAR_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid()) {
    return YEAR_MONTH_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid()) {
    return YEAR_MONTH_DAY_FORMAT;
  } else {
    return "Invalid format";
  }
};

const renderFormats = (formats) => {
  return [
    ...formats.map((value) => (
      <MuiMenuItem
        key={`${value}-option`}
        value={value}
        data-testid={`${value}-option`}
      >
        {value}
      </MuiMenuItem>
    )),
  ];
};
const DateTimeComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "DateTime",
  error,
}: TypeComponentProps) => {
  const [format, setFormat] = useState<string>();
  useEffect(() => {
    if (value) {
      setFormat(getCurrentFormat(value));
    } else {
      setFormat(null);
    }
  }, [value]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <InputLabel required={fieldRequired}>{label}</InputLabel>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexGrow: 1,
            columnGap: "32px",
            minWidth: "200px",
          }}
          data-testid="date-div"
        >
          {/* select a format and render a picker */}
          <Select
            style={{ height: "38.125px", marginBottim: "2px" }}
            required={fieldRequired}
            id={`date-format-selector-${label}`}
            label={`Format`}
            inputProps={{
              "data-testid": `date-format-selector-input-field-${label}`,
              "aria-describedby": `date-format-selector-input-field-helper-text-${label}`,
            }}
            data-testid={`date-format-selector-field-${label}`}
            disabled={!canEdit}
            SelectDisplayProps={{
              "aria-required": "true",
            }}
            options={renderFormats(formatOptions1)}
            onChange={(event) => {
              const newFormat = event.target.value;
              if (format) {
                // if we're going to a less complex format, we want to trigger an onChange instead
                if (isFormatLessComplex(newFormat, format)) {
                  if (dayjs(value)) {
                    onChange(dayjs(value).format(newFormat));
                  }
                }
              }
              setFormat(event.target.value);
            }}
            placeHolder={{ name: "Select Format", value: "" }}
            value={format ? format : ""}
          ></Select>

          <DateField
            label="Date Field"
            placeholder={format}
            required={fieldRequired}
            error={error}
            helperText={undefined}
            value={value ? dayjs(value) : null}
            views={format ? formatMap[format] : ["year"]}
            disabled={!canEdit || !format}
            id={`${format || "year"}-field-${label}`}
            onChange={(date) => {
              if (date) {
                if (date.format(format) !== "Invalid Date") {
                  onChange(date.format(format));
                }
              }
            }}
            onBlur={() => {}}
          />
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default DateTimeComponent;
//
