import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import useTerminologyServiceApi from "../../../../../../../../api/useTerminologyServiceApi";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";

const CodingComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}: TypeComponentProps) => {
  const [codes, setCodes] = useState([]);
  const terminologyServiceApi = useRef(useTerminologyServiceApi());
  const fhirDefinitionService = useRef(useFhirDefinitionsServiceApi());
  useEffect(() => {
    if (structureDefinition) {
      // fetch expansion for binding if present
      if (structureDefinition.binding) {
        const valueSetUrl = structureDefinition.binding.valueSet;
        // 1. fetch expansion from internal HAPI
        terminologyServiceApi.current
          .getInternalValueSetExpansion(valueSetUrl)
          .then((expansion) => {
            if (expansion) {
              setCodes(expansion?.expansion?.contains);
            } else {
              // 2. if expansion doesn't present in HAPI, get the value set definition & search in VSAC
              fhirDefinitionService.current
                .getValueSetDefinition(valueSetUrl)
                .then((valueSet) => {
                  if (valueSet) {
                    const valueSetOIDs = valueSet.compose.include
                      .flatMap((include) => include.valueSet)
                      // filter out hl7 value sets. the one that doesn't have standard OIDs
                      .filter((url) => url?.match(/[0-2](\.(0|[1-9][0-9]*))+/))
                      .map((url) => url?.split("/").pop());
                    terminologyServiceApi.current
                      .getValueSetsExpansionForOids(valueSetOIDs)
                      .then((valueSets) => {
                        const expandedCodes = valueSets.flatMap(
                          (valueSet) => valueSet.expansion.contains
                        );
                        setCodes(expandedCodes);
                      })
                      .catch((err) => {
                        console.error(err.message);
                      });
                  }
                });
            }
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

  const handleChange = (code) => {
    const selectedCode = codes.find((c) => c.code === code);
    onChange({
      system: selectedCode.system,
      code: selectedCode.code,
      display: selectedCode.display,
    });
  };

  return (
    <Select
      placeHolder={{ name: "- Select -", value: undefined }}
      id={`code-selector-${label}`}
      inputProps={{
        "data-testid": `code-selector-input-${label}`,
      }}
      data-testid={`code-selector-${label}`}
      disabled={!canEdit}
      options={codes?.map((concept) => (
        <MenuItem
          key={concept.code}
          value={concept.code}
          data-testid={`code-option-${concept.code}`}
        >
          {concept.display}
        </MenuItem>
      ))}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

export default CodingComponent;
