import React, { useState, useEffect } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { MenuItem as MuiMenuItem, IconButton, Tooltip } from "@mui/material";
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
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.utc().format();

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
export const formatOptionRenderMap = {
  [YEAR_FORMAT]: "YYYY",
  [YEAR_MONTH_FORMAT]: "MM-YYYY",
  [YEAR_MONTH_DAY_FORMAT]: "MM-DD-YYYY",
  [DATE_TIME_ZONE_FORMAT]: "MM-DD-YYYYTHH:mm:ssZ",
};
export const formatRank = {
  [YEAR_FORMAT]: 1,
  [YEAR_MONTH_FORMAT]: 2,
  [YEAR_MONTH_DAY_FORMAT]: 3,
  [DATE_TIME_ZONE_FORMAT]: 4,
};

export const isFormatLessComplex = (format: string, currentFormat: string) => {
  return formatRank[format] < formatRank[currentFormat];
};

const dateRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;
const isValidFormattedDate = (dateString: string) => {
  if (!dateRegex.test(dateString)) return false;
  const parsedDate = dayjs.tz(dateString);
  return parsedDate.isValid();
};

export const getCurrentFormat = (dateStr: string) => {
  if (dayjs(dateStr, YEAR_FORMAT, true).isValid()) {
    return YEAR_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid()) {
    return YEAR_MONTH_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid()) {
    return YEAR_MONTH_DAY_FORMAT;
  } else if (isValidFormattedDate(dateStr)) {
    return DATE_TIME_ZONE_FORMAT;
  } else {
    return "Invalid Format";
  }
};

const renderFormats = (formats: string[]) => {
  return [
    ...formats.map((value) => (
      <MuiMenuItem
        key={`${value}-option`}
        value={value}
        data-testid={`${value}-option`}
      >
        {formatOptionRenderMap[value]}
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
  helperText,
  setTouched,
  showAddAttributeButton,
  handleAddElement,
  addTitle,
  showDeleteButton = false,
  handleDeleteElement,
}: TypeComponentProps) => {
  const [format, setFormat] = useState<string>(null);
  const [date, setDate] = useState<any>(null); // dayjs obj
  /*
    When a value comes in it could be either
    YYYY,
    YYYY-MM,
    YYYY-MM-DD
    YYYY-MM-DDThh:mm:ss+zz:zz
    This means that a user can update the date string in partial values
  */

  // set the format of value
  useEffect(() => {
    if (value) {
      const format = getCurrentFormat(value);
      if (format === "Invalid Format") {
        setFormat(format);
        setDate(null);
        setTouched();
      } else {
        setFormat(format);
        setDate(dayjs.utc(value));
      }
    } else {
      // we don't have a value here we're just going to set nothing on the format
      setFormat(YEAR_MONTH_DAY_FORMAT);
      setDate(null);
    }
  }, [value]);

  return (
    <div className="element-editor-add-row">
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
              alignItems: "flex-end",
            }}
            data-testid="date-div"
          >
            {/* select a format and render a picker */}
            <div>
              <Select
                style={{ height: "38.125px", marginBottom: "2px" }}
                required={fieldRequired}
                id={`date-time-format-selector-${label}`}
                label="Date Precision Level"
                inputProps={{
                  "data-testid": `date-time-format-selector-input-field-${label}`,
                  "aria-describedby": `date-time-format-selector-input-field-helper-text-${label}`,
                }}
                data-testid={`date-time-format-selector-field-${label}`}
                readOnly={!canEdit}
                SelectDisplayProps={{
                  "aria-required": "true",
                }}
                options={renderFormats(formatOptions1)}
                renderValue={(e) => {
                  return formatOptionRenderMap[e];
                }}
                onChange={(event) => {
                  const { value } = event.target;
                  if (format) {
                    // if we're going to a less complex format, we want to trigger an onChange instead
                    if (isFormatLessComplex(value, format)) {
                      if (date) {
                        onChange(date.format(value));
                      }
                    } else {
                      setDate(null); // blank the date if we're going to a more complex format since we cant make up values
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
              helperText={helperText}
              value={date}
              views={format ? formatMap[format] : ["year"]}
              disabled={!canEdit || !format || format === "Invalid Format"}
              format={format}
              placeholder={format ? formatOptionRenderMap[format] : ""}
              id={`${format || "year"}-field-${label}`}
              onChange={(newDate) => {
                if (!newDate) return;
                const dateUTC = dayjs.utc(newDate);
                if (
                  format === DATE_TIME_ZONE_FORMAT &&
                  isValidFormattedDate(dateUTC.format(format))
                ) {
                  onChange(dateUTC.format(format));
                } else if (dateUTC.format(format) !== "Invalid Date") {
                  onChange(dateUTC.format(format));
                }
                setDate(dateUTC);
              }}
              onBlur={() => {}}
            />
            {format === DATE_TIME_ZONE_FORMAT && (
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
                    const utcTime = dayjs.utc(time);
                    if (
                      isValidFormattedDate(
                        utcTime.format(DATE_TIME_ZONE_FORMAT)
                      )
                    ) {
                      onChange(utcTime.format(DATE_TIME_ZONE_FORMAT));
                    }
                    setDate(utcTime);
                  }}
                  value={date}
                />
              </div>
            )}
          </div>
        </LocalizationProvider>
      </Box>
      {showDeleteButton && canEdit && (
        <Tooltip title="Delete" placement="top" arrow>
          <IconButton
            onClick={handleDeleteElement}
            data-testid={`delete-button-${label}`}
            aria-label={`delete ${label}`}
            size="small"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}
    </div>
  );
};

export default DateTimeComponent;
