import React from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import { TypeComponentProps } from "./TypeComponentProps";
import "./RangeComponent.scss";
import QuantityComponent from "./QuantityComponent";
import { getMultipleCardinalityLabel } from "./TypeUtil";

const RangeComponent = ({
  canEdit,
  label,
  structureDefinition,
}: TypeComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const lowPath = `${label}.low`;
  const highPath = `${label}.high`;

  return (
    <div className="range-component">
      <InputLabel>{formattedLabel}</InputLabel>

      <div className="quantity-row">
        {/* Low field */}
        <div className="low-input">
          <QuantityComponent
            canEdit={canEdit}
            label={lowPath}
            showLabel={false}
            valueFieldLabel="Low"
            structureDefinition={structureDefinition}
            fieldRequired={false}
          />
        </div>

        {/* Colon separator */}
        <span className="separator">:</span>

        {/* High field */}
        <div className="high-input">
          <QuantityComponent
            canEdit={canEdit}
            label={highPath}
            showLabel={false}
            valueFieldLabel="High"
            structureDefinition={structureDefinition}
            fieldRequired={false}
          />
        </div>
      </div>
    </div>
  );
};

export default RangeComponent;
