import React, { useCallback } from "react";
import "twin.macro";
import "styled-components/macro";
import { Coding } from "fhir/r4";
import CodingComponent from "./CodingComponent";

const CodeableConceptComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}) => {
  const handleChange = useCallback(
    (value: Coding) => {
      onChange({ coding: value });
    },
    [onChange]
  );

  return (
    <CodingComponent
      label={label}
      canEdit={canEdit}
      structureDefinition={structureDefinition}
      onChange={handleChange}
      value={value?.coding}
    />
  );
};

export default CodeableConceptComponent;
