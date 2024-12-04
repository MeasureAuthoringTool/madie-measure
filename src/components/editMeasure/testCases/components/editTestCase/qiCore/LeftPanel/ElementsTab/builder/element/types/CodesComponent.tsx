import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import Box from "@mui/system/Box";
import { MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";

function getValueSetId(url) {
  const lastPart = url.split("/").pop();
  return lastPart.split("|")[0];
}

const CodesComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}: TypeComponentProps) => {
  const [codes, setCodes] = useState([]);
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());

  useEffect(() => {
    if (structureDefinition) {
      const valueSetVal = structureDefinition.binding?.valueSet;
      if (_.isEmpty(valueSetVal)) {
        console.warn(
          "No valuset binding found on structure definition: ",
          structureDefinition
        );
      } else {
        const valueSetId = getValueSetId(valueSetVal);
        fhirDefinitionsService.current
          .getFhirValueSetExpansion(valueSetId)
          .then((expansion) => {
            setCodes(expansion?.expansion?.contains);
          })
          .catch((error) => {
            console.error(
              `An error occurred while fetching valueSet expansion for valueSet [${valueSetId}]`,
              error
            );
          });
      }
    }
  }, [structureDefinition]);

  return (
    <Box>
      <Select
        label={label}
        id={`code-selector-${label}`}
        inputProps={{
          "data-testid": `code-selector-input-${label}`,
        }}
        data-testid={`code-selector-${label}`}
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        disabled={!canEdit}
        options={
          codes
            ? codes.map((concept) => (
                <MenuItem
                  key={concept.code}
                  value={concept.code}
                  data-testid={`code-option-${concept.code}`}
                >
                  {concept.display}
                </MenuItem>
              ))
            : []
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
};

export default CodesComponent;
