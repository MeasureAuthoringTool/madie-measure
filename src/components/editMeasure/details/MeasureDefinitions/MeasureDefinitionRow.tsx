import React from "react";
import { Button } from "@madie/madie-design-system/dist/react";

const MeasureDefinitionRow = ({
  measureDefinition,
  setOpen,
  setSelectedDefinition,
}) => {
  const { term, definition } = measureDefinition;

  const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true);
    setSelectedDefinition(measureDefinition);
  };

  return (
    <tr>
      <td>{term}</td>
      <td>{definition}</td>
      <td>
        <Button
          variant="outline-secondary"
          name="Edit"
          onClick={(e) => {
            handleOpen(e);
          }}
          data-testid={`measure-definition-edit-${term}-${definition}`}
          aria-label={`Measure term ${term} definition ${definition}`}
          role="button"
          tab-index={0}
        >
          Edit
        </Button>
      </td>
    </tr>
  );
};

export default MeasureDefinitionRow;
