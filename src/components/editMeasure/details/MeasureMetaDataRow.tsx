import React from "react";
// we will have two different renders so far
// measureMetaData.measureDefinition = [{term, definition}];
// measureMetaData.measureReferences = [{referenceText, ReferenceType}]

interface MeasureMetaDataRowProps {
  name: string;
  description: string;
}

const MeasureMetaDataRow = (props: MeasureMetaDataRowProps) => {
  const { name, description } = props;
  return (
    <tr>
      <td>{name}</td>
      <td>{description}</td>
    </tr>
  );
};
export default MeasureMetaDataRow;
