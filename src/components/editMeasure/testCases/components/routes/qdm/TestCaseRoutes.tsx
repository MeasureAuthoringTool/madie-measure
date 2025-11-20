import React, { useEffect, useCallback, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import TestCaseLandingQdm from "../../testCaseLanding/qdm/TestCaseLanding";
import EditTestCase from "../../editTestCase/qdm/EditTestCase";
import NotFound from "../../notfound/NotFound";
import StatusHandler, {
  CustomWarningMessage,
} from "../../statusHandler/StatusHandler";
import {
  Measure,
  MeasureErrorType,
  TestCaseImportOutcome,
} from "@madie/madie-models";
import { measureStore } from "@madie/madie-util";
import { CqmMeasure, ValueSet } from "cqm-models";
import useCqmConversionService from "../../../api/CqmModelConversionService";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import { QdmExecutionContextProvider } from "./QdmExecutionContext";
import TestCaseLandingWrapper from "../../testCaseLanding/common/TestCaseLandingWrapper";
import _ from "lodash";
import SDEPage from "../../testCaseConfiguration/sde/SDEPage";
import Expansion from "../../testCaseConfiguration/expansion/Expansion";
import TestCaseData from "../../testCaseConfiguration/testCaseData/TestCaseData";
import RAVPage from "../../testCaseConfiguration/rav/RAVPage";
import ExecutionOptions from "../../testCaseConfiguration/executionOptions/ExecutionOptions";
import {
  CQL_RETURN_TYPES_MISMATCH_ERROR,
  SDE_RAV_RETURN_TYPES_MISMATCH_ERROR,
} from "../qiCore/TestCaseRoutes";

const TestCaseRoutes = () => {
  const [cqmMeasureErrors, setCqmMeasureErrors] = useState<Array<string>>([]);
  const [warnings, setWarnings] = useState<Array<string>>([]);
  const [errors, setErrors] = useState<Array<string>>([]);

  const [importWarnings, setImportWarnings] = useState<TestCaseImportOutcome[]>(
    []
  );
  const [customWarningMessages, setCustomWarningMessages] = useState<
    CustomWarningMessage[]
  >([]);
  const [shiftTestCaseDatesWarnings, setShiftTestCaseDatesWarnings] = useState<
    Array<string>
  >([]);
  const [importErrors, setImportErrors] = useState<Array<string>>([]);
  const [executionContextReady, setExecutionContextReady] =
    useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>();
  const [contextFailure, setContextFailure] = useState<boolean>();
  const [cqmMeasure, setCqmMeasure] = useState<CqmMeasure>();

  const cqmService = useRef(useCqmConversionService());
  const terminologyService = useRef(useTerminologyServiceApi());

  const prevMeasureRef = useRef(null);
  const [measure, setMeasure] = useState<Measure>(measureStore.state);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const cqmMeasureConvertAbortController = useRef<AbortController>(
    new AbortController()
  );
  const getValueSetAbortController = useRef<AbortController>(
    new AbortController()
  );
  // arbitraty number that's just supposed to increment on abort calls
  // sole purpose is only to spin off the useEffect that typically listens for measure changes
  const [aborted, setAborted] = useState(0);
  // instantiating both at once is not the play here.
  // we instantiate only once on load. We abort individually, instantiate individually through the useEffect
  const onAbort = useCallback(async () => {
    // TODO: gracefully fail when we abort so that the cqmMeasure begins a rebuild
    if (!cqmMeasureConvertAbortController.current.signal.aborted) {
      cqmMeasureConvertAbortController.current.abort();
    }
    if (!getValueSetAbortController.current.signal.aborted) {
      getValueSetAbortController.current.abort();
    }
  }, [
    cqmMeasureConvertAbortController.current,
    getValueSetAbortController.current,
  ]);
  const handleAbort = () => {
    setAborted(aborted + 1);
  };
  useEffect(() => {
    // only run updates if measure has changed, ignoring test cases
    if (
      _.isNil(prevMeasureRef.current) ||
      !_.isEqual(
        {
          ...measure,
          testCases: null,
        },
        { ...prevMeasureRef.current, testCases: null }
      )
    ) {
      prevMeasureRef.current = measure;
      setContextFailure(null);
      setCqmMeasure(null);
      setExecutionContextReady(false);
      // cut the lines on previous calls to prevent overlapping state updates
      // getValueSetAbortController.current.abort(); // this abort triggers a catch block that stops the rest of this.
      const localErrors: Array<string> = [];
      if (measure) {
        if (measure.cqlErrors || !measure.elmJson) {
          localErrors.push(
            "An error exists with the measure CQL, please review the CQL Editor tab."
          );
        }
        if (!measure?.groups?.length) {
          localErrors.push(
            "No Population Criteria is associated with this measure. Please review the Population Criteria tab."
          );
        }
        if (measure?.errors) {
          if (
            measure.errors?.includes(
              MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
            )
          ) {
            localErrors.push(CQL_RETURN_TYPES_MISMATCH_ERROR);
          }

          if (
            measure.errors?.includes(
              MeasureErrorType.MISMATCH_CQL_RISK_ADJUSTMENT
            ) ||
            measure.errors.includes(
              MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA
            )
          ) {
            localErrors.push(SDE_RAV_RETURN_TYPES_MISMATCH_ERROR);
          }
        }

        if (
          !localErrors.length ||
          measure?.testCaseConfiguration?.executeInvalidTestCases
        ) {
          onAbort();
          cqmMeasureConvertAbortController.current = new AbortController();
          cqmService.current
            .convertToCqmMeasure(
              measure,
              cqmMeasureConvertAbortController.current
            )
            .then((convertedMeasure: any) => {
              if (convertedMeasure) {
                getValueSetAbortController.current = new AbortController();
                getQdmValueSets(convertedMeasure);
              }
            })
            .catch((err) => {
              if (err.name === "CanceledError") {
                handleAbort();
                return;
                // not doing anything else after this, we're looping back in
              }
              // Added a console log because anytime this fails, we get an error banner with no other information
              console.error(
                "An error occurred while converting to CQM measure: ",
                err
              );
              setContextFailure(true);
              setCqmMeasureErrors((prevState) => [
                ...prevState,
                "An error occurred, please try again. If the error persists, please contact the help desk",
              ]);
            });
        }
        if (measure?.testCaseConfiguration?.executeInvalidTestCases) {
          setCustomWarningMessages([
            {
              message:
                "Execution of invalid test cases is enabled. You may receive inaccurate pass/fail results. You can update this setting in Execution Configuration tab.",
              testDataId: "test-cases-in-use-warning",
            },
          ]);
        }
        setCqmMeasureErrors((prevState) => [...prevState, ...localErrors]);
      }
    }
  }, [measure, aborted]);

  //given a converted measure, append valuesets to it using the service
  const getQdmValueSets = async (convertedMeasure: CqmMeasure) => {
    try {
      setCqmMeasureErrors(() => []);
      const drcValueSets: ValueSet[] =
        terminologyService.current.getValueSetsForDRCs(convertedMeasure);
      const vs = await terminologyService.current.getQdmValueSetsExpansion(
        convertedMeasure,
        measure.testCaseConfiguration?.manifestExpansion,
        getValueSetAbortController.current.signal
      );
      const newCqmMeasure = {
        ...convertedMeasure,
        value_sets: [...vs, ...drcValueSets],
      };
      setCqmMeasure(newCqmMeasure);
      setExecutionContextReady(
        !!newCqmMeasure && !_.isEmpty(newCqmMeasure?.value_sets) && !!measure
      );
    } catch (e) {
      if (e.code === "ERR_CANCELED") {
        handleAbort();
      } else {
        setContextFailure(true);
        setCqmMeasureErrors((prevState) => [...prevState, e.message]);
      }
    }
  };
  return (
    <QdmExecutionContextProvider
      value={{
        measureState: [measure, setMeasure],
        cqmMeasureState: [cqmMeasure, setCqmMeasure],
        executionContextReady,
        setExecutionContextReady,
        executing,
        setExecuting,
        contextFailure,
      }}
    >
      {cqmMeasureErrors && cqmMeasureErrors.length > 0 && (
        <StatusHandler
          error={true}
          errorMessages={cqmMeasureErrors}
          testDataId="execution_context_loading_errors"
        />
      )}
      {importErrors && importErrors.length > 0 && (
        <StatusHandler
          error={true}
          errorMessages={importErrors}
          testDataId="import-error-messages"
        />
      )}
      {(warnings?.length || customWarningMessages?.length > 0) && (
        <StatusHandler
          warning={true}
          shiftTestCaseDatesWarning={shiftTestCaseDatesWarnings}
          customWarningMessages={customWarningMessages}
          testDataId="execution_context_loading_warning"
        />
      )}

      {importWarnings && importWarnings.length > 0 && (
        <StatusHandler
          importWarnings={importWarnings}
          testDataId="import-warning-messages"
        />
      )}
      <Routes>
        <Route path="/list-page">
          <Route
            index
            element={
              <TestCaseLandingWrapper
                qdm
                children={
                  <TestCaseLandingQdm
                    errors={cqmMeasureErrors}
                    setErrors={setCqmMeasureErrors}
                    setWarnings={setWarnings}
                    setImportWarnings={setImportWarnings}
                    setImportErrors={setImportErrors}
                    setShiftTestCaseDatesWarnings={
                      setShiftTestCaseDatesWarnings
                    }
                    setCustomWarningMessages={setCustomWarningMessages}
                  />
                }
              />
            }
          />
          <Route
            path=":criteriaId"
            element={
              <TestCaseLandingWrapper
                qdm
                children={
                  <TestCaseLandingQdm
                    errors={cqmMeasureErrors}
                    setErrors={setCqmMeasureErrors}
                    setWarnings={setWarnings}
                    setImportWarnings={setImportWarnings}
                    setImportErrors={setImportErrors}
                    setShiftTestCaseDatesWarnings={
                      setShiftTestCaseDatesWarnings
                    }
                    setCustomWarningMessages={setCustomWarningMessages}
                  />
                }
              />
            }
          />
          <Route
            path="/list-page/sde"
            element={
              <TestCaseLandingWrapper
                qdm
                children={
                  <SDEPage
                    setExecutionContextReady={setExecutionContextReady}
                  />
                }
              />
            }
          />
          <Route
            path="/list-page/rav"
            element={
              <TestCaseLandingWrapper
                qdm
                children={
                  <RAVPage
                    setExecutionContextReady={setExecutionContextReady}
                  />
                }
              />
            }
          />
          <Route
            path="/list-page/expansion"
            element={<TestCaseLandingWrapper qdm children={<Expansion />} />}
          />
          <Route
            path="/list-page/execution-options"
            element={
              <TestCaseLandingWrapper
                qdm={false}
                children={
                  <ExecutionOptions
                    setCustomWarningMessages={setCustomWarningMessages}
                  />
                }
              />
            }
          />
          <Route
            path="/list-page/test-case-data"
            element={
              <TestCaseLandingWrapper
                qdm
                children={
                  <TestCaseData
                    errors={errors}
                    warnings={warnings}
                    setErrors={setErrors}
                    setImportWarnings={setImportWarnings}
                    setShiftTestCaseDatesWarnings={
                      setShiftTestCaseDatesWarnings
                    }
                    setWarnings={setWarnings}
                  />
                }
              />
            }
          />
        </Route>
        <Route path=":id" index element={<EditTestCase />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </QdmExecutionContextProvider>
  );
};

export default TestCaseRoutes;
