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
import {
  Button,
  MadieSpinner,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import { CqlCode, CqlCodeSystem } from "@madie/cql-antlr-parser/dist/src";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import * as _ from "lodash";
import {
  useOktaTokens,
  measureStore,
  useDocumentTitle,
  routeHandlerStore,
} from "@madie/madie-util";
import StatusHandler from "./StatusHandler";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;

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
  useDocumentTitle("MADiE Edit Measure CQL");
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const { updateMeasure } = measureStore;
  const [processing, setProcessing] = useState<boolean>(true);
  useEffect(() => {
    const subscription = measureStore.subscribe((measure) => {
      setMeasure(measure);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [discardDialogOpen, setDiscardDialogOpen]: [
    boolean,
    Dispatch<SetStateAction<boolean>>
  ] = useState(false);
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState("");
  const { updateRouteHandlerState } = routeHandlerStore;
  // We have a unique case where when we have a fresh measure the cql isn't an empty string. It's a null or undefined value.
  const [isCQLUnchanged, setIsCQLUnchanged] = useState<boolean>(true);
  const checkIfCQLUnchanged = (val1, val2) => {
    // if  both measure cql are falsey values return true
    if (!val1 && !val2) {
      return true;
    }
    return val1 === val2;
  };
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: isCQLUnchanged,
      pendingRoute: "",
    });
  }, [isCQLUnchanged, updateRouteHandlerState]);

  const measureServiceApi = useMeasureServiceApi();
  // set success message
  const [success, setSuccess] = useState({
    status: undefined,
    message: undefined,
  });
  const [error, setError] = useState(false);
  // const [elmTranslationError, setElmTranslationError] = useState(null); // should not be own error, modified to error message
  const [outboundAnnotations, setOutboundAnnotations] = useState([]);
  // annotations control the gutter error icons.
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);
  // error markers control the error underlining in the editor.
  const [errorMarkers, setErrorMarkers] = useState<EditorErrorMarker[]>([]);
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit =
    measure?.createdBy === userName ||
    measure?.acls?.some(
      (acl) => acl.userId === userName && acl.roles.indexOf("SHARED_WITH") >= 0
    );

  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  // on load fetch elm translations results to display errors on editor not just on load..
  useEffect(() => {
    updateElmAnnotations(measure?.cql).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      // setElmTranslationError("Unable to translate CQL to ELM!");
      setErrorMessage("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
    setEditorVal(measure?.cql);
    setProcessing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure?.cql]);

  const updateElmAnnotations = async (
    cql: string
  ): Promise<ValidationResult> => {
    // setElmTranslationError(null); ? set Error false?
    setError(false);
    if (cql && cql.trim().length > 0) {
      const result = await validateContent(cql);
      const { errors, externalErrors } = result;
      // right now we are only displaying the external errors related to included libraries
      // and only the first error returned by elm translator
      if (errors?.length > 0 || externalErrors?.length > 0) {
        setError(true);
      }
      setErrorMessage(externalErrors[0]?.message);
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
    setProcessing(true);
    try {
      const inSyncCql = await synchingEditorCqlContent(
        editorVal,
        measure?.cql,
        measure?.cqlLibraryName,
        "",
        measure?.version,
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
            setEditorVal(newMeasure?.cql);
            setIsCQLUnchanged(true);
            const successMessage =
              inSyncCql !== editorVal
                ? {
                    status: "success",
                    message:
                      "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version.",
                  }
                : { status: "success", message: "CQL saved successfully" };
            setSuccess(successMessage);
          })
          .catch((reason) => {
            // inner failure
            console.error(reason);
            setError(true);
          });
      }
      // outer reject from try block. Doesn't convey any meaningful errors
    } catch (err) {
      console.error(
        "An error occurred while parsing CQL and translating CQL to ELM",
        err
      );
      setError(true);
      // header: error
      setErrorMessage(
        "Unable to parse CQL and translate CQL to ELM, CQL was not saved!"
      );
      setElmAnnotations([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleMadieEditorValue = (val: string) => {
    setSuccess({ status: undefined, message: undefined });
    setError(false);
    setEditorVal(val);
    setValuesetMsg(null);
    setIsCQLUnchanged(checkIfCQLUnchanged(val, measure?.cql));
  };

  const resetCql = (): void => {
    setEditorVal(measure?.cql || "");
    setIsCQLUnchanged(true);
  };

  return (
    <>
      <div tw="flex flex-wrap mx-8 my-6 shadow-lg rounded-md border border-slate bg-white">
        <div tw="flex-none sm:w-full">
          {valuesetMsg && (
            <SuccessText data-testid="valueset-success">
              {valuesetMsg}
            </SuccessText>
          )}
          <StatusHandler
            error={error}
            errorMessage={errorMessage}
            success={success}
            outboundAnnotations={outboundAnnotations}
          />
          {!processing && (
            <MadieEditor
              onChange={(val: string) => handleMadieEditorValue(val)}
              value={editorVal}
              inboundAnnotations={elmAnnotations}
              inboundErrorMarkers={errorMarkers}
              height="calc(100vh - 135px)"
              readOnly={!canEdit}
              setOutboundAnnotations={setOutboundAnnotations}
            />
          )}
          {processing && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                height: "calc(100vh - 135px)",
              }}
            >
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          )}
        </div>
        <div
          tw="flex h-24 bg-white w-full sticky bottom-0 left-0 z-10"
          data-testid="measure-editor-actions"
        >
          <div tw="w-1/2 flex flex-col px-10 py-2"></div>
          {canEdit && (
            <div
              tw="w-1/2 flex justify-end items-center px-10 py-6"
              style={{ alignItems: "end" }}
            >
              <Button
                variant="outline"
                tw="m-2"
                onClick={() => setDiscardDialogOpen(true)}
                data-testid="reset-cql-btn"
                disabled={isCQLUnchanged}
              >
                Discard Changes
              </Button>
              <Button
                variant="cyan"
                tw="m-2"
                onClick={() => updateMeasureCql()}
                data-testid="save-cql-btn"
                disabled={isCQLUnchanged}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </div>
      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={() => {
          resetCql();
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </>
  );
};
export default MeasureEditor;
