import React from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import { TypeComponentProps } from "./TypeComponentProps";
import "./RangeComponent.scss";
import QuantityComponent from "./QuantityComponent";
import { getMultipleCardinalityLabel } from "./TypeUtil";

const RangeComponent = ({ canEdit, label }: TypeComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const lowPath = `${label}.low`;
  const highPath = `${label}.high`;

  return (
    <div className="range-component" data-component-type="RangeComponent">
      <InputLabel>{formattedLabel}</InputLabel>

      <div className="quantity-row">
        {/* Low field */}
        <QuantityComponent
          canEdit={canEdit}
          label={lowPath}
          showLabel={false}
          showComparator={false}
          valueFieldLabel="Low"
          fieldRequired={false}
        />

        {/* Colon separator */}
        <span className="separator">:</span>

        {/* High field */}
        <QuantityComponent
          canEdit={canEdit}
          label={highPath}
          showLabel={false}
          showComparator={false}
          valueFieldLabel="High"
          fieldRequired={false}
        />
      </div>
    </div>
  );
};

export default RangeComponent;
