import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
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
  isUsingEmpty,
  MadieTerminologyEditor,
  ValueSetForSearch,
} from "@madie/madie-editor";
import {
  Button,
  MadieSpinner,
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";
import {
  Measure,
  MeasureErrorType,
  Code,
  CqlMetaData,
  CodeSystem,
} from "@madie/madie-models";
import {
  CqlAntlr,
  CqlCode,
  CqlCodeSystem,
} from "@madie/cql-antlr-parser/dist/src";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import * as _ from "lodash";
import {
  measureStore,
  useDocumentTitle,
  routeHandlerStore,
  checkUserCanEdit,
  useFeatureFlags,
} from "@madie/madie-util";
import StatusHandler from "./StatusHandler";
import { SuccessText } from "../../../styles/editMeasure/editor";
import "./MeasureEditor.scss";
import applyCode, { CodeChangeResult } from "./codeApplier";
import applyValueset from "./valuesetApplier";

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
  const [codeMap, setCodeMap] = useState<Map<string, Code>>(
    new Map<string, Code>()
  );

  const { updateMeasure } = measureStore;
  const [processing, setProcessing] = useState<boolean>(true);
  const featureFlags = useFeatureFlags();
  const isQDM = measure?.model?.includes("QDM");

  useEffect(() => {
    const subscription = measureStore.subscribe((measure: Measure) => {
      setMeasure(measure);

      if (
        measure?.errors?.length > 0 &&
        measure.errors.includes(
          MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
        )
      ) {
        setToastOpen(true);
        setToastMessage(
          "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
        );
      }
      if (
        measure?.errors?.length > 0 &&
        (measure.errors.includes(
          MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA
        ) ||
          measure.errors.includes(
            MeasureErrorType.MISMATCH_CQL_RISK_ADJUSTMENT
          ))
      ) {
        setToastOpen(true);
        setToastMessage(
          "Supplemental Data Elements or Risk Adjustment Variables in the Population Criteria section are invalid. Please check and update these values. Test cases will not execute until this issue is resolved."
        );
      }
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
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");

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
        const elmErrors = _.filter(errors, { errorSeverity: "Error" });
        setError(!_.isEmpty(elmErrors) || externalErrors.length > 0);
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

  const updateCodeSystemMap = (
    newMeasure,
    cqlMetaData: Map<string, CodeSystem>
  ) => {
    const definitions = new CqlAntlr(newMeasure.cql).parse();
    if (definitions?.codes && cqlMetaData) {
      const parsedCodes = definitions?.codes.map((code) => ({
        codeId: code?.codeId.replace(/['"]/g, ""),
        codeSystem: code?.codeSystem.replace(/['"]/g, ""),
      }));

      const updatedCodeSystemMap: Map<string, CodeSystem> = Object.fromEntries(
        Object.entries(cqlMetaData)?.filter(([key, value]) =>
          parsedCodes.some(
            (parsedCode) =>
              parsedCode.codeId === value?.name &&
              parsedCode.codeSystem === value?.codeSystem
          )
        )
      ) as {} as Map<string, CodeSystem>;
      return { codeSystemMap: updatedCodeSystemMap };
    }
  };

  const updateMeasureCql = async (editorValue: string) => {
    try {
      //Get model name and version
      const using = measure?.model.split(" v");

      const inSyncCql = await synchingEditorCqlContent(
        editorValue,
        measure?.cql,
        measure?.cqlLibraryName,
        "",
        measure?.version,
        using[0],
        using[1],
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

      // cqlErrors flag is turned ON either the CQL has external Errors or at least 1 error whose errorSeverity is "Error"
      // Warnings are ignored and doesn't affect cqlErrors flag
      const cqlElmErrors =
        !_.isEmpty(
          _.filter(validationResult?.errors, { errorSeverity: "Error" })
        ) || !_.isEmpty(validationResult?.externalErrors);

      if (editorValue !== measure.cql) {
        const cqlErrors = parseErrors || cqlElmErrors;
        const newMeasure: Measure = {
          ...measure,
          cql: inSyncCql,
          elmJson:
            validationResult && JSON.stringify(validationResult?.translation),
          cqlErrors,
        };
        // Get version information into the update call.
        if (
          newMeasure.measureMetaData?.cqlMetaData?.codeSystemMap === undefined
        ) {
          if (!newMeasure.measureMetaData?.cqlMetaData) {
            newMeasure.measureMetaData.cqlMetaData =
              {} as unknown as CqlMetaData;
          }
          newMeasure.measureMetaData.cqlMetaData.codeSystemMap = new Map<
            string,
            Code
          >();
        }
        codeMap.forEach((entry) => {
          newMeasure.measureMetaData.cqlMetaData.codeSystemMap[entry.name] =
            entry;
        });

        //removing code entry from cqlMetaData when a code is removed from cql editor manually(not through UI)
        newMeasure.measureMetaData.cqlMetaData = updateCodeSystemMap(
          newMeasure,
          measure?.measureMetaData?.cqlMetaData?.codeSystemMap
        );

        measureServiceApi
          .updateMeasure(newMeasure)
          .then((response: any) => {
            const updatedMeasure = response.data;
            updateMeasure(updatedMeasure);
            setCodeMap(new Map<string, Code>());
            setEditorVal(newMeasure?.cql);
            setIsCQLUnchanged(true);
            if (isUsingEmpty(editorVal)) {
              setSuccess({
                status: "success",
                message:
                  "CQL updated successfully but was missing a Using statement. Please add in a valid model and version.",
              });
            } else {
              const successMessage =
                inSyncCql !== editorVal
                  ? {
                      status: "success",
                      message:
                        "CQL updated successfully! Library Statement or Using Statement were incorrect. MADiE has overwritten them to ensure proper CQL.",
                    }
                  : { status: "success", message: "CQL saved successfully" };

              setSuccess(successMessage);
            }
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

  const handleUpdateMeasureCql = (cql?: string) => {
    setProcessing(true);
    if (cql) {
      // this is the updated cql after removing the code (i.e., handleDeleteCode from saved codes)
      updateMeasureCql(cql);
    } else {
      updateMeasureCql(editorVal);
    }
  };

  const handleTerminologyEditorValue = (code) => {
  const handleApplyCode = (code) => {
    const termCode: Code = code;
    const result: CodeChangeResult = applyCode(editorVal, termCode);

    if (result.status) {
      //if result status is true, we modified the CQL
      //  let'/s store off the codesystem/code/version
      codeMap.set(termCode.name, termCode);
      //   we can send it with the measure when it's saved
      handleMadieEditorValue(result.cql);
    }
    //if result status is false, we didn't modify.. so CQL didn't change,
    //  but confirmation messages can still be displayed
    setToastMessage(result.message);
    setToastType("success");
    setToastOpen(true);
  };

  const handleCodeDelete = (selectedCode) => {
    let isSameCodeSystemPresentInMultipleCodes = false;
    const definitions = new CqlAntlr(editorVal).parse();
    const parsedSelectedCodeDetails = definitions?.codes?.filter((code) => {
      if (
        code?.codeId.replace(/['"]/g, "") === selectedCode?.name &&
        code?.codeSystem.replace(/['"]/g, "") === selectedCode?.codeSystem
      ) {
        return code;
      }

      if (code?.codeSystem.replace(/['"]/g, "") === selectedCode?.codeSystem) {
        //check if the same codesystem of selected code (that is to be deleted) is used in multiple codes
        isSameCodeSystemPresentInMultipleCodes = true;
      }
    })[0];

    const splittedCql: string[] = editorVal.split("\n");
    const updatedCql = removeCodeFromCql(
      splittedCql,
      isSameCodeSystemPresentInMultipleCodes,
      parsedSelectedCodeDetails,
      definitions?.codeSystems,
      selectedCode?.codeSystem
    );
    setEditorVal(updatedCql);
    handleUpdateMeasureCql(updatedCql);
  };

  const removeCodeFromCql = (
    splittedCql: string[],
    isSameCodeSystemPresentInMultipleCodes: boolean,
    parsedSelectedCodeDetails,
    codeSystems,
    selectedCodeSytemName
  ) => {
    if (!isSameCodeSystemPresentInMultipleCodes) {
      const relatedCodeSystem = codeSystems?.filter(
        (codeSystem) =>
          codeSystem?.name?.replace(/['"]/g, "") === selectedCodeSytemName
      )[0];
      if (relatedCodeSystem && Object.keys(relatedCodeSystem).length > 0) {
        //removing code and codesystem(when this codesystem is not used in any other code apart from selected one) from cql
        return splittedCql
          ?.filter(
            (line, index) =>
              (index < parsedSelectedCodeDetails?.start?.line - 1 ||
                index > parsedSelectedCodeDetails?.stop?.line - 1) &&
              (index < relatedCodeSystem?.start?.line - 1 ||
                index > relatedCodeSystem?.stop?.line - 1)
          )
          ?.join("\n");
      }
    } else {
      //removing code from cql
      return splittedCql
        ?.filter(
          (line, index) =>
            index < parsedSelectedCodeDetails?.start?.line - 1 ||
            index > parsedSelectedCodeDetails?.stop?.line - 1
        )
        ?.join("\n");
    }
  // structure of statement: valueset "<name>": "urn:oid:<oid>"
  // valueset "Ethnicity": 'urn:oid:2.16.840.1.114222.4.11.837'
  const handleApplyValueSet = (vs: ValueSetForSearch) => {
    const result: CodeChangeResult = applyValueset(editorVal, vs);
    if (result.status) {
      setToastType("success");
      handleMadieEditorValue(result.cql);
    } else {
      setToastType("danger");
    }
    setToastMessage(result.message);
    setToastOpen(true);
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
      <div id="status-handler">
        <StatusHandler
          error={error}
          errorMessage={errorMessage}
          success={success}
          outboundAnnotations={outboundAnnotations}
          hasSubTitle={false}
        />
      </div>
      <div tw="flex flex-wrap mx-8 shadow-lg rounded-md border border-slate bg-white">
        <div tw="flex-none sm:w-full">
          {valuesetMsg && (
            <SuccessText data-testid="valueset-success">
              {valuesetMsg}
            </SuccessText>
          )}
          {!processing &&
            (featureFlags?.qdmCodeSearch && isQDM ? (
              <MadieTerminologyEditor
                handleApplyCode={handleApplyCode}
                handleApplyValueSet={handleApplyValueSet}
                onChange={(val: string) => handleMadieEditorValue(val)}
                value={editorVal}
                inboundAnnotations={elmAnnotations}
                inboundErrorMarkers={errorMarkers}
                height="calc(100vh - 135px)"
                readOnly={!canEdit}
                setOutboundAnnotations={setOutboundAnnotations}
                measureStoreCql={measure?.cql}
                cqlMetaData={measure?.measureMetaData?.cqlMetaData}
                measureModel={measure?.model}
                handleCodeDelete={handleCodeDelete}
                setEditorVal={setEditorVal}
                setIsCQLUnchanged={setIsCQLUnchanged}
                isCQLUnchanged={isCQLUnchanged}
              />
            ) : (
              <>
                <MadieEditor
                  onChange={handleMadieEditorValue}
                  value={editorVal}
                  inboundAnnotations={elmAnnotations}
                  inboundErrorMarkers={errorMarkers}
                  height="calc(100vh - 135px)"
                  readOnly={!canEdit}
                  setOutboundAnnotations={setOutboundAnnotations}
                />
              </>
            ))}
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
      </div>

      <div className="bottom-row">
        <div className="spacer" />
        {canEdit && (
          <>
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
              onClick={() => handleUpdateMeasureCql()}
              data-testid="save-cql-btn"
              disabled={isCQLUnchanged}
            >
              Save
            </Button>
          </>
        )}
      </div>

      <Toast
        toastKey="measure-errors-toast"
        aria-live="polite"
        toastType={toastType}
        testId="measure-errors-toast"
        open={toastOpen}
        message={toastMessage}
        onClose={() => {
          setToastType("danger");
          setToastMessage("");
          setToastOpen(false);
        }}
        autoHideDuration={10000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />
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
