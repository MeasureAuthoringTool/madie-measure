import React, { useEffect, useRef, useState } from "react";
import { ElementDefinition, Resource, StructureDefinition } from "fhir/r4";
import UriComponent from "./UriComponent";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import useTerminologyServiceApi from "../../../../../../../../api/useTerminologyServiceApi";

interface ExtensionProps {
  fhirResource: Resource;
  canEdit: boolean;
  onChange: () => void;
  elementDefinition: ElementDefinition;
  parentStructureDefinition: any;
}

const getUrlAndValueElement = (
  parentStructureDefinition: StructureDefinition,
  id: string
): Array<ElementDefinition> => {
  if (!parentStructureDefinition?.snapshot || !id) {
    return [];
  }
  let urlElement: ElementDefinition;
  let valueElement: ElementDefinition;
  for (const element of parentStructureDefinition.snapshot.element) {
    if (element.id === `${id}.url`) {
      urlElement = element;
    } else if (element.id === `${id}.value[x]`) {
      valueElement = element;
    }
  }
  return [urlElement, valueElement];
};

const ExtensionComponent = ({
  fhirResource,
  canEdit,
  elementDefinition,
  parentStructureDefinition,
}: ExtensionProps) => {
  const [codes, setCodes] = useState([]);
  const [selectedValueOption, setSelectedValueOption] = useState<string>("");
  const terminologyServiceApi = useRef(useTerminologyServiceApi());

  // prepare extension object
  const handleUriChange = () => {};
  const [urlElement, valueElement] = getUrlAndValueElement(
    parentStructureDefinition?.definition,
    elementDefinition?.id
  );

  useEffect(() => {
    if (valueElement) {
      setSelectedValueOption(valueElement.type[0].code);
      // fetch expansion for binding if present
      if (valueElement.binding) {
        const valueSetUrl = valueElement.binding.valueSet;
        terminologyServiceApi.current
          .getInternalValueSetExpansion(valueSetUrl)
          .then((expansion) => {
            setCodes(expansion?.expansion?.contains);
          })
          .catch((error) => {
            console.error(
              `An error occurred while fetching valueSet expansion for valueSet [${valueSetUrl}]`,
              error
            );
          });
      }
    }
  }, [valueElement]);
  const idPrefix = elementDefinition?.id?.split("Extension.").pop();

  return (
    <div data-testid={idPrefix}>
      <UriComponent
        canEdit={canEdit}
        fieldRequired={urlElement?.min > 0}
        label="url"
        value={urlElement?.fixedUri}
        structureDefinition={null}
        onChange={handleUriChange}
      />
      <Select
        label="Value"
        inputProps={{
          "data-testid": `${idPrefix}-code-selector-input`,
        }}
        data-testid={`${idPrefix}-code-selector`}
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        disabled={false}
        required={valueElement?.min > 0}
        options={[
          <MenuItem
            key={selectedValueOption}
            value={selectedValueOption}
            data-testid={`value-option-${selectedValueOption}`}
          >
            {selectedValueOption}
          </MenuItem>,
        ]}
        value={selectedValueOption}
        onChange={(e) => setSelectedValueOption(e.target.value)}
      />
      {valueElement && (
        <div>{codes?.length ? codes[0].code : selectedValueOption}</div>
      )}
    </div>
  );
};

export default ExtensionComponent;
