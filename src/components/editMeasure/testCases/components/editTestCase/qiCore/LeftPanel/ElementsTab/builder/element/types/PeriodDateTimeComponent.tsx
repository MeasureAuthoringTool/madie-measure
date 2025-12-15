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
import { Select, TimeField } from "@madie/madie-design-system/dist/react";
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
  onChange, // expects { start, end }
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

    setUserSelectedFormat(false);
  }, [value]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ marginBottom: "16px", maxWidth: 220 }}>
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
            setFormat(value);
            setUserSelectedFormat(true);
            setStartDate(null);
            setEndDate(null);
            setStartTime(null);
            setEndTime(null);
            onChange({ start: "", end: "" });
          }}
          placeHolder={{ name: "Select Format", value: "" }}
          value={format ? format : ""}
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
              onChange({
                start: parsedDate.format(format),
                end: endDate?.format(format) || "",
              });
            }}
          >
            <DateField
              label="Start Date"
              format={format}
              required={fieldRequired}
              error={error.start}
              helperText={helperText.start}
              value={startDate}
              views={format ? formatMap[format] : ["year"]}
              disabled={!canEdit || !format || format === "Invalid Format"}
              placeholder={format ? formatOptionRenderMap[format] : ""}
              id={`start-${format || "year"}-field-${label}`}
              onChange={(newDate) => {
                if (!newDate) return;

                if (newDate.format(format) !== "Invalid Date") {
                  const dateUTC = dayjs.utc(newDate);
                  setStartDate(dateUTC);
                  if (format === DATE_TIME_ZONE_FORMAT && startTime) {
                    // Merge date and time
                    const merged = dateUTC
                      .hour(startTime.hour())
                      .minute(startTime.minute())
                      .second(startTime.second());
                    setStartDate(merged);
                    onChange({
                      start: merged.format(format),
                      end: endDate ? endDate.format(format) : "",
                    });
                  } else {
                    onChange({
                      start: dateUTC.format(format),
                      end: endDate ? endDate.format(format) : "",
                    });
                  }
                }
              }}
              onBlur={() => {}}
            />
            {format === DATE_TIME_ZONE_FORMAT && (
              <TimeField
                disabled={!canEdit || !startDate}
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
                  onChange({
                    start: merged.format(format),
                    end: endDate ? endDate.format(format) : "",
                  });
                }}
                value={startTime || startDate}
              />
            )}
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
              onChange({
                start: startDate ? startDate.format(format) : "",
                end: parsedDate.format(format),
              });
            }}
          >
            <DateField
              label="End Date"
              format={format}
              required={fieldRequired}
              error={error.end}
              helperText={helperText.end}
              value={endDate}
              views={format ? formatMap[format] : ["year"]}
              disabled={!canEdit || !format || format === "Invalid Format"}
              placeholder={format ? formatOptionRenderMap[format] : ""}
              id={`end-${format || "year"}-field-${label}`}
              onChange={(newDate) => {
                if (!newDate) return;

                if (newDate.format(format) !== "Invalid Date") {
                  const dateUTC = dayjs.utc(newDate);
                  setEndDate(dateUTC);
                  if (format === DATE_TIME_ZONE_FORMAT && endTime) {
                    // Merge date and time
                    const merged = dateUTC
                      .hour(endTime.hour())
                      .minute(endTime.minute())
                      .second(endTime.second());
                    setEndDate(merged);
                    onChange({
                      start: startDate ? startDate.format(format) : "",
                      end: merged.format(format),
                    });
                  } else {
                    onChange({
                      start: startDate ? startDate.format(format) : "",
                      end: dateUTC.format(format),
                    });
                  }
                }
              }}
              onBlur={() => {}}
            />
            {format === DATE_TIME_ZONE_FORMAT && (
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
                  onChange({
                    start: startDate ? startDate.format(format) : "",
                    end: merged.format(format),
                  });
                }}
                value={endTime || endDate}
              />
            )}
          </div>
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default PeriodDateTimeComponent;
