import React, { useEffect, useState } from "react";
import { Instant } from "@madie/madie-design-system/dist/react";

import dayjs from "dayjs";
import { INSTANT_REGEX } from "../typesValidations/fhirR4Validations";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { getMultipleCardinalityLabel } from "./TypeUtil";
const isValidInstant = (instantString: string) => {
  if (!INSTANT_REGEX.test(instantString)) return false;
  return dayjs(instantString).isValid();
};

const InstantComponent = ({
  dateTimeValue,
  handleDateTimeChange,
  required,
  name,
  label,
  error,
  helperText,
  onBlur,
  setTouched,
  showAddAttributeButton,
  addTitle,
}) => {
  const [dateTime, setDateTime] = useState();
  const [isValid, setValid] = useState(false);

  useEffect(() => {
    setValid(true);
    if (dateTimeValue) {
      if (isValidInstant(dateTimeValue)) {
        setDateTime(dateTimeValue);
      } else {
        setDateTime(null);
        setValid(false);
      }
      setTouched();
    } else {
      setDateTime(null);
    }
  }, [dateTimeValue]);

  return (
    <div className="element-editor-add-row">
      <Instant
        disabled={false}
        id={`${label}_instant`}
        placeholder={isValid ? "MM/DD/YYYY" : "Invalid"}
        name={name}
        label={getMultipleCardinalityLabel(label)}
        required={required}
        handleDateTimeChange={handleDateTimeChange}
        dateTimeValue={dateTime}
        error={error}
        helperText={helperText}
        onBlur={onBlur}
      />
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} />
      )}
    </div>
  );
};

export default InstantComponent;
