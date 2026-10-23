import React, { useEffect, useState } from "react";

import "styled-components/macro";
import Quantity from "../../common/quantityInput/QuantityInput";
import { CQL } from "cqm-models";

interface RatioInputProps {
  label: string;
  ratio: CQL.Ratio;
  onRatioChange: Function;
  canEdit: boolean;
}

const RatioInput = ({
  label,
  ratio,
  onRatioChange,
  canEdit,
}: RatioInputProps) => {
  const [currentRatio, setCurrentRatio] = useState<CQL.Ratio>(ratio);
  const handleNumeratorChange = (newValue) => {
    setCurrentRatio({ ...currentRatio, numerator: newValue });
    if (newValue) {
    }
  };
  const handleDenominatorChange = (newValue) => {
    setCurrentRatio({ ...currentRatio, denominator: newValue });
    if (newValue) {
    }
  };
  useEffect(() => {
    if (currentRatio?.numerator && currentRatio?.denominator) {
      onRatioChange(currentRatio);
    } else {
      onRatioChange(null);
    }
  }, [currentRatio]);

  return (
    <>
      <h5 className="mm:text-blue-800 mm:mb-2">{label}</h5>
      <div className="mm:flex mm:flex-row mm:flex-wrap mm:gap-4">
        <div className="mm:flex mm:flex-col mm:w-80">
          <Quantity
            quantity={currentRatio.numerator}
            canEdit={canEdit}
            label={"Numerator"}
            onQuantityChange={handleNumeratorChange}
          />
        </div>
        <div style={{ paddingTop: "30px" }}>:</div>
        <div className="mm:flex mm:flex-col mm:w-80">
          <Quantity
            quantity={currentRatio.denominator}
            canEdit={canEdit}
            label={"Denominator"}
            onQuantityChange={handleDenominatorChange}
          />
        </div>
      </div>
    </>
  );
};

export default RatioInput;
