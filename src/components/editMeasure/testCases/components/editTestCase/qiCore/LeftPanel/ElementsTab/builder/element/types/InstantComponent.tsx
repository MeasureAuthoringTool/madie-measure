import React, { useEffect, useState } from "react";
import { Instant } from "@madie/madie-design-system";

import dayjs from "dayjs";
import { INSTANT_REGEX } from "../typesValidations/fhirR4Validations";

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
    <Instant
      disabled={false}
      id={`${label}_instant`}
      placeholder={isValid ? "MM/DD/YYYY" : "Invalid"}
      name={name}
      label={label}
      required={required}
      handleDateTimeChange={handleDateTimeChange}
      dateTimeValue={dateTime}
      error={error}
      helperText={helperText}
      onBlur={onBlur}
    />
  );
};

export default InstantComponent;
