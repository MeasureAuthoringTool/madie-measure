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
import useTerminologyServiceApi from "../../api/useTerminologyServiceApi";
import tw from "twin.macro";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslation,
  ElmTranslationError,
  ElmValueSet,
} from "../../api/useElmTranslationServiceApi";
import useOktaTokens from "../../hooks/useOktaTokens";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const UpdateAlerts = tw.div`mb-2 h-5`;
const EditorActions = tw.div`mt-2 ml-2 mb-5 space-y-5`;

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

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure.createdBy;
  const terminologyServiceApi = useTerminologyServiceApi();
  const [valuesetMsg, setValuesetMsg] = useState(null);

  const getValueSetErrors = async (
    valuesetsArray: ElmValueSet[],
    tgtValue: string
  ): Promise<ElmTranslationError[]> => {
    const valuesetsErrorArray: ElmTranslationError[] = [];
    if (valuesetsArray && tgtValue) {
      const results = await Promise.allSettled(
        valuesetsArray.map(async (valueSet, i) => {
          const oid = getOid(valueSet);
          await terminologyServiceApi
            .getValueSet(tgtValue, oid, valueSet.locator)
            .then((response) => {
              if (response.errorMsg) {
                const vsErrorForElmTranslationError: ElmTranslationError =
                  processValueSetErrorForElmTranslationError(
                    response.errorMsg.toString(),
                    valueSet.locator
                  );
                valuesetsErrorArray.push(vsErrorForElmTranslationError);
              }
            });
        })
      );
      return valuesetsErrorArray;
    }
  };

  const getTgt = (): any => {
    return window.localStorage.getItem("TGT");
  };
  const getTgtValue = (tgt: any): any => {
    let tgtValue = null;
    if (tgt) {
      let tgtObjFromLocalStorage = JSON.parse(tgt);
      for (const [key, value] of Object.entries(tgtObjFromLocalStorage)) {
        if (key === "TGT") {
          tgtValue = value.toString();
        }
      }
    }
    return tgtValue;
  };

  const getOid = (valueSet: ElmValueSet): string => {
    return valueSet.id.match(/[0-2](\.(0|[1-9][0-9]*))+/)[0];
  };

  const getStartLine = (locator: string): number => {
    const index = locator.indexOf(":");
    const startLine = locator.substring(0, index);
    return Number(startLine);
  };

  const getStartChar = (locator: string): number => {
    const index = locator.indexOf(":");
    const index2 = locator.indexOf("-");
    const startChar = locator.substring(index + 1, index2);
    return Number(startChar);
  };

  const getEndLine = (locator: string): number => {
    const index = locator.indexOf("-");
    const endLineAndChar = locator.substring(index + 1);
    const index2 = locator.indexOf(":");
    const endLine = endLineAndChar.substring(0, index2);
    return Number(endLine);
  };

  const getEndChar = (locator: string): number => {
    const index = locator.indexOf("-");
    const endLineAndChar = locator.substring(index + 1);
    const index2 = locator.indexOf(":");
    const endLine = endLineAndChar.substring(index2 + 1);
    return Number(endLine);
  };

  const processValueSetErrorForElmTranslationError = (
    vsError: string,
    valuesetLocator: string
  ): ElmTranslationError => {
    const startLine: number = getStartLine(valuesetLocator);
    const startChar: number = getStartChar(valuesetLocator);
    const endLine: number = getEndLine(valuesetLocator);
    const endChar: number = getEndChar(valuesetLocator);
    return {
      startLine: startLine,
      startChar: startChar,
      endChar: endChar,
      endLine: endLine,
      errorSeverity: "Error",
      errorType: "ValueSet",
      message: vsError,
      targetIncludeLibraryId: "",
      targetIncludeLibraryVersionId: "",
      type: "ValueSet",
    };
  };

  const updateElmAnnotations = async (cql: string): Promise<ElmTranslation> => {
    setElmTranslationError(null);
    if (cql && cql.trim().length > 0) {
      const data = await elmTranslationServiceApi.translateCqlToElm(cql);

      let valuesetsErrors = null;
      const tgt = getTgt();
      const tgtValue = getTgtValue(tgt);
      if (
        data.library?.valueSets?.def !== null &&
        tgt &&
        tgtValue &&
        tgtValue !== ""
      ) {
        valuesetsErrors = await getValueSetErrors(
          data.library?.valueSets?.def,
          tgtValue
        );
      }

      const allErrorsArray: ElmTranslationError[] = data?.errorExceptions
        ? data?.errorExceptions
        : [];
      if (valuesetsErrors && valuesetsErrors.length > 0) {
        valuesetsErrors.map((valueSet, i) => {
          allErrorsArray.push(valueSet);
        });
      } else {
        if (!tgtValue) {
          setValuesetMsg("Please log in to UMLS!");
          window.localStorage.removeItem("TGT");
        } else {
          setValuesetMsg("Value Set is valid!");
        }
      }

      // errorExceptions contains error data for the primary library,
      // aka the CQL loaded into the editor. Errors from included
      // libraries are available in data.annotations.errors, if needed.
      const elmAnnotations = mapElmErrorsToAceAnnotations(allErrorsArray);
      const errorMarkers = mapElmErrorsToAceMarkers(allErrorsArray);
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
    setValuesetMsg(null);
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
        readOnly={!canEdit}
      />

      <EditorActions data-testid="measure-editor-actions">
        <UpdateAlerts data-testid="update-cql-alerts">
          {success && (
            <SuccessText data-testid="save-cql-success">
              CQL saved successfully
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
    </>
  );
};

export default MeasureEditor;
