import React, { SetStateAction, Dispatch, useState } from "react";
import "styled-components/macro";
import { MadieEditor } from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import tw from "twin.macro";
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const UpdateAlerts = tw.div`mb-2`;
const EditorActions = tw.div`mt-2 ml-2 mb-5`;

const MeasureEditor = () => {
  const { measure, setMeasure } = useCurrentMeasure();
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState(measure.cql);
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const updateMeasureCql = () => {
    if (editorVal !== measure.cql) {
      const newMeasure: Measure = { ...measure, cql: editorVal };
      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
          setSuccess(true);
        })
        .catch((reason) => {
          console.error(reason);
          setError(true);
          throw new Error(reason.message);
        });
    }
  };

  const handleMadieEditorValue = (val: string) => {
    setSuccess(false);
    setError(false);
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
      <EditorActions data-testid="measure-editor-actions">
        <UpdateAlerts data-testid="update_cql_alerts">
          {success && <SuccessText>CQL saved successfully</SuccessText>}
          {error && <ErrorText>Error updating the CQL</ErrorText>}
        </UpdateAlerts>
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
      </EditorActions>
    </>
  );
};

export default MeasureEditor;
