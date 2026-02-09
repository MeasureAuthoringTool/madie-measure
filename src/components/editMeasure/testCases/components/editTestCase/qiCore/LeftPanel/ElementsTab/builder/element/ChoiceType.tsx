import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Box, MenuItem } from "@mui/material";
import { Select } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import TypeEditor from "./TypeEditor";
import { useFormikContext } from "formik";
import { formatAttributeLabel } from "../../../../../../../api/fhirDefinitionServiceUtilities";
import ElementSectionQiCore from "./ElementSectionQiCore";

interface ChoiceTypePropsInterface {
  childDef: any;
  resource?: any;
  parentStructureDefinition?: any;
  canEdit?: boolean;
  label: string; // the label is the path to the element, like Patient.name[0].family
}
export const ChoiceType = (props: ChoiceTypePropsInterface) => {
  const formik = useFormikContext();
  const { childDef, resource, parentStructureDefinition, canEdit, label } =
    props;
  const [selectedChoiceType, setSelectedChoiceType] = useState<string>();
  const [updatedLabel, setUpdatedLabel] = useState<string>();
  const value = _.get(formik.values, label);
  // get path of choice type attribute e.g. Observation.commentType[0].value
  const choiceBase = label.replace(/\[x]/, "");

  useEffect(() => {
    // get the display label and choice type from value
    if (childDef?.type?.length > 0 && formik.values) {
      const type = childDef?.type.find((type: { code: string }) =>
        _.has(formik.values, choiceBase + _.upperFirst(type.code))
      );
      const choice = type ? type.code : childDef.type[0].code;
      setSelectedChoiceType(choice);
      setUpdatedLabel(`${choiceBase}${_.upperFirst(choice)}`);
    } else {
      setSelectedChoiceType(childDef?.type?.[0]?.code);
      setUpdatedLabel(`${choiceBase}${_.upperFirst(childDef.type[0].code)}`);
    }
  }, [choiceBase]);

  return (
    <ElementSectionQiCore
      title={formatAttributeLabel(label)}
      startOpen={false}
      children={
        <Box
          style={{
            paddingLeft: "16px",
          }}
        >
          <Select
            label="Choice Type Selector"
            id={`choice-type-selector-${updatedLabel}`}
            required="true"
            inputProps={{
              "data-testid": `choice-type-input-${updatedLabel}`,
            }}
            data-testid={`choice-type-${updatedLabel}`}
            readOnly={!canEdit}
            options={childDef?.type?.map((ref) => (
              <MenuItem
                key={ref.code}
                data-testid={`${ref.code}-option`}
                value={ref.code}
              >
                {_.upperFirst(ref.code)}
              </MenuItem>
            ))}
            value={_.upperFirst(selectedChoiceType)}
            onChange={(e) => {
              // clear previous choice type value
              _.unset(
                formik.values,
                choiceBase + _.upperFirst(selectedChoiceType)
              );
              // update label and selected choice type based on the new selection
              const newChoice: any = e.target.value;
              setUpdatedLabel(`${choiceBase}${_.upperFirst(newChoice)}`);
              setSelectedChoiceType(newChoice);
            }}
          />
          {selectedChoiceType && (
            <div tw="mt-3">
              <TypeEditor
                resource={resource}
                structureDefinition={childDef}
                parentStructureDefinition={parentStructureDefinition}
                canEdit={canEdit}
                label={updatedLabel}
              />
            </div>
          )}
        </Box>
      }
    />
  );
};

export default ChoiceType;
