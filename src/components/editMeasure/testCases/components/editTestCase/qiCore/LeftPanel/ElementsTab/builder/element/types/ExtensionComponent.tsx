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
import _ from "lodash";

interface ExtensionProps {
  label: string;
  formikHandleChange: Function;
  fhirResource: DomainResource;
  canEdit: boolean;
  onChange: (value) => void;
  elementDefinition: ElementDefinition;
  parentStructureDefinition: StructureDefinitionDto;
}

//this relies on snapshot.
const getUrlAndValueElement = (
  parentStructureDefinition: StructureDefinition, //parentStructureDefinition.definition
  id: string // childDefinition.id
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

// parent.url = "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
// child.id =  "Extension.extension:text"
// child.id =  "Extension.extension:ombCategory
const ExtensionComponent = ({
  label,
  fhirResource,
  canEdit,
  elementDefinition,
  parentStructureDefinition,
  ...rest
}: ExtensionProps) => {
  //@ts-ignore
  const v = rest?.value; // passed in from getFieldProps.
  const [selectedValueType, setSelectedValueType] = useState<string>("");
  const [url, setUrl] = useState<string>();
  const [value, setValue] = useState();
  const [urlElement, valueElement] = getUrlAndValueElement(
    parentStructureDefinition?.definition,
    elementDefinition?.id
  ); // get reference from SD.snap

  // TODO: modify this from a use effect later. Currently we haven't found and multiple cohice choicetypes to test the change.
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
        {selectedValueType && valueElement && (
          // handle change will have to be passed here to test for Coding element. Currently does not work because of missed valueSets
          <TypeEditor
            structureDefinition={valueElement}
            resource={fhirResource}
            canEdit={canEdit}
            label={`${label}.value${_.startCase(selectedValueType)}`}
            parentStructureDefinition={elementDefinition}
          />
        )}
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
          //needed for multiple choice types.. Doesn't seem to be found at this time.
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
