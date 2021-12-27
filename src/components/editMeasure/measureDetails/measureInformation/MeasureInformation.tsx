import React, { useState } from "react";
import InlineEdit from "../../../inlineEdit/InlineEdit";
import Measure from "../../../../models/Measure";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import "twin.macro";
import "styled-components/macro";

export default function MeasureInformation() {
  const measureServiceApi = useMeasureServiceApi();
  const { measure, setMeasure } = useCurrentMeasure();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();

  function updateMeasureTitle(text: string): void {
    if (text !== measure.measureName) {
      const newMeasure: Measure = { ...measure, measureName: text };

      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
        })
        .catch(({ response }) => {
          if (response.data.measureName) {
            setGenericErrorMessage(
              "Unable to update measure. Reason: " + response.data.measureName
            );
          }
        });
    }
  }

  return (
    <div tw="px-4 pt-4" data-testid="measure-name-edit">
      {genericErrorMessage && (
        <div tw="bg-red-500 pt-4 px-4 pb-4">
          <span
            tw="text-white"
            data-testid="edit-measure-information-generic-error-text"
          >
            {genericErrorMessage}
          </span>
        </div>
      )}
      <div tw="flex">
        <span tw="mr-2">Measure Name:</span>
        <InlineEdit text={measure.measureName} onSetText={updateMeasureTitle} />
      </div>
      <div tw="flex">
        <span tw="mr-2">Measure CQL Library Name:</span>
        <span>{measure.cqlLibraryName || "NA"}</span>
      </div>
    </div>
  );
}
