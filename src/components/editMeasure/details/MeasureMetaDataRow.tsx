import React from "react";
// we will have two different renders so far
// measureMetaData.measureDefinition = [{term, definition}];
// measureMetaData.measureReferences = [{referenceText, ReferenceType}]

const MeasureMetaDataRow = ({ value, type }) => {
  if (type === "definition") {
    const { term, definition } = value;
    return (
      <tr>
        <td>{term}</td>
        <td>{definition}</td>
      </tr>
    );
  } else {
    const { referenceType, referenceText } = value;
    return (
      <tr>
        <td>{referenceType}</td>
        <td>{referenceText}</td>
      </tr>
    );
  }
};

export default MeasureMetaDataRow;
