import React, { useCallback } from "react";
import "twin.macro";
import "styled-components/macro";
import { Coding } from "fhir/r4";
import CodingComponent from "./CodingComponent";
import AddElementButton from "../../../../../../../common/AddElementButton";

const CodeableConceptComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
  showAddAttributeButton,
  addTitle,
}) => {
  const handleChange = useCallback(
    (value: Coding) => {
      onChange({ coding: [value] });
    },
    [onChange]
  );
  return (
    <CodingComponent
      addTitle={addTitle}
      showAddAttributeButton={showAddAttributeButton}
      label={label}
      canEdit={canEdit}
      structureDefinition={structureDefinition}
      onChange={handleChange}
      value={value?.coding?.[0]} //TODO: handle multiple codings
    />
  );
};

export default CodeableConceptComponent;
