import React from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import { TypeComponentProps } from "./TypeComponentProps";
import "./RatioComponent.scss";
import QuantityComponent from "./QuantityComponent";
import { getMultipleCardinalityLabel } from "./TypeUtil";

const RatioComponent = ({ canEdit, label }: TypeComponentProps) => {
  const formattedLabel = getMultipleCardinalityLabel(label);
  const numeratorPath = `${label}.numerator`;
  const denominatorPath = `${label}.denominator`;

  return (
    <div className="ratio-component" data-component-type="RatioComponent">
      <InputLabel>{formattedLabel}</InputLabel>

      <div className="quantity-row">
        {/* Numerator field */}
        <div className="low-input">
          <QuantityComponent
            canEdit={canEdit}
            label={numeratorPath}
            showLabel={false}
            showComparator={false}
            valueFieldLabel="Numerator"
            fieldRequired={false}
          />
        </div>

        {/* Colon separator */}
        <span className="separator">:</span>

        {/* Denominator field */}
        <div className="high-input">
          <QuantityComponent
            canEdit={canEdit}
            label={denominatorPath}
            showLabel={false}
            showComparator={false}
            valueFieldLabel="Denominator"
            fieldRequired={false}
          />
        </div>
      </div>
    </div>
  );
};

export default RatioComponent;
