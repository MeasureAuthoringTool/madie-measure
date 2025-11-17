import React, { useCallback } from "react";
import "twin.macro";
import "styled-components/macro";
import { Coding } from "fhir/r4";
import CodingComponent from "./CodingComponent";
import { Box } from "@mui/system";
import { InputLabel } from "@madie/madie-design-system/dist/react";

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
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <InputLabel>{label}</InputLabel>
      <CodingComponent
        addTitle={addTitle}
        showAddAttributeButton={showAddAttributeButton}
        label={label}
        canEdit={canEdit}
        structureDefinition={structureDefinition}
        onChange={handleChange}
        value={value?.coding?.[0]} //TODO: handle multiple codings
      />
    </Box>
  );
};

export default CodeableConceptComponent;
