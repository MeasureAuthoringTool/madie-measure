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
  // DateField,
  TimeField,
  InputLabel,
} from "@madie/madie-design-system/dist/react";
import DateField from "./DateField";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
// dayjs.utc().format();

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
  { value: "America/honolulu", label: "HST" },
  { value: "America/American_Samoa", label: "WST" },
  { value: "America/Saipan", label: "CHST" },
];

const offSets = [
  { id: "America/Puerto_Rico - AST", value: "-04:00" },
  { id: "America/New_York - EST", value: "-05:00" },
  { id: "America/Chicago - CST", value: "-06:00" },
  { id: "America/Denver - MST", value: "-07:00" },
  { id: "America/Los_Angeles - PST", value: "-08:00" },
  { id: "America/Anchorage - AKST", value: "-09:00" },
  { id: "America/honolulu - HST", value: "-10:00" },
  { id: "America/American_Samoa - WST", value: "-11:00" },
  { id: "America/Saipan - CHST", value: "+10:00" },
];

const getOffSet = (value) => {
  let result = "-05:00";
  if (value) {
    offSets.forEach((opt) => {
      if (opt.id === value) {
        result = opt.value;
      }
    });
  }
  return result;
};

const findByOffSet = (value) => {
  let result = "America/New_York - EST";
  if (value) {
    offSets.forEach((opt) => {
      if (opt.value === value) {
        result = opt.id;
      }
    });
  }
  return result;
};
const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "HH:mm:ss";
const DATE_TIME_ZONE_FORMAT = "YYYY-MM-DDThh:mm:ss+zz:zz";

const YEAR_FORMAT = "YYYY";
const YEAR_MONTH_FORMAT = "YYYY-MM";
const YEAR_MONTH_DAY_FORMAT = "YYYY-MM-DD";

export const isYearFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_FORMAT, true).isValid();
};
export const isYearMonthFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid();
};
export const isYearMonthDayFormat = (dateStr) => {
  return dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid();
};
export const isValidDateTimeFormat = (dateStr) => {
  return dayjs(dateStr, DATE_TIME_ZONE_FORMAT, true).isValid();
};

export const getCurrentFormat = (dateStr) => {
  if (dayjs(dateStr, YEAR_FORMAT, true).isValid()) {
    return YEAR_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_FORMAT, true).isValid()) {
    return YEAR_MONTH_FORMAT;
  } else if (dayjs(dateStr, YEAR_MONTH_DAY_FORMAT, true).isValid()) {
    return YEAR_MONTH_FORMAT;
  } else if (dayjs(dateStr, DATE_TIME_ZONE_FORMAT, true).isValid()) {
    return DATE_TIME_ZONE_FORMAT;
  } else {
    return "Invalid format";
  }
};
const DateTimeComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange, // onChange should Probably only be triggered once the fields are all filled out
  label = "DateTime",
}: TypeComponentProps) => {
  const [date, setDate] = useState<string>(); // dayjs obj
  const [time, setTime] = useState<any>(); // dayjs obj
  const [formattedTime, setFormattedTime] = useState("");
  const [timeZone, setTimeZone] = useState("");

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
      if (isValidDateTimeFormat(value)) {
      } else if (isYearMonthDayFormat(value)) {
        setDate(value)
      } else if (isYearMonthFormat(value)) {
        setDate(value)
      } else if (isYearFormat(value)) {
        setDate(value)
      }

      //   const zone = value.slice(-6); // fine
      //   setDate(value.slice(0, 10));
      //   setTimeZone(findByOffSet(zone));
      //   const formattedDate = dayjs(value)
      //     .utcOffset(zone)
      //     .format("YYYY-MM-DDTHH:mm:ss");
      //  setTime(formattedDate)
      setDate(value);
    }
  }, [value]);

  console.log("new year is", date);



  const renderMenuItems = (options: MenuObj[]) => {
    return [
      ...options.map(({ value, label }) => (
        <MuiMenuItem
          key={`${label}-option`}
          value={`${value} - ${label}`}
          data-testid={`${label}-option`}
        >
          {label}
        </MuiMenuItem>
      )),
    ];
  };
  const findAndRenderLabel = (value) => {
    let result = "--";
    if (value && options) {
      options.forEach((opt) => {
        if (opt.value + " - " + opt.label === value) {
          result = opt.label;
        }
      });
    }
    return result;
  };

  const handleDateTimeChange = (date, time, offset) => {
    if (date) {
      const dateTime = dayjs(date + "T" + time + ".000");
      const dateTimeStr = dateTime.format(DATE_TIME_ZONE_FORMAT).slice(0, 23);
      return dateTimeStr + offset;
    }
    return null;
  };

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
          <DateField
            label="Date Field"
            required={fieldRequired}
            error={true}
            helperText={undefined}
            // id="date-time-component"
            // value={date ? dayjs(date) : null}
            // @ts-ignore
            // value={date || null}
            value={date}
            disabled={!canEdit}
            id="date-field"
            handleDateChange={(date) => {
              console.log('date is', date)
              // console.log('date is', date)
              // if (date.isValid()){
              //   console.log('date is', date)
              // }
              // console.log('date is', date)
              // setDate(date?.format(DATE_FORMAT));
              // const offset = getOffSet(timeZone);
              // const changedDate = handleDateTimeChange(
              //   date?.format(DATE_FORMAT),
              //   formattedTime,
              //   offset
              // );
              // setDate(changedDate)
              // if (changedDate){
              //   onChange(changedDate)
              // }
              setDate(date);
            }}
            onBlur={() => {}}
          />

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
                setTime(time);
                setFormattedTime(time?.format(TIME_FORMAT)); // force zeros here?
                console.log('formattedTime',time?.format(TIME_FORMAT))
                const offset = getOffSet(timeZone);
                const changedDate = handleDateTimeChange(
                  date,
                  time?.format(TIME_FORMAT),
                  offset
                );
                if (changedDate && !changedDate.includes("Invalid Date")){
                  onChange(changedDate)
                }
              }}
              value={time ? dayjs(time) : null}
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
            disabled={!canEdit || !time}
            SelectDisplayProps={{
              "aria-required": "true",
            }}
            // value={value ? timeZone : null}
            value={timeZone}
            options={renderMenuItems(options)}
            renderValue={(value) => {
              return findAndRenderLabel(value);
            }}
            onChange={(event) => {
              const newTimeZone = event.target.value;
              setTimeZone(newTimeZone);
              const offset = getOffSet(newTimeZone);
              const changedDate = handleDateTimeChange(
                date,
                formattedTime,
                offset
              );
              if (changedDate && !changedDate.includes("Invalid Date")){
                onChange(changedDate)
              }
            }}
          ></Select>
        </div>
      </LocalizationProvider>
    </Box>
  );
};

export default DateTimeComponent;
//
