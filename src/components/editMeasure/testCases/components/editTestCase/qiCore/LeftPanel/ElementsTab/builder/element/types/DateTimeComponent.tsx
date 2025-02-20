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
  offset?: string;
}
// Iana Codes. If you pass in just number they work only in source.
// same thing fails in test. Need to use the aiana timecode instead.
const timezones = [
  // { value: "America/New_York", offset: "-04:00", label: "EDT" }, //daylight savings time issues -05:00 || -04:00
  { value: "America/Puerto_Rico", offset: "-04:00", label: "AST" }, // works
  // daylight savings time starts second Sunday in March. At 2:00 AM
  { value: "America/New_York", offset: "-05:00", label: "EST" }, //daylight savings time issues -05:00 || -04:00
  { value: "America/Chicago", offset: "-06:00", label: "CST" }, //daylight savings time issues -06 || -05
  { value: "America/Denver", offset: "-07:00", label: "MST" }, //daylight savings time issues -6 or -7
  { value: "America/Los_Angeles", offset: "-08:00", label: "PST" }, //daylight savings time issues -7 or -8
  { value: "US/Alaska", offset: "-09:00", label: "AKST" }, //daylight savings time issues -8 or -9
  // first Sunday in November in the U.S. At 2:00 AM
  { value: "Pacific/Honolulu", offset: "-10:00", label: "HST" }, // works
  { value: "Pacific/Pago_Pago", offset: "-11:00", label: "SST" }, // works
  { value: "Pacific/Guam", offset: "+10:00", label: "CHST" }, // works
];

export const YEAR_FORMAT = "YYYY";
export const YEAR_MONTH_FORMAT = "YYYY-MM";
export const YEAR_MONTH_DAY_FORMAT = "YYYY-MM-DD";
export const DATE_TIME_ZONE_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";

export const formatOptions1 = [
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
];
export const formatMap = {
  [YEAR_FORMAT]: ["year"],
  [YEAR_MONTH_FORMAT]: ["year", "month"],
  [YEAR_MONTH_DAY_FORMAT]: ["year", "month", "day"],
  [DATE_TIME_ZONE_FORMAT]: ["year", "day", "month"],
};
export const formatRank = {
  [YEAR_FORMAT]: 1,
  [YEAR_MONTH_FORMAT]: 2,
  [YEAR_MONTH_DAY_FORMAT]: 3,
  [DATE_TIME_ZONE_FORMAT]: 4,
};

export const isFormatLessComplex = (format, currentFormat) => {
  return formatRank[format] < formatRank[currentFormat];
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
    ...options.map(({ value, label, offset }) => (
      <MuiMenuItem
        key={`${offset}-option`}
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
  const [timeZone, setTimeZone] = useState(null);
  console.log("date", date);
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
      const format = getCurrentFormat(value);
      if (format === DATE_TIME_ZONE_FORMAT) {
        const dayjsObject = dayjs(value);
        const timezoneOffset = value.slice(-6);
        if (timezoneOffset) {
          const selectedTimezone = timezones.find((v) => {
            return v.offset === timezoneOffset;
          });
          setTimeZone(selectedTimezone.value);
        }
        setDate(dayjsObject);
      } else {
        setDate(dayjs(value));
      }
      setFormat(getCurrentFormat(value));
    } else {
      // we don't have a value here we're just going to set nothing on the format
      setFormat(null);
      setDate(null);
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
          <div>
            <Select
              style={{ height: "38.125px", marginBottom: "2px" }}
              required={fieldRequired}
              id={`date-time-format-selector-${label}`}
              label={`Format`}
              inputProps={{
                "data-testid": `date-time-format-selector-input-field-${label}`,
                "aria-describedby": `date-time-format-selector-input-field-helper-text-${label}`,
              }}
              data-testid={`date-time-format-selector-field-${label}`}
              disabled={!canEdit}
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              options={renderFormats(formatOptions1)}
              onChange={(event) => {
                const { value } = event.target;
                if (format) {
                  // if we're going to a less complex format, we want to trigger an onChange instead
                  if (isFormatLessComplex(value, format)) {
                    if (date) {
                      onChange(date.format(value));
                    }
                  } else {
                    setDate(null);
                  }
                }
                setFormat(event.target.value);
              }}
              placeHolder={{ name: "Select Format", value: "" }}
              value={format ? format : ""}
            ></Select>
          </div>

          <DateField
            label="Date Field"
            required={fieldRequired}
            error={error}
            helperText={undefined}
            value={date ? dayjs(date) : null}
            views={format ? formatMap[format] : ["year"]}
            disabled={!canEdit || !format}
            placeholder={format || ""}
            id={`${format || "year"}-field-${label}`}
            onChange={(date) => {
              if (date) {
                // this breaks without tz
                if (format === DATE_TIME_ZONE_FORMAT) {
                  if (
                    isValidFormattedDate(date.format(DATE_TIME_ZONE_FORMAT))
                  ) {
                    if (timeZone) {
                      // its not valid until we have a timezone
                      onChange(date.tz(timeZone).format(DATE_TIME_ZONE_FORMAT));
                    } else {
                      setDate(date);
                    }
                  }
                }
                // works for year, ym, ydm
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
                  id={`time-field-${label}`}
                  seconds
                  views={["hours", "minutes", "seconds"]}
                  data-testid="time-input"
                  handleTimeChange={(time) => {
                    if (
                      isValidFormattedDate(time.format(DATE_TIME_ZONE_FORMAT))
                    ) {
                      if (timeZone) {
                        onChange(
                          time.tz(timeZone).format(DATE_TIME_ZONE_FORMAT)
                        );
                      } else {
                        setDate(time);
                      }
                    } else {
                      setDate(time);
                    }
                  }}
                  value={date}
                />
              </div>
              <div style={{ minWidth: "inherit" }}>
                <Select
                  style={{ height: "38.125px", marginBottim: "2px" }}
                  required={fieldRequired}
                  id={`timezone-selector-${label}`}
                  label={`Zone`}
                  inputProps={{
                    "data-testid": `timezone-input-field-${label}-input`,
                    "aria-describedby": `timezone-input-field-helper-text-${label}`,
                  }}
                  data-testid={`timezone-selector-${label}`}
                  disabled={!canEdit || !date}
                  SelectDisplayProps={{
                    "aria-required": "true",
                  }}
                  value={timeZone || null}
                  options={renderMenuItems(timezones)}
                  renderValue={(value) => {
                    if (value) {
                      return timezones.find((zone) => zone.value === value)
                        ?.label;
                    }
                    return value;
                  }}
                  onChange={(event) => {
                    const { value } = event.target;
                    const appendedTimeZone = date.tz(value);
                    onChange(appendedTimeZone.format(DATE_TIME_ZONE_FORMAT));
                  }}
                ></Select>
              </div>
            </>
          )}
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default DateTimeComponent;
//
