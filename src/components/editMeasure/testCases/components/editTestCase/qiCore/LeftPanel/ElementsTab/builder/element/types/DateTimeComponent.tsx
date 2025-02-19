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
import {
  Select,
  TimeField,
  InputLabel,
} from "@madie/madie-design-system/dist/react";
import DateField from "./DateField";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.utc().format();

interface MenuObj {
  value: string;
  label: string;
}
const options: MenuObj[] = [
  { value: "America/Puerto_Rico", label: "AST" },
  { value: "America/New_York", label: "EST" },
  { value: "America/Chicago", label: "CST" },
  { value: "America/Denver", label: "MST" },
  { value: "America/Los_Angeles", label: "PST" },
  { value: "America/Anchorage", label: "AKST" },
  { value: "America/Honolulu", label: "HST" },
  { value: "America/American_Samoa", label: "WST" },
  { value: "America/Saipan", label: "CHST" },
  { value: "America/Atikokan", label: "EST" },
  { value: "America/Barbados", label: "AST" },
  { value: "America/Bogota", label: "COT" },
  { value: "America/Belize", label: "CST" },
  { value: "America/Guatemala", label: "CST" },
  { value: "America/Cancun", label: "EST" },
  { value: "America/Regina", label: "CST" },
  { value: "America/Winnipeg", label: "CST" },
  { value: "America/Guayaquil", label: "ECT" },
  { value: "America/Los_Angeles", label: "PST" },
  { value: "America/Marigot", label: "AST" },
  { value: "America/Nassau", label: "EST" },
  { value: "America/Panama", label: "EST" },
  { value: "America/Toronto", label: "EST" },
  { value: "America/Thunder_Bay", label: "EST" },
  { value: "America/Moncton", label: "AST" },
  { value: "America/Edmonton", label: "MST" },
  { value: "America/Yellowknife", label: "MST" },
];

const timezones = [
  { id: "America/Puerto_Rico - AST", value: "-04:00", label: "AST" },
  { id: "America/New_York - EST", value: "-05:00", label: "EST" },
  { id: "America/Chicago - CST", value: "-06:00", label: "CST" },
  { id: "America/Denver - MST", value: "-07:00", label: "MST" },
  { id: "America/Los_Angeles - PST", value: "-08:00", label: "PST" },
  { id: "America/Anchorage - AKST", value: "-09:00", label: "AKST" },
  { id: "America/Honolulu - HST", value: "-10:00", label: "HST" },
  { id: "America/American_Samoa - WST", value: "-11:00", label: "WST" },
  { id: "America/Saipan - CHST", value: "+10:00", label: "CHST" },
  { id: "America/Bogota - COT", value: "-05:00", label: "COT" },
  { id: "America/Guayaquil - ECT", value: "-05:00", label: "ECT" },
];

const YEAR_FORMAT = "YYYY";
const YEAR_MONTH_FORMAT = "YYYY-MM";
const YEAR_MONTH_DAY_FORMAT = "YYYY-MM-DD";
const DATE_TIME_ZONE_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";

