import React, {
  SetStateAction,
  Dispatch,
  useState,
  useRef,
  useEffect,
} from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieEditor } from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import tw from "twin.macro";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslationError,
} from "../../api/useElmTranslationServiceApi";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const UpdateAlerts = tw.div`mb-2 h-5`;
const EditorActions = tw.div`mt-2 ml-2 mb-5`;

export const mapElmErrorsToAceAnnotations = (
  errors: ElmTranslationError[]
): EditorAnnotation[] => {
  let annotations: EditorAnnotation[] = [];
  if (errors && _.isArray(errors) && errors.length > 0) {
    annotations = errors.map((error: ElmTranslationError) => ({
      row: error.startLine - 1,
      column: error.startChar,
      type: error.errorSeverity.toLowerCase(),
      text: `ELM: ${error.startChar}:${error.endChar} | ${error.message}`,
    }));
  }
  return annotations;
};

const MeasureEditor = () => {
  const { measure, setMeasure } = useCurrentMeasure();
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState(measure.cql || "");
  const measureServiceApi = useMeasureServiceApi();
  const elmTranslationServiceApi = useElmTranslationServiceApi();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [elmTranslationError, setElmTranslationError] = useState(null);
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);

  const updateElmAnnotations = async (cql: string) => {
    setElmTranslationError(null);
    if (cql && cql.trim().length > 0) {
      const data = await elmTranslationServiceApi.translateCqlToElm(cql);
      const elmAnnotations = mapElmErrorsToAceAnnotations(
        data?.errorExceptions
      );
      setElmAnnotations(elmAnnotations);
    } else {
      setElmAnnotations([]);
    }
  };

  const debouncedChangeHandler: any = useRef(
    _.debounce((nextValue: string) => {
      updateElmAnnotations(nextValue).catch((err) => {
        console.error("An error occurred while translating CQL to ELM", err);
        setElmTranslationError("Unable to translate CQL to ELM!");
        setElmAnnotations([]);
      });
      // other debounced operations can go here as well
    }, 1500)
  ).current;

  const updateMeasureCql = () => {
    updateElmAnnotations(editorVal).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setElmTranslationError("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
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
        });
    }
  };

  const handleMadieEditorValue = (val: string) => {
    setSuccess(false);
    setError(false);
    setEditorVal(val);
  };

  const resetCql = (): void => {
    setEditorVal(measure.cql || "");
  };

  useEffect(() => {
    debouncedChangeHandler(editorVal);
  }, [editorVal, debouncedChangeHandler]);

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={editorVal}
        inboundAnnotations={elmAnnotations}
      />
      <EditorActions data-testid="measure-editor-actions">
        <UpdateAlerts data-testid="update-cql-alerts">
          {success && (
            <SuccessText data-testid="save-cql-success">
              CQL saved successfully
            </SuccessText>
          )}
          {error && (
            <ErrorText data-testid="save-cql-error">
              Error updating the CQL
            </ErrorText>
          )}
        </UpdateAlerts>
        <UpdateAlerts data-testid="elm-translation-alerts">
          {elmTranslationError && (
            <ErrorText data-testid="elm-translation-error">
              {elmTranslationError}
            </ErrorText>
          )}
        </UpdateAlerts>
        <Button
          buttonSize="md"
          buttonTitle="Save"
          variant="primary"
          onClick={() => updateMeasureCql()}
          data-testid="save-cql-btn"
        />
        <Button
          tw="ml-2"
          buttonSize="md"
          buttonTitle="Cancel"
          variant="secondary"
          onClick={() => resetCql()}
          data-testid="reset-cql-btn"
        />
      </EditorActions>
    </>
  );
};

export default MeasureEditor;
