import React from "react";

const MeasureDefinitionRow = ({ measureDefinition }) => {
  const { term, definition } = measureDefinition;
  return (
    <tr>
      <td>{term}</td>
      <td>{definition}</td>
    </tr>
  );
};

export default MeasureDefinitionRow;
