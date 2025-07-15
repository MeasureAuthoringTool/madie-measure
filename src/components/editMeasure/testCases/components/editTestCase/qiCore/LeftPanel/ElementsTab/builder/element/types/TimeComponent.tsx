import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TimeField } from "@madie/madie-design-system";
import timezone from "dayjs/plugin/timezone";
import dayjs from "dayjs";

dayjs.extend(timezone);

const TimeComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "Time",
}: TypeComponentProps) => {
  const TIME_FORMAT = "HH:mm:ss";
  const [time, setTime] = React.useState(
    value ? dayjs(value, TIME_FORMAT) : ""
  );

  return (
    <TimeField
      required={fieldRequired}
      disabled={!canEdit}
      id={`time-field-${label}`}
      label={label}
      seconds
      views={["hours", "minutes", "seconds"]}
      data-testid={`time-field-${label}`}
      handleTimeChange={(time) => {
        const formatted = time.format(TIME_FORMAT);
        setTime(time);
        onChange(formatted);
      }}
      value={time}
    />
  );
};

export default TimeComponent;
