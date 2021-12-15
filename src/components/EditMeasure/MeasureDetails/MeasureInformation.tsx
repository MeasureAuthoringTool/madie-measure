import React, { useState } from "react";
import InlineEdit from "../../InlineEdit/InlineEdit";
import Measure from "../../../models/Measure";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

export interface MeasureInformationProps {
  measure: Measure;
}

export default function MeasureInformation(props: MeasureInformationProps) {
  const { measure: measureParam } = props;
  const [measure, setMeasure] = useState<Measure>(measureParam);
  const measureServiceApi = useMeasureServiceApi();

  function updateMeasureTitle(text: string): void {
    if (text !== measure.measureName) {
      const newMeasure: Measure = { ...measure, measureName: text };

      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
        })
        .catch((reason) => {
          const message = `Error updating measure ${newMeasure.measureName}`;
          console.error(message);
          console.error(reason);
          throw new Error(message);
        });
    }
  }

  return (
    <div tw="px-4 " data-testid="measure-name-edit">
      <span>Measure:</span>
      <InlineEdit text={measure.measureName} onSetText={updateMeasureTitle} />
    </div>
  );
}