const formatOptions1 = [
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
];
const formatMap = {
  [YEAR_FORMAT]: ["year"],
  [YEAR_MONTH_FORMAT]: ["year", "month"],
  [YEAR_MONTH_DAY_FORMAT]: ["year", "month", "day"],
  [DATE_TIME_ZONE_FORMAT]: ["year", "month", "day"],
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
const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
const isValidFormattedDate = (dateString) => {
  if (!dateRegex.test(dateString)) return false; 
  const parsedDate = dayjs.tz(dateString); 
  return parsedDate.isValid(); 
};

export const getCurrentFormat = (dateStr) => {
  if (dayjs(dateStr, YEAR_FORMAT, true).isValid()) {
    return YEAR_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid()) {
    return YEAR_MONTH_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid()) {
    return YEAR_MONTH_DAY_FORMAT;
  } else if (isValidFormattedDate(dateStr)) {
    return DATE_TIME_ZONE_FORMAT;
  } else {
    return "Invalid format";
  }
};
const renderMenuItems = (options: MenuObj[]) => {
  return [
    ...timezones.map(({ value, label, id }) => (
      <MuiMenuItem
        key={`${id}-option`}
        value={value}
        data-testid={`${label}-option`}
      >
        {label}
      </MuiMenuItem>
    )),
  ];
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
  onChange, // onChange should Probably only be triggered once the fields are all filled out
  label = "DateTime",
  error,
}: TypeComponentProps) => {
  const [format, setFormat] = useState<string>(null);
  const [date, setDate] = useState<any>(null); // dayjs obj
  const [timeZone, setTimeZone] = useState("");
  console.log('timezone is', timeZone)
  /*
    When a value comes in it could be either 
    YYYY, 
    YYYY-MM, 
    YYYY-MM-DD
    YYYY-MM-DDThh:mm:ss+zz:zz

    This means that a user can update the date string in partial values
  */


  useEffect(() => {
    // we need to find out what type of dateTime format it is, and translate to related parts
    if (value) {
      console.log('value is', value)
      const format = getCurrentFormat(value);
      if (format === DATE_TIME_ZONE_FORMAT) {
        const dayjsObject = dayjs(value)
        const timezoneOffset = value.slice(-6)
        if (timezoneOffset){
          const selectedTimezone = timezones.find((v) => {
            return v.value === timezoneOffset
          })
          setTimeZone(selectedTimezone.label)
        }
        setDate(dayjsObject);
      }
      setFormat(getCurrentFormat(value));
    } else {
      // we don't have a value here we're just going to set nothing on the format
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
              setFormat(event.target.value);
            }}
            placeHolder={{ name: "Select Format", value: "" }}
            value={format ? format : ""}
          ></Select>

          <DateField
            label="Date Field"
            required={fieldRequired}
            error={error}
            helperText={undefined}
            value={date ? dayjs(date) : null}
            views={format ? formatMap[format] : ["year"]}
            disabled={!canEdit || !format}
            id="year-field"
            onChange={(date) => {
              if (date) {
                if (format === DATE_TIME_ZONE_FORMAT) {
                  console.log('its a timezone')
                  if (isValidFormattedDate(date.format(DATE_TIME_ZONE_FORMAT))){
                    onChange(date.tz(timeZone).format(DATE_TIME_ZONE_FORMAT))
                  } else {
                    setDate(date)
                  }
                } 
                else {
                  if (date.format(format) !== "Invalid Date") {
                    onChange(date.format(format));
                  }
                }
              }
            }}
            onBlur={() => {}}
          />

          {format === DATE_TIME_ZONE_FORMAT && (
            <>
              <div>
                <TimeField
                  disabled={!canEdit || !date}
                  required={fieldRequired}
                  label="Time Field"
                  id="time-field"
                  seconds
                  views={["hours", "minutes", "seconds"]}
                  data-testid="time-input"
                  handleTimeChange={(time) => {
                    console.log('time is', time);
                    if (isValidFormattedDate(time.format(DATE_TIME_ZONE_FORMAT))){
                      onChange(time.tz(timeZone).format(DATE_TIME_ZONE_FORMAT))
                      // if it's a valid format we need to update the json, if it's not we don't do anything
                    } else {
                      setDate(time);
                    }
                  }}
                  value={date}
                />
              </div>
              <Select
                style={{ height: "38.125px", marginBottim: "2px" }}
                required={fieldRequired}
                id={`timezone-selector-${label}`}
                label={`Zone`}
                inputProps={{
                  "data-testid": `timezone-input-field-${label}`,
                  "aria-describedby": `timezone-input-field-helper-text-${label}`,
                }}
                data-testid={`timezone-field-${label}`}
                disabled={!canEdit}
                SelectDisplayProps={{
                  "aria-required": "true",
                }}
                value={timeZone || null}
                options={renderMenuItems(options)}
                renderValue={(value) => {
                  console.log('true value of time is', value);
                  return value
                }}
                onChange={(event) => {
                  const { value } = event.target;
                  const appendedTimeZone = date.tz(value);
                  console.log('value im passing up', appendedTimeZone.format(DATE_TIME_ZONE_FORMAT))
                  onChange(appendedTimeZone.format(DATE_TIME_ZONE_FORMAT))

                }}
              ></Select>
            </>
          )}
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default DateTimeComponent;
//
