import React, { useEffect, useRef, useState } from "react";
import {
  DomainResource,
  ElementDefinition,
  StructureDefinition,
} from "fhir/r4";
import UriComponent from "./UriComponent";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem, Typography } from "@mui/material";
import TypeEditor from "../TypeEditor";
import { StructureDefinitionDto } from "../../../../../../../../api/models/StructureDefinitionDto";

interface ExtensionProps {
  fhirResource: DomainResource;
  canEdit: boolean;
  onChange: (value) => void;
  elementDefinition: ElementDefinition;
  parentStructureDefinition: StructureDefinitionDto;
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
  const [selectedValueType, setSelectedValueType] = useState<string>("");
  const [url, setUrl] = useState<string>();
  const [value, setValue] = useState();
  const [urlElement, valueElement] = getUrlAndValueElement(
    parentStructureDefinition?.definition,
    elementDefinition?.id
  );

  useEffect(() => {
    if (valueElement) {
      setSelectedValueType(valueElement.type[0].code);
    }
  }, [valueElement]);

  useEffect(() => {
    if ((url || urlElement?.fixedUri) && value) {
      const extension = { url: url ?? urlElement?.fixedUri };
      extension[`value${selectedValueType}`] = value;
      // onChange(extension);
    }
  }, [selectedValueType, url, value]);

  const idPrefix = elementDefinition?.id?.split("Extension.").pop();
  // if there's a fixeduri element, we render a readOnly field with the value select dropdown for it
  if (urlElement?.fixedUri) {
    return (
      <>
        <Typography data-testid={idPrefix} sx={{ fontSize: "14px" }}>
          <span style={{ color: "#1976d2", fontWeight: 700 }}>
            {urlElement?.fixedUri}
          </span>
          <br />
          <span style={{ color: "#333333" }}>{urlElement?.fixedUri}</span>
        </Typography>
        <Select
          label="Value[x]"
          inputProps={{
            "data-testid": `${idPrefix}-type-selector-input`,
          }}
          data-testid={`${idPrefix}-type-selector`}
          SelectDisplayProps={{
            "aria-required": "true",
          }}
          disabled={false}
          required={valueElement?.min > 0}
          options={[
            <MenuItem
              key={selectedValueType}
              value={selectedValueType}
              data-testid={`type-option-${selectedValueType}`}
            >
              {selectedValueType}
            </MenuItem>,
          ]}
          value={selectedValueType}
          onChange={(e) => setSelectedValueType(e.target.value)}
        />
      </>
    );
  } else
    return (
      <div data-testid={idPrefix}>
        <UriComponent
          canEdit={!urlElement?.fixedUri} // disable if this is fixed value
          fieldRequired={urlElement?.min > 0}
          label={`${elementDefinition.id}.url`}
          structureDefinition={null}
          onChange={(value) => setUrl(value)}
        />

        <Select
          label={`${elementDefinition.id}.value[x]`}
          inputProps={{
            "data-testid": `${idPrefix}-type-selector-input`,
          }}
          data-testid={`${idPrefix}-type-selector`}
          SelectDisplayProps={{
            "aria-required": "true",
          }}
          disabled={false}
          required={valueElement?.min > 0}
          options={[
            <MenuItem
              key={selectedValueType}
              value={selectedValueType}
              data-testid={`type-option-${selectedValueType}`}
            >
              {selectedValueType}
            </MenuItem>,
          ]}
          value={selectedValueType}
          onChange={(e) => setSelectedValueType(e.target.value)}
        />
        {selectedValueType && (
          <TypeEditor
            structureDefinition={valueElement}
            resource={fhirResource}
            canEdit={canEdit}
            label={`value${selectedValueType}`}
            parentStructureDefinition={elementDefinition}
          />
        )}
      </div>
    );
};

export default ExtensionComponent;
