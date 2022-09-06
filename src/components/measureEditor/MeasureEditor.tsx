import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import {
  EditorAnnotation,
  EditorErrorMarker,
  MadieEditor,
  parseContent,
  validateContent,
  ElmTranslationError,
  ValidationResult,
  synchingEditorCqlContent,
} from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import { Toast } from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import { CqlCode, CqlCodeSystem } from "@madie/cql-antlr-parser/dist/src";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import * as _ from "lodash";
import { useOktaTokens, measureStore } from "@madie/madie-util";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const WarningText = tw(MessageText)`text-yellow-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const UpdateAlerts = tw.div`mb-2 h-5`;
const EditorActions = tw.div`mt-2 ml-2 mb-5 space-y-5`;

export const mapErrorsToAceAnnotations = (
  errors: ElmTranslationError[]
): EditorAnnotation[] => {
  let annotations: EditorAnnotation[] = [];
  if (errors && _.isArray(errors) && errors.length > 0) {
    annotations = errors.map((error: ElmTranslationError) => ({
      row: error.startLine - 1,
      column: error.startChar,
      type: error.errorSeverity.toLowerCase(),
      text: `${error.errorType}: ${error.startChar}:${error.endChar} | ${error.message}`,
    }));
  }
  return annotations;
};

export const mapErrorsToAceMarkers = (
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

// customCqlCode contains validation result from VSAC
// This object can be cached in future, to avoid calling VSAC everytime.
export interface CustomCqlCodeSystem extends CqlCodeSystem {
  valid?: boolean;
  errorMessage?: string;
}
export interface CustomCqlCode extends Omit<CqlCode, "codeSystem"> {
  codeSystem: CustomCqlCodeSystem;
  valid?: boolean;
  errorMessage?: string;
}

const MeasureEditor = () => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const { updateMeasure } = measureStore;
  useEffect(() => {
    const subscription = measureStore.subscribe((measure) => {
      setMeasure(measure);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState("");
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState({
    status: undefined,
    message: undefined,
  });
  const [error, setError] = useState(false);
  const [elmTranslationError, setElmTranslationError] = useState(null);
  // annotations control the gutter error icons.
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);
  // error markers control the error underlining in the editor.
  const [errorMarkers, setErrorMarkers] = useState<EditorErrorMarker[]>([]);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure?.createdBy;
  const [valuesetMsg, setValuesetMsg] = useState(null);

  // toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  // on load fetch elm translations results to display errors on editor
  useEffect(() => {
    updateElmAnnotations(measure?.cql).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setElmTranslationError("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
    setEditorVal(measure?.cql);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure?.cql]);

  const updateElmAnnotations = async (
    cql: string
  ): Promise<ValidationResult> => {
    setElmTranslationError(null);
    if (cql && cql.trim().length > 0) {
      const result = await validateContent(cql);
      const { errors, externalErrors } = result;
      // right now we are only displaying the external errors related to included libraries
      // and only the first error returned by elm translator
      handleToast("danger", externalErrors[0]?.message, true);
      if (isLoggedInUMLS(errors)) {
        setValuesetMsg("Please log in to UMLS!");
      }
      setElmAnnotations(mapErrorsToAceAnnotations(errors));
      setErrorMarkers(mapErrorsToAceMarkers(errors));
      return result;
    } else {
      setElmAnnotations([]);
    }
    return null;
  };

  const hasParserErrors = async (val) => {
    return !!(parseContent(val)?.length > 0);
  };
  const isLoggedInUMLS = (errors: ElmTranslationError[]) => {
    return JSON.stringify(errors).includes("Please log in to UMLS");
  };

  const updateMeasureCql = async () => {
    try {
      const inSyncCql = await synchingEditorCqlContent(
        editorVal,
        measure?.cql,
        measure?.cqlLibraryName,
        "",
        "0.0.000", //as the versioning is not implemented in measure for now we just send default value: 0.0.000
        "measureEditor"
      );

      const results = await Promise.allSettled([
        updateElmAnnotations(inSyncCql),
        hasParserErrors(inSyncCql),
      ]);

      if (results[0].status === "rejected") {
        console.error(
          "An error occurred while translating CQL to ELM",
          results[0].reason
        );
        setElmAnnotations([]);
      } else if (results[1].status === "rejected") {
        const rejection: PromiseRejectedResult = results[1];
        console.error(
          "An error occurred while parsing the CQL",
          rejection.reason
        );
      }

      const parseErrors =
        results[1].status === "fulfilled" ? results[1].value : "";

      const validationResult: ValidationResult =
        results[0].status === "fulfilled" ? results[0].value : null;
      const cqlElmErrors =
        !_.isEmpty(validationResult?.errors) ||
        !_.isEmpty(validationResult?.externalErrors);

      if (editorVal !== measure.cql) {
        const cqlErrors = parseErrors || cqlElmErrors;
        const newMeasure: Measure = {
          ...measure,
          cql: inSyncCql,
          elmJson:
            validationResult && JSON.stringify(validationResult?.translation),
          cqlErrors,
        };
        measureServiceApi
          .updateMeasure(newMeasure)
          .then(() => {
            updateMeasure(newMeasure);
            // setMeasure(newMeasure);
            setEditorVal(newMeasure?.cql);
            const successMessage =
              inSyncCql !== editorVal
                ? {
                    status: "warning",
                    message:
                      "CQL updated successfully! Library Name and Version can be updated in the Details tab. MADiE has over written the updated Library Name and Version",
                  }
                : { status: "success", message: "CQL saved successfully" };
            setSuccess(successMessage);
          })
          .catch((reason) => {
            console.error(reason);
            setError(true);
          });
      }
    } catch (err) {
      console.error(
        "An error occurred while parsing CQL and translating CQL to ELM",
        err
      );
      setElmTranslationError(
        "Unable to parse CQL and translate CQL to ELM, CQL was not saved!"
      );
      setElmAnnotations([]);
    }
  };

  const handleMadieEditorValue = (val: string) => {
    setSuccess({ status: undefined, message: undefined });
    setError(false);
    setEditorVal(val);
    setValuesetMsg(null);
  };

  const resetCql = (): void => {
    setEditorVal(measure?.cql || "");
  };

  return (
    <>
      <div tw="mx-8 my-6 shadow-lg rounded-md border border-slate overflow-hidden bg-white">
        <MadieEditor
          onChange={(val: string) => handleMadieEditorValue(val)}
          value={editorVal}
          inboundAnnotations={elmAnnotations}
          inboundErrorMarkers={errorMarkers}
          height={"80vh"}
          readOnly={!canEdit}
        />
        <EditorActions data-testid="measure-editor-actions">
          <UpdateAlerts data-testid="update-cql-alerts">
            {success?.status === "warning" ? (
              <WarningText data-testid="save-cql-success">
                {success.message}
              </WarningText>
            ) : (
              <SuccessText data-testid="save-cql-success">
                {success.message}
              </SuccessText>
            )}
            {valuesetMsg && (
              <SuccessText data-testid="valueset-success">
                {valuesetMsg}
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
          {canEdit && (
            <>
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
            </>
          )}
        </EditorActions>
      </div>
      <Toast
        toastKey="measure-cql-editor-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-measure-cql-generic-error-text"
            : "edit-measure-cql-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        // autoHideDuration={6000}
      />
    </>
  );
};
export default MeasureEditor;
