import React, { SetStateAction, Dispatch, useState, useEffect } from "react";
import "styled-components/macro";
import {
  EditorAnnotation,
  EditorErrorMarker,
  MadieEditor,
} from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import tw from "twin.macro";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslation,
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

export const mapElmErrorsToAceMarkers = (
  errors: ElmTranslationError[]
): EditorErrorMarker[] => {
  let markers: EditorErrorMarker[] = [];
  if (errors && _.isArray(errors) && errors.length > 0) {
    markers = errors.map((error) => ({
      range: {
        start: {
          row: error.startLine - 1,
          column: error.startChar,
        },
        end: {
          row: error.endLine - 1,
          column: error.endChar,
        },
      },
      clazz: "editor-error-underline",
      type: "text",
    }));
  }
  return markers;
};

const MeasureEditor = () => {
  const { measure, setMeasure } = useCurrentMeasure();
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState("");
  const measureServiceApi = useMeasureServiceApi();
  const elmTranslationServiceApi = useElmTranslationServiceApi();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [elmTranslationError, setElmTranslationError] = useState(null);
  // annotations control the gutter error icons.
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);
  // error markers control the error underlining in the editor.
  const [errorMarkers, setErrorMarkers] = useState<EditorErrorMarker[]>([]);

  const updateElmAnnotations = async (cql: string): Promise<ElmTranslation> => {
    setElmTranslationError(null);
    if (cql && cql.trim().length > 0) {
      const data = await elmTranslationServiceApi.translateCqlToElm(cql);
      // errorExceptions contains error data for the primary library,
      // aka the CQL loaded into the editor. Errors from included
      // libraries are available in data.annotations.errors, if needed.
      const elmAnnotations = mapElmErrorsToAceAnnotations(
        data?.errorExceptions
      );
      const errorMarkers = mapElmErrorsToAceMarkers(data?.errorExceptions);
      setElmAnnotations(elmAnnotations);
      setErrorMarkers(errorMarkers);
      return data;
    } else {
      setElmAnnotations([]);
    }
    return null;
  };

  const updateMeasureCql = async () => {
    const data = await updateElmAnnotations(editorVal).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setElmTranslationError("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
    if (editorVal !== measure.cql) {
      const newMeasure: Measure = {
        ...measure,
        cql: editorVal,
        elmJson: JSON.stringify(data),
      };
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
    if (!editorVal) {
      updateElmAnnotations(measure.cql).catch((err) => {
        console.error("An error occurred while translating CQL to ELM", err);
        setElmTranslationError("Unable to translate CQL to ELM!");
        setElmAnnotations([]);
      });
      setEditorVal(measure.cql);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorVal]);

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={editorVal}
        inboundAnnotations={elmAnnotations}
        inboundErrorMarkers={errorMarkers}
        height={"1000px"}
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
