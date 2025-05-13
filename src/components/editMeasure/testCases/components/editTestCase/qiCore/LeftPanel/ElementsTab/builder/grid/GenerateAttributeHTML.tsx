import React from "react";

import {
  getIndexFromPathWithoutBrackets,
  getLastPart,
  stripArrayIndices,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";

interface GenerateAttributeHTMLProps {
  value: any;
  keyPrefix?: string;
  root?: boolean;
}

const GenerateAttributeHTML: React.FC<GenerateAttributeHTMLProps> = ({
  value,
  keyPrefix = "",
}) => {
  let lastPart = stripArrayIndices(getLastPart(keyPrefix));
  const index = getIndexFromPathWithoutBrackets(getLastPart(keyPrefix));
  if (index !== undefined && index !== null) {
    lastPart = `${lastPart} ${Number(index) + 1}`;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        <b>{lastPart}:</b> {value.toString()}
      </div>
    );
    // It's an array
  } else if (Array.isArray(value)) {
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        {/* this must know how the number of elements at the key */}
        <b>{lastPart}:</b>
        {value.map((item, index) => (
          <GenerateAttributeHTML
            key={`${keyPrefix}[${index}]`}
            value={item}
            keyPrefix={`${keyPrefix}[${index}]`}
          />
        ))}
      </div>
    );
  } else if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        <b>{lastPart}:</b>
        {entries.map(([childKey, childValue]) => {
          const key = keyPrefix ? `${keyPrefix}.${childKey}` : childKey;
          return (
            <GenerateAttributeHTML
              key={key}
              value={childValue}
              keyPrefix={key}
            />
          );
        })}
      </div>
    );
  }

  return null;
};
export default GenerateAttributeHTML;
