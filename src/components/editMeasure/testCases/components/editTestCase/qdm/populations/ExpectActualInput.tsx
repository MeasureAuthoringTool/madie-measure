import React from "react";
import classNames from "classnames";
import "./StyledCheckBox.scss";

const ExpectActualInput = ({
  expectedValue,
  onChange,
  displayType,
  ...props
}) => {
  const checkBoxClass = classNames("madie-check", {
    expected: displayType === "expected",
    actual: displayType === "actual",
  });
  return props.populationBasis?.toLowerCase() === "true" &&
    !props.name?.includes("measureObservation") &&
    !props.name?.includes("measurePopulationObservation") &&
    !props.name?.includes("numeratorObservation") &&
    !props.name?.includes("denominatorObservation") ? (
    <input
      type="checkbox"
      className={checkBoxClass}
      checked={expectedValue}
      onChange={(e) => {
        onChange(!!e.target.checked);
      }}
      {...props}
    />
  ) : (
    <input
      type="text"
      size={2}
      value={
        expectedValue || (expectedValue == 0 && expectedValue !== false)
          ? expectedValue
          : ""
      }
      onChange={(e) => {
        onChange(e.target.value);
      }}
      {...props}
    />
  );
};

export default ExpectActualInput;
