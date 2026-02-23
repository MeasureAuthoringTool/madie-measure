import React, { useEffect, useState } from "react";
import {
  DomainResource,
  ElementDefinition,
  StructureDefinition,
} from "fhir/r4";
import { Typography } from "@mui/material";
import TypeEditor from "../TypeEditor";
import { StructureDefinitionDto } from "../../../../../../../../api/models/StructureDefinitionDto";
import _ from "lodash";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useFormikContext } from "formik";

interface ExtensionProps {
  label: string;
  fhirResource: DomainResource;
  canEdit: boolean;
  elementDefinition: ElementDefinition;
  extensionProfileDef: StructureDefinitionDto;
  showAddAttributeButton?: boolean;
  addTitle?: string;
}

export const getUrlAndValueElement = (
  extensionProfileDef: StructureDefinition,
  id: string
): Array<ElementDefinition> => {
  if (!extensionProfileDef?.snapshot || !id) {
    return [];
  }
  let urlElement: ElementDefinition;
  let valueElement: ElementDefinition;
  for (const element of extensionProfileDef.snapshot.element) {
    if (element.id === `${id}.url`) {
      urlElement = element;
    } else if (element.id === `${id}.value[x]`) {
      valueElement = element;
    }
  }
  return [urlElement, valueElement];
};

const ExtensionComponent = ({
  label,
  fhirResource,
  canEdit,
  elementDefinition,
  extensionProfileDef,
  showAddAttributeButton,
  addTitle,
}: ExtensionProps) => {
  const formik = useFormikContext();
  const [selectedValueType, setSelectedValueType] = useState<string>("");
  const [urlElement, valueElement] = getUrlAndValueElement(
    extensionProfileDef?.definition,
    elementDefinition?.id
  );

  /**
   * Value Type is the type of the value[x] element. We need to know the value type in order to render the correct input component for the extension value.
   * For Slices, this value type is pre-determined.
   * I guess for non-sliced extensions, we would need to allow the user to select the value type from the allowed types in the profile.
   * For now, we are only supporting sliced extensions in test cases, so we can set the value type on load based on the profile.
   */
  useEffect(() => {
    if (valueElement) {
      setSelectedValueType(valueElement.type[0].code);
    }
  }, [valueElement]);

  const onChangeForExtension = (value: any) => {
    const extension = {
      url: urlElement?.fixedUri,
      [`value${_.startCase(selectedValueType)}`]: value,
    };
    formik.setFieldTouched(label);
    formik.setFieldValue(label, extension);
  };

  const idPrefix = elementDefinition?.id?.split("Extension.").pop();
  if (urlElement?.fixedUri) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography data-testid={idPrefix} sx={{ fontSize: "14px" }}>
          <span style={{ color: "#1976d2", fontWeight: 700 }}>
            {urlElement?.fixedUri}
          </span>
          <br />
        </Typography>
        <div className="element-editor-add-row">
          <TypeEditor
            structureDefinition={valueElement}
            resource={fhirResource}
            canEdit={canEdit}
            label={`${label}.value${_.startCase(selectedValueType)}`}
            parentStructureDefinition={elementDefinition}
            onChangeForExtension={onChangeForExtension}
          />
          {showAddAttributeButton && addTitle && (
            <AddElementButton name={addTitle} />
          )}
        </div>
      </div>
    );
  } else {
    const typedLabel = `${label}.value${_.startCase(
      elementDefinition.type[0].code
    )}`;
    return (
      <div className="element-editor-add-row">
        <TypeEditor
          structureDefinition={elementDefinition}
          resource={fhirResource}
          canEdit={canEdit}
          label={typedLabel}
          parentStructureDefinition={extensionProfileDef}
        />
        {showAddAttributeButton && addTitle && (
          <AddElementButton name={addTitle} />
        )}
      </div>
    );
  }
};

export default ExtensionComponent;
