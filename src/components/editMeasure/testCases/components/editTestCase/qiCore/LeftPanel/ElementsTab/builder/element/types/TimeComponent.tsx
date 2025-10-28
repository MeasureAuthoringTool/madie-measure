import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TimeField } from "@madie/madie-design-system/dist/react";
import timezone from "dayjs/plugin/timezone";
import dayjs from "dayjs";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";

dayjs.extend(timezone);

const TimeComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "Time",
  showAddAttributeButton,
  addTitle,
  handleAddElement,
}: TypeComponentProps) => {
  const TIME_FORMAT = "HH:mm:ss";
  const [time, setTime] = React.useState(
    value ? dayjs(value, TIME_FORMAT) : ""
  );

  return (
    <div className="element-editor-add-row">
      <div className="time-field-container">
        <TimeField
          required={fieldRequired}
          disabled={!canEdit}
          id={`time-field-${label}`}
          label={label}
          seconds
          views={["hours", "minutes", "seconds"]}
          data-testid={`time-field-${label}`}
          handleTimeChange={(time) => {
            const formatted = time?.format(TIME_FORMAT);
            setTime(time);
            onChange(formatted);
          }}
          value={time}
        />
      </div>
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}{" "}
    </div>
  );
};

export default TimeComponent;
