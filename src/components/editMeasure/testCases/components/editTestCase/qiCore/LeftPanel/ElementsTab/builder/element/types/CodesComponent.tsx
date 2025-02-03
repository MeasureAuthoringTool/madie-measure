import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import useTerminologyServiceApi from "../../../../../../../../api/useTerminologyServiceApi";
import Box from "@mui/system/Box";
import { MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";

function getValueSetUrl(url: string) {
  return url.split("|").shift();
}

const CodesComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}: TypeComponentProps) => {
  const [codes, setCodes] = useState([]);
  const terminologyServiceApi = useRef(useTerminologyServiceApi());

  useEffect(() => {
    if (structureDefinition) {
      const valueSetVal = structureDefinition.binding?.valueSet;
      if (_.isEmpty(valueSetVal)) {
        console.warn(
          "No valuset binding found on structure definition: ",
          structureDefinition
        );
      } else {
        const valueSetUrl = getValueSetUrl(valueSetVal);
        terminologyServiceApi.current
          .getInternalValueSetExpansion(valueSetUrl)
          .then((expansion) => {
            setCodes([
              {
                code: "2135-2",
                display: "Hispanic or Latino",
                system: "urn:oid:2.16.840.1.113883.6.238",
              },
            ]);
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
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
};

export default CodesComponent;
