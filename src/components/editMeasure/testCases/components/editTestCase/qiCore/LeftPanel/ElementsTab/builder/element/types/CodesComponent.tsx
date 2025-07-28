import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import Box from "@mui/system/Box";
import { MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import { getValueSetUrl } from "../../../../../../../../api/fhirDefinitionServiceUtilities";
import useTerminologyServiceApi from "../../../../../../../../api/useTerminologyServiceApi";

const CodesComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
  resource,
}: TypeComponentProps) => {
  const [codes, setCodes] = useState([]);
  const fhirDefinitionServiceApi = useRef(useFhirDefinitionsServiceApi());
  const terminologyService = useRef(useTerminologyServiceApi());
  const [codeValue, setCodeValue] = useState(value);

  const getAndSetCodeValueFromResource = () => {
    // ["Patient", "extension[2]", "value[x]"]
    const splitLabel = label.split(".");
    if (
      splitLabel[0] === resource?.resourceType &&
      splitLabel[1]?.startsWith("extension")
    ) {
      const regex = /\[(\d+)\]/; // Matches a number inside square brackets
      const match = splitLabel[1].match(regex);
      if (match && match[1]) {
        // find the index of the Patient resource type -> extension. e.g. extension[2]
        const index = match[1];
        // Ensure resource has 'extension' property before accessing
        const extension =
          resource &&
          "extension" in resource &&
          Array.isArray((resource as any).extension)
            ? (resource as any).extension[index]
            : undefined;
        if (extension) {
          //{"url":"http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex","valueCode":"M"}
          value = extension.valueCode;
          setCodeValue(extension.valueCode);
        }
      }
    }
  };
  const getCodes = (oids: string[]) => {
    terminologyService.current
      .getValueSetsExpansionForOids(oids)
      .then((valueSets) => {
        if (!_.isEmpty(valueSets)) {
          valueSets.forEach((valueSet) => {
            if (valueSet?.expansion?.contains) {
              setCodes((prevCodes) => [
                ...prevCodes,
                ...valueSet.expansion.contains,
              ]);
            }
          });
        }
      })
      .catch((error) => {
        console.error(
          `An error occurred while fetching valueSet expansion for oids [${oids}]`,
          error
        );
      });
  };

  useEffect(() => {
    if (structureDefinition) {
      getAndSetCodeValueFromResource();
      const valueSetVal = structureDefinition.binding?.valueSet;
      if (_.isEmpty(valueSetVal)) {
        setCodes([]);
      } else {
        const valueSetUrl = getValueSetUrl(valueSetVal);
        // e.g. http://hl7.org/fhir/us/core/ValueSet/birthsex
        // e.g. http://hl7.org/fhir/ValueSet/administrative-gender
        fhirDefinitionServiceApi.current
          .getValueSetDefinition(valueSetUrl)
          .then((valueSet) => {
            /*
              does NOT have valueSet?.expansion?.contains for birthsex
              has compose.include 2 valueSets: http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1 (ONC Administrative Sex)
              and http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1021.103 (Other or unknown or refused to answer)
            */
            if (valueSet?.expansion?.contains) {
              setCodes(valueSet?.expansion?.contains);
            } else if (valueSet?.compose?.include) {
              /*
                If the valueSet does not have an expansion, we can use the compose.include
                URLs for birthsex from valueSet.compose.include:
                http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1, http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1021.103
              */
              const oids = valueSet.compose.include.flatMap(
                (include) =>
                  include.valueSet?.[0]?.substring(
                    include.valueSet[0].lastIndexOf("/") + 1
                  ) || []
              );
              if (!_.isEmpty(oids)) {
                getCodes(oids);
              }
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
        readOnly={!canEdit}
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
        value={value ? value : codeValue}
        renderValue={(value) =>
          codes?.find((concept) => concept.code === codeValue)?.display || value
        }
        onChange={(e) => {
          onChange(e.target.value);
          setCodeValue(e.target.value);
        }}
      />
    </Box>
  );
};

export default CodesComponent;
