import React from "react";
import InlineEdit from "../../InlineEdit/InlineEdit";
import Measure from "../../../models/Measure";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../useCurrentMeasure";

export default function MeasureInformation() {
  const measureServiceApi = useMeasureServiceApi();
  const { measure, setMeasure } = useCurrentMeasure();

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
    <div tw="px-4" data-testid="measureNameEdit">
      <span>Measure:</span>
      <InlineEdit text={measure.measureName} onSetText={updateMeasureTitle} />
    </div>
  );
}
