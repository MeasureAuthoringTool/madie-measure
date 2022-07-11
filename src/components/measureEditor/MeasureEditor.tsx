import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import "styled-components/macro";
import {
  MadieEditor,
  parseContent,
  translateContent,
} from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { Measure } from "@madie/madie-models";
import { CqlCode, CqlCodeSystem } from "@madie/cql-antlr-parser/dist/src";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import tw from "twin.macro";
import * as _ from "lodash";
import { useOktaTokens } from "@madie/madie-util";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const UpdateAlerts = tw.div`mb-2 h-5`;
const EditorActions = tw.div`mt-2 ml-2 mb-5 space-y-5`;

export type ElmTranslationError = {
  startLine: number;
  startChar: number;
  endChar: number;
  endLine: number;
  errorSeverity: string;
  errorType: string;
  message: string;
  targetIncludeLibraryId: string;
  targetIncludeLibraryVersionId: string;
  type: string;
};
export type ElmTranslationLibrary = {
  annotation: any[];
  contexts: any;
  identifier: any;
  parameters: any;
  schemaIdentifier: any;
  statements: any;
  usings: any;
  valueSets?: any;
};
export type ElmTranslation = {
  errorExceptions: ElmTranslationError[];
  externalErrors: any[];
  library: ElmTranslationLibrary;
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
  const { measure, setMeasure } = useCurrentMeasure();
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState("");
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [elmTranslationError, setElmTranslationError] = useState(null);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure.createdBy;
  const [valuesetMsg, setValuesetMsg] = useState(null);

  const hasParserErrors = async (val) => {
    return !!(parseContent(val)?.length > 0);
  };

  const getTranslationResult = async (val) => {
    return await translateContent(val);
  };

  const updateMeasureCql = async () => {
    try {
      const results = await Promise.allSettled([
        getTranslationResult(editorVal),
        hasParserErrors(editorVal),
      ]);

      if (results[0].status === "rejected") {
        console.error(
          "An error occurred while translating CQL to ELM",
          results[0].reason
        );
        setElmTranslationError(
          "Unable to translate CQL to ELM, CQL was not saved!"
        );
      } else if (results[1].status === "rejected") {
        const rejection: PromiseRejectedResult = results[1];
        console.error(
          "An error occurred while parsing the CQL",
          rejection.reason
        );
      } else {
        const cqlElmResult = results[0].value;
        const parseErrors = results[1].value;

        const cqlElmErrors = !!(cqlElmResult?.length > 0);
        if (editorVal !== measure.cql) {
          const cqlErrors = parseErrors || cqlElmErrors;
          const newMeasure: Measure = {
            ...measure,
            cql: editorVal,
            elmJson: JSON.stringify(cqlElmResult),
            cqlErrors,
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
      }
    } catch (err) {
      console.error(
        "An error occurred while parsing CQL and translating CQL to ELM",
        err
      );
      setElmTranslationError(
        "Unable to parse CQL and translate CQL to ELM, CQL was not saved!"
      );
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
    getTranslationResult(measure.cql).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setElmTranslationError("Unable to translate CQL to ELM!");
    });
    setEditorVal(measure.cql);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={editorVal}
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
