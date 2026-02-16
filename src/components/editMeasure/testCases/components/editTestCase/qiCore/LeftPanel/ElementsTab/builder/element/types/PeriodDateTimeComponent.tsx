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
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import DateField from "./DateField";
import { formatOptionRenderMap } from "./DateTimeComponent";

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
  [DATE_TIME_ZONE_FORMAT]: ["year", "month", "day"],
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
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/;
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

const PeriodDateTimeComponent = ({
  canEdit,
  fieldRequired,
  value = {},
  onChange, // expects { start, end } and only returns filled fields, or undefined if both empty
  label = "DateTime",
  error = {},
  helperText = {},
}: TypeComponentProps) => {
  const [format, setFormat] = useState<string>(null);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [userSelectedFormat, setUserSelectedFormat] = useState(false);
  const [startTime, setStartTime] = useState<any>(null);
  const [endTime, setEndTime] = useState<any>(null);

  useEffect(() => {
    const start = value?.start;
    const end = value?.end;

    // Only set format from value if the user has NOT manually selected a format
    if (!userSelectedFormat) {
      const fmt = start
        ? getCurrentFormat(start)
        : end
        ? getCurrentFormat(end)
        : YEAR_MONTH_DAY_FORMAT;
      setFormat(fmt === "Invalid Format" ? null : fmt);
    }

    setStartDate(
      start && getCurrentFormat(start) !== "Invalid Format"
        ? dayjs.utc(start)
        : null
    );
    setEndDate(
      end && getCurrentFormat(end) !== "Invalid Format" ? dayjs.utc(end) : null
    );

    setStartTime(
      start && getCurrentFormat(start) === DATE_TIME_ZONE_FORMAT
        ? dayjs.utc(start)
        : null
    );
    setEndTime(
      end && getCurrentFormat(end) === DATE_TIME_ZONE_FORMAT
        ? dayjs.utc(end)
        : null
    );
  }, [value, userSelectedFormat]);

  // Helper function to build the period object with only filled fields
  // Returns undefined if both fields are empty (to remove the period key from JSON)
  const buildPeriodValue = (
    startValue: string | null,
    endValue: string | null
  ) => {
    const period: { start?: string; end?: string } = {};
    if (startValue?.trim()) period.start = startValue;
    if (endValue?.trim()) period.end = endValue;
    return period.start || period.end ? period : undefined;
  };

  // Centralized function to update period with current start/end state
  const updatePeriod = (newStartDate: any, newEndDate: any) => {
    const startValue = newStartDate ? newStartDate.format(format) : null;
    const endValue = newEndDate ? newEndDate.format(format) : null;
    onChange(buildPeriodValue(startValue, endValue));
  };

  // When the Select switches to readOnly, prevent the resulting ReadOnlyTextField's style from being overwritten
  const selectProps: any = {};
  if (canEdit) {
    selectProps.style = { height: "38.125px", marginBottom: "2px" };
  }
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      data-component-type="PeriodDateTimeComponent"
    >
      <div style={{ marginBottom: "16px", maxWidth: 220 }}>
        <Select
          readOnly={!canEdit}
          required={fieldRequired}
          id={`date-time-format-selector-${label}`}
          label="Date Precision Level"
          inputProps={{
            "data-testid": `date-time-format-selector-input-field-${label}`,
            "aria-describedby": `date-time-format-selector-input-field-helper-text-${label}`,
          }}
          data-testid={`date-time-format-selector-field-${label}`}
          SelectDisplayProps={{
            "aria-required": "true",
          }}
          options={renderFormats(formatOptions1)}
          renderValue={(e) => {
            return formatOptionRenderMap[e];
          }}
          onChange={(event) => {
            const { value } = event.target;
            setFormat(value);
            setStartDate(null);
            setEndDate(null);
            setStartTime(null);
            setEndTime(null);
            setUserSelectedFormat(true);
            onChange(undefined);
          }}
          placeHolder={{ name: "Select Format", value: "" }}
          value={format ? format : ""}
          {...selectProps}
        />
      </div>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "32px",
            alignItems: "flex-end",
          }}
          data-testid="date-div"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
            onPaste={(e) => {
              const pastedValue = e.clipboardData.getData("text");
              const parsedDate = dayjs.utc(pastedValue).startOf("day");
              if (!parsedDate.isValid()) {
                console.error("Invalid date format pasted:", pastedValue);
                return;
              }
              setStartDate(parsedDate);
              updatePeriod(parsedDate, endDate);
            }}
          >
            <DateField
              label="Start Date"
              format={format}
              readOnly={!canEdit}
              required={fieldRequired}
              error={error.start}
              helperText={helperText.start}
              value={startDate}
              views={format ? formatMap[format] : ["year"]}
              disabled={!canEdit || !format || format === "Invalid Format"}
              placeholder={format ? formatOptionRenderMap[format] : ""}
              id={`start-${format || "year"}-field-${label}`}
              onChange={(newDate) => {
                // Handle clearing the field
                if (!newDate || newDate.format(format) === "Invalid Date") {
                  setStartDate(null);
                  setStartTime(null);
                  updatePeriod(null, endDate);
                  return;
                }

                const dateUTC = dayjs.utc(newDate);

                if (format === DATE_TIME_ZONE_FORMAT && startTime) {
                  // Merge date and time
                  const merged = dateUTC
                    .hour(startTime.hour())
                    .minute(startTime.minute())
                    .second(startTime.second());
                  setStartDate(merged);
                  updatePeriod(merged, endDate);
                } else {
                  setStartDate(dateUTC);
                  updatePeriod(dateUTC, endDate);
                }
              }}
              onBlur={() => {}}
            />
            {format === DATE_TIME_ZONE_FORMAT &&
              (canEdit ? (
                <TimeField
                  disabled={!canEdit || !startDate}
                  readOnly={!canEdit}
                  required={fieldRequired}
                  label="Start Time"
                  id={`start-time-field-${label}`}
                  seconds
                  views={["hours", "minutes", "seconds"]}
                  data-testid="start-time-input"
                  handleTimeChange={(time) => {
                    if (!startDate) return;
                    const utcTime = dayjs.utc(time);
                    setStartTime(utcTime);
                    // Merge date and time
                    const merged = startDate
                      .hour(utcTime.hour())
                      .minute(utcTime.minute())
                      .second(utcTime.second());
                    setStartDate(merged);
                    updatePeriod(merged, endDate);
                  }}
                  value={startTime || startDate}
                />
              ) : (
                <ReadOnlyTextField
                  required={fieldRequired}
                  label={label}
                  id={`start-time-field-${label}`}
                  data-testid={`start-time-field-${label}`}
                  size="small"
                  value={
                    startTime || startDate
                      ? (startTime || startDate).format("HH:mm:ss a")
                      : "-"
                  }
                />
              ))}
          </div>
          <span style={{ alignSelf: "center", padding: "0 8px" }}>To</span>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
            onPaste={(e) => {
              const pastedValue = e.clipboardData.getData("text");
              const parsedDate = dayjs.utc(pastedValue).startOf("day");
              if (!parsedDate.isValid()) {
                console.error("Invalid date format pasted:", pastedValue);
                return;
              }
              setEndDate(parsedDate);
              updatePeriod(startDate, parsedDate);
            }}
          >
            <DateField
              label="End Date"
              format={format}
              required={fieldRequired}
              readOnly={!canEdit}
              error={error.end}
              helperText={helperText.end}
              value={endDate}
              views={format ? formatMap[format] : ["year"]}
              disabled={!canEdit || !format || format === "Invalid Format"}
              placeholder={format ? formatOptionRenderMap[format] : ""}
              id={`end-${format || "year"}-field-${label}`}
              onChange={(newDate) => {
                // Handle clearing the field
                if (!newDate || newDate.format(format) === "Invalid Date") {
                  setEndDate(null);
                  setEndTime(null);
                  updatePeriod(startDate, null);
                  return;
                }

                const dateUTC = dayjs.utc(newDate);

                if (format === DATE_TIME_ZONE_FORMAT && endTime) {
                  // Merge date and time
                  const merged = dateUTC
                    .hour(endTime.hour())
                    .minute(endTime.minute())
                    .second(endTime.second());
                  setEndDate(merged);
                  updatePeriod(startDate, merged);
                } else {
                  setEndDate(dateUTC);
                  updatePeriod(startDate, dateUTC);
                }
              }}
              onBlur={() => {}}
            />
            {format === DATE_TIME_ZONE_FORMAT &&
              (canEdit ? (
                <TimeField
                  disabled={!canEdit || !endDate}
                  required={fieldRequired}
                  label="End Time"
                  id={`end-time-field-${label}`}
                  seconds
                  views={["hours", "minutes", "seconds"]}
                  data-testid="end-time-input"
                  handleTimeChange={(time) => {
                    if (!endDate) return;
                    const utcTime = dayjs.utc(time);
                    setEndTime(utcTime);
                    // Merge date and time
                    const merged = endDate
                      .hour(utcTime.hour())
                      .minute(utcTime.minute())
                      .second(utcTime.second());
                    setEndDate(merged);
                    updatePeriod(startDate, merged);
                  }}
                  value={endTime || endDate}
                />
              ) : (
                <ReadOnlyTextField
                  required={fieldRequired}
                  label={label}
                  id={`end-time-field-${label}`}
                  data-testid={`end-time-field-${label}`}
                  size="small"
                  value={
                    endTime || endDate
                      ? (endTime || endDate).format("HH:mm:ss a")
                      : "-"
                  }
                />
              ))}
          </div>
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default PeriodDateTimeComponent;
