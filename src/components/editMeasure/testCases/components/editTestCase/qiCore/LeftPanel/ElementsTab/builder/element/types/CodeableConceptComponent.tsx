import React, { useCallback, useMemo } from "react";
import "twin.macro";
import "styled-components/macro";
import { Coding, CodeableConcept, ElementDefinition } from "fhir/r4";
import CodingComponent from "./CodingComponent";
import { Box } from "@mui/system";
import { InputLabel } from "@madie/madie-design-system/dist/react";
import { getMultipleCardinalityLabel } from "./TypeUtil";
import { useFormikContext } from "formik";
import * as _ from "lodash";

interface CodeableConceptComponentProps {
  canEdit: boolean;
  structureDefinition: ElementDefinition;
  label: string;
  value?: CodeableConcept;
  addTitle?: string;
  showAddAttributeButton?: boolean;
  handleAddElement?: Function;
  showDeleteButton?: boolean;
  handleDeleteElement?: Function;
}

const CodeableConceptComponent: React.FC<CodeableConceptComponentProps> = ({
  canEdit,
  structureDefinition,
  label,
  value,
  addTitle,
  showAddAttributeButton,
  handleAddElement,
  showDeleteButton,
  // handleDeleteElement,
}) => {
  const formik = useFormikContext();

  /**
   * Adds a new coding element to the CodeableConcept
   */
  const handleAddCoding = useCallback(() => {
    const currentValue = _.get(formik.values, label) as CodeableConcept;
    const currentCoding = currentValue?.coding || [undefined];

    const updatedValue: CodeableConcept = {
      ...currentValue,
      coding: [...currentCoding, undefined],
    };

    formik.setFieldValue(label, updatedValue);
  }, [formik, label]);

  /**
   * Removes a coding element at the specified index from the CodeableConcept
   * If it's the last element, clears its value instead of removing it
   */
  const handleDeleteElement = useCallback(
    (index: number) => {
      const currentValue = _.get(formik.values, label) as CodeableConcept;
      const currentCoding = currentValue?.coding || [undefined];

      if (currentCoding.length === 1) {
        // If it's the last element, just clear its value
        const codingLabel = `${label}.coding[${index}]`;
        formik.setFieldValue(codingLabel, undefined);
      } else {
        // If there are multiple elements, remove this one from the array
        const updatedCoding = currentCoding.filter((_, i) => i !== index);
        const updatedValue: CodeableConcept = {
          ...currentValue,
          coding: updatedCoding,
        };
        formik.setFieldValue(label, updatedValue);
      }
    },
    [formik, label]
  );

  /**
   * Memoize codings array to avoid unnecessary recalculations
   */
  const codings = useMemo(() => {
    return value?.coding && value.coding.length > 0
      ? value.coding
      : [undefined];
  }, [value?.coding]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column" }}
      data-component-type="CodeableConceptComponent"
    >
      <InputLabel>{getMultipleCardinalityLabel(label)}</InputLabel>
      {codings.map((coding: Coding, index: number) => {
        const codingLabel = `${label}.coding[${index}]`;
        const isLastElement = index === codings.length - 1;

        return (
          <Box key={codingLabel} sx={{ mb: 2 }}>
            <CodingComponent
              handleAddElement={handleAddCoding}
              addTitle={addTitle}
              label={codingLabel}
              canEdit={canEdit}
              showDeleteButton={true} // Always show delete button for coding elements
              handleDeleteElement={() => handleDeleteElement(index)}
              showAddAttributeButton={isLastElement}
              structureDefinition={structureDefinition}
              onChange={(newValue: Coding) =>
                formik.setFieldValue(codingLabel, newValue)
              }
              value={coding}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default CodeableConceptComponent;
