import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import Box from "@mui/system/Box";
import { MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import { getValueSetUrl } from "../../../../../../../../api/fhirDefinitionServiceUtilities";

const CodesComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}: TypeComponentProps) => {
  const [codes, setCodes] = useState([]);
  const fhirDefinitionServiceApi = useRef(useFhirDefinitionsServiceApi());

  useEffect(() => {
    if (structureDefinition) {
      const valueSetVal = structureDefinition.binding?.valueSet;
      if (_.isEmpty(valueSetVal)) {
        setCodes([]);
      } else {
        const valueSetUrl = getValueSetUrl(valueSetVal);
        fhirDefinitionServiceApi.current
          .getValueSetDefinition(valueSetUrl)
          .then((valueSet) => {
            setCodes(valueSet?.expansion?.contains);
          })
          .catch((error) => {
            console.error(
              `An error occurred while fetching valueSet expansion for valueSet [${valueSetUrl}]`,
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
        renderValue={(value) =>
          codes?.find((concept) => concept.code === value)?.display || value
        }
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
};

export default CodesComponent;
