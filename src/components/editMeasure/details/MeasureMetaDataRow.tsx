import React from "react";
// we will have two different renders so far
// measureMetaData.measureDefinition = [{term, definition}];
// measureMetaData.measureReferences = [{referenceText, ReferenceType}]
import { MeasureDefinition } from "../../editMeasure/details/MeasureDefinitions/MeasureDefinitions";
import { Button } from "@madie/madie-design-system/dist/react";

interface MeasureMetaDataRowProps {
  name: string;
  description: string;
  measureDefinition?: MeasureDefinition;
  setOpen?: Function;
  setSelectedDefinition?: Function;
}

const MeasureMetaDataRow = (props: MeasureMetaDataRowProps) => {
  const {
    name,
    description,
    measureDefinition,
    setOpen,
    setSelectedDefinition,
  } = props;

  const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true);
    setSelectedDefinition(measureDefinition);
  };

  return (
    <tr>
      <td>{name}</td>
      <td>{description}</td>
      {measureDefinition && (
        <td>
          <Button
            variant="outline-secondary"
            name="Edit"
            onClick={(e) => {
              handleOpen(e);
            }}
            data-testid={`measure-definition-edit-${measureDefinition.term}-${measureDefinition.definition}`}
            aria-label={`Measure term ${measureDefinition.term} definition ${measureDefinition.definition}`}
            role="button"
            tab-index={0}
          >
            Edit
          </Button>
        </td>
      )}
    </tr>
  );
};
export default MeasureMetaDataRow;
