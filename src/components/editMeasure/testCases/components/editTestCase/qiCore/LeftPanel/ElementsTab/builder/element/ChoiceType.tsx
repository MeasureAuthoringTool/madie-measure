import React, { useEffect, useState, useMemo, useRef } from "react";

import { Box, MenuItem, Select, InputLabel } from "@mui/material";
import * as _ from "lodash";

import { extractNameWithoutIndex } from "../../../../../../../api/fhirDefinitionServiceUtilities";
import TypeEditor from "./TypeEditor";
import { useFormikContext } from "formik";
import { ElementDefinition } from "fhir/r4";

interface ChoiceTypePropsInterface {
  childDef: any;
  resource?: any;
  structureDefinition?: any;
  parentStructureDefinition?: any;
  canEdit?: boolean;
  label: string; // the label is the path to the element, like Patient.name[0].family
}
export const ChoiceType = (props: ChoiceTypePropsInterface) => {
  const formik = useFormikContext();
  const {
    childDef,
    resource,
    structureDefinition,
    parentStructureDefinition,
    canEdit,
    label,
  } = props;

  const [selectedChoiceType, setSelectedChoiceType] = useState<any>();
  const [updatedLabel, setUpdatedLabel] = useState<string>(label);
  let choiceTypeType: any = childDef?.type?.length > 0 ? childDef.type[0] : "";
  //split the label by "." and use each part to get the value from the formik values
  const labelParts = updatedLabel.split(".");
  let currentValue = formik.values;

  labelParts.forEach((part) => {
    if (currentValue && currentValue[part]) {
      currentValue = currentValue[part];
    } else {
      currentValue = undefined;
    }
  });
  const value = currentValue ? currentValue : undefined;

  useEffect(() => {
    //value of the select needs to reflect the label
    if (_.endsWith(childDef.id, "[x]") && childDef?.type?.length > 0 && value) {
      const nameWoType = extractNameWithoutIndex(childDef, "", updatedLabel);
      const typeObj = childDef?.type.find((type) => {
        const keyFromFormik = Object.keys(value)[0];
        const typeWoName = keyFromFormik.replace(nameWoType, "");
        return _.toLower(type.code) === _.toLower(typeWoName);
      });
      choiceTypeType = typeObj ? typeObj : childDef.type[0];
      setSelectedChoiceType(choiceTypeType);
    }
  }, [selectedChoiceType, childDef]);

  function determineLabel(
    childDef: ElementDefinition,
    labelType: any = undefined
  ): React.ReactNode {
    return labelType
      ? updatedLabel.replace("[x]", labelType.code)
      : childDef.id;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <div className="heading-row">
        <InputLabel className="heading-row" id="test-select-label">
          {determineLabel(childDef, selectedChoiceType)}
        </InputLabel>
      </div>
      <Select
        id={`choice-type`}
        label={`${childDef.id}`}
        inputProps={{
          "data-testid": `choice-type-input`,
        }}
        data-testid={`choice-type`}
        required
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        value={selectedChoiceType ? selectedChoiceType : childDef.type[0]}
        onChange={(e) => {
          e.preventDefault();
          const selectedType: any = e.target.value;

          // get the index from the label
          const choice = extractNameWithoutIndex(childDef);
          // if there is no index, we need to add one.
          setUpdatedLabel(`${choice}${_.upperFirst(selectedType.code)}`);
          // set the field value to the new type
          setSelectedChoiceType(selectedType);
        }}
      >
        {childDef?.type?.map((ref, i) => (
          <MenuItem
            key={`${ref.code}`}
            data-testid={`${ref.code}-option`}
            value={ref}
          >
            {_.upperFirst(ref.code)}
          </MenuItem>
        ))}
      </Select>
      {selectedChoiceType && (
        //put a border around the TypeEditor
        <Box sx={{ border: "1px solid #ccc", padding: 2, mt: 2 }}>
          <TypeEditor
            resource={resource}
            structureDefinition={childDef}
            parentStructureDefinition={parentStructureDefinition}
            canEdit={canEdit}
            label={`${determineLabel(childDef, selectedChoiceType)}`}
          />
        </Box>
      )}
    </Box>
  );
};

export default ChoiceType;
