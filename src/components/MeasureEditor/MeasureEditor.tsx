import React, { SetStateAction, Dispatch, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { MadieEditor } from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import useCurrentMeasure from "../EditMeasure/useCurrentMeasure";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";

const MeasureEditor = () => {
  const { measure, setMeasure } = useCurrentMeasure();
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState(measure.cql);
  const measureServiceApi = useMeasureServiceApi();

  const updateMeasureCql = () => {
    if (editorVal !== measure.cql) {
      const newMeasure: Measure = { ...measure, cql: editorVal };
      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
        })
        .catch((reason) => {
          console.error(reason);
          throw new Error(reason.message);
        });
    }
  };

  const handleMadieEditorValue = (val: string) => {
    setEditorVal(val);
  };

  const resetCql = (): void => {
    setEditorVal(measure.cql);
  };

  const editorProps = {
    onChange: (val: string) => handleMadieEditorValue(val),
    value: editorVal,
  };

  return (
    <>
      <MadieEditor {...editorProps} />
      <div tw="mt-2 ml-2 mb-5" data-testid="measure-editor-actions">
        <Button
          buttonSize="md"
          buttonTitle="Save"
          variant="primary"
          onClick={() => updateMeasureCql()}
          data-testid="save_cql_btn"
        />
        <Button
          tw="ml-2"
          buttonSize="md"
          buttonTitle="Cancel"
          variant="secondary"
          onClick={() => resetCql()}
          data-testid="reset_cql_btn"
        />
      </div>
    </>
  );
};

export default MeasureEditor;
