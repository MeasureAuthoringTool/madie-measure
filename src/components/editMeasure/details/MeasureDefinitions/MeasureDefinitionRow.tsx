import React from "react";

const MeasureDefinitionRow = ({ measureDefinition }) => {
  const { term, definition } = measureDefinition;
  // console.log('term', term);
  // console.log('definition', definition)
  return (
    <tr>
      <td>{term}</td>
      <td>{definition}</td>
    </tr>
  );
};

export default MeasureDefinitionRow;
