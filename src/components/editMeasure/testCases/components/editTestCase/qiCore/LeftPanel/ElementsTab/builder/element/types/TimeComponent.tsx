import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TimeField } from "@madie/madie-design-system/dist/react";
import timezone from "dayjs/plugin/timezone";
import dayjs from "dayjs";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

dayjs.extend(timezone);

const TimeComponent = ({
  canEdit,
  fieldRequired,
  value,
  onChange,
  label = "Time",
  name,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton = false,
  handleDeleteElement,
}: TypeComponentProps) => {
  const testIdBase = name && name.includes("[") ? name : label;
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
          id={`time-field-${testIdBase}`}
          label={label}
          seconds
          views={["hours", "minutes", "seconds"]}
          data-testid={`time-field-${testIdBase}`}
          handleTimeChange={(time) => {
            const formatted = time?.format(TIME_FORMAT);
            setTime(time);
            onChange(formatted);
          }}
          value={time}
        />
      </div>
      {showDeleteButton && canEdit && (
        <Tooltip title="Delete" placement="top" arrow>
          <IconButton
            onClick={handleDeleteElement}
            data-testid={`delete-button-${testIdBase}`}
            aria-label={`delete ${testIdBase}`}
            size="small"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}{" "}
    </div>
  );
};

export default TimeComponent;
