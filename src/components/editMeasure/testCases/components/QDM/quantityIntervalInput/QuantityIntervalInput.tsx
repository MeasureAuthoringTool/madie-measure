import React, { useEffect, useState } from "react";

import "styled-components/macro";
import Quantity from "../../common/quantityInput/QuantityInput";
import { CQL } from "cqm-models";

interface QuantityIntervalProps {
  label: string;
  quantityInterval: CQL.Interval;
  onQuantityIntervalChange: Function;
  canEdit: boolean;
}

const QuantityIntervalInput = ({
  label,
  quantityInterval,
  onQuantityIntervalChange,
  canEdit,
}: QuantityIntervalProps) => {
  const [currentInterval, setCurrentInterval] =
    useState<CQL.Ratio>(quantityInterval);
  const handleLowQuantityChange = (newValue) => {
    setCurrentInterval({ ...currentInterval, low: newValue });
  };

  const handleHighQuantityChange = (newValue) => {
    setCurrentInterval({ ...currentInterval, high: newValue });
  };

  useEffect(() => {
    const lowValid = currentInterval?.low && currentInterval.low.value != null;
    const highValid =
      currentInterval?.high && currentInterval.high.value != null;

    if (lowValid || highValid) {
      onQuantityIntervalChange(currentInterval);
    } else {
      onQuantityIntervalChange(null);
    }
  }, [currentInterval]);

  return (
    <>
      <h5 className="mm:text-blue-800 mm:mb-2 mm:mt-4">{label}</h5>
      <div className="mm:flex mm:flex-row mm:flex-wrap mm:gap-4">
        <div className="mm:flex mm:flex-col mm:w-80">
          <Quantity
            quantity={quantityInterval.low}
            onQuantityChange={handleLowQuantityChange}
            canEdit={canEdit}
            label="Low"
          />
        </div>

        <div className="mm:mt-6">:</div>

        <div className="mm:flex mm:flex-col mm:w-80">
          <Quantity
            quantity={quantityInterval.high}
            onQuantityChange={handleHighQuantityChange}
            canEdit={canEdit}
            label="High"
          />
        </div>
      </div>
    </>
  );
};

export default QuantityIntervalInput;
