import React, { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import TestCaseLanding from "../../testCaseLanding/qiCore/TestCaseLanding";
import EditTestCase from "../../editTestCase/qiCore/EditTestCase";
import NotFound from "../../notfound/NotFound";
import {
  measureStore,
  useFeatureFlags,
  useMeasureServiceApi,
} from "@madie/madie-util";
import { Bundle, ValueSet } from "fhir/r4";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import { ExecutionContextProvider } from "./ExecutionContext";

import * as _ from "lodash";
import StatusHandler, {
  CustomWarningMessage,
} from "../../statusHandler/StatusHandler";
import TestCaseLandingWrapper from "../../testCaseLanding/common/TestCaseLandingWrapper";
import {
  Measure,
  MeasureErrorType,
  TestCaseImportOutcome,
} from "@madie/madie-models";
import TestCaseData from "../../testCaseConfiguration/testCaseData/TestCaseData";
import SDEPage from "../../testCaseConfiguration/sde/SDEPage";
import Expansion from "../../testCaseConfiguration/expansion/Expansion";
import RAVPage from "../../testCaseConfiguration/rav/RAVPage";
import ExecutionOptions from "../../testCaseConfiguration/executionOptions/ExecutionOptions";

// error messages
export const TEST_CASE_EXECUTION_ERROR =
  "Test Cases cannot be executed and Valuesets from the measure CQL cannot be expanded until this is resolved.";
export const NO_PC_ERROR =
  "No Population Criteria is associated with this measure. Please review the Population Criteria tab.";
export const CQL_ERROR =
  "An error exists with the measure CQL, please review the CQL Editor tab.";
export const CQL_RETURN_TYPES_MISMATCH_ERROR =
  "One or more Population Criteria has a mismatch with CQL return types. Please check the population criteria tab to update.";
export const SDE_RAV_RETURN_TYPES_MISMATCH_ERROR =
  "Supplemental Data Elements or Risk Adjustment Variables in the Population Criteria section are invalid. Please check and update these values.";

const TestCaseRoutes = () => {
  const [measureBundle, setMeasureBundle] = useState<Bundle>();
  const [valueSets, setValueSets] = useState<ValueSet[]>();
  const [errors, setErrors] = useState<Array<string>>([]);
  const [warnings, setWarnings] = useState<Array<string>>([]);
  const [customWarningMessages, setCustomWarningMessages] = useState<
    CustomWarningMessage[]
  >([]);
  const [shiftTestCaseDatesWarnings, setShiftTestCaseDatesWarnings] = useState<
    Array<string>
  >([]);
  const [
    updateQiCoreJsonWithGroupAndTitleWarning,
    setUpdateQiCoreJsonWithGroupAndTitleWarning,
  ] = useState<Array<string>>([]);
  const [importWarnings, setImportWarnings] = useState<TestCaseImportOutcome[]>(
    []
  );
  const [executionContextReady, setExecutionContextReady] = useState<boolean>();
  const [executing, setExecuting] = useState<boolean>();
  const [contextFailure, setContextFailure] = useState<boolean>(false);
  const [lastMeasure, setLastMeasure] = useState<any>();

  const terminologyService = useRef(useTerminologyServiceApi());
  const measureService = useRef(useMeasureServiceApi());
  const featureFlags = useFeatureFlags();

  const [measure, setMeasure] = useState<Measure>();
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const localErrors: Array<string> = [];
    if (measure) {
      const compareTo = _.cloneDeep(measure);
      compareTo.testCases = null;
      if (measureBundle && lastMeasure && _.isEqual(lastMeasure, compareTo)) {
        return;
      }
      setLastMeasure(compareTo);
      const isCompositeMeasure = measure?.measureMetaData?.composite;
      if (!isCompositeMeasure) {
        if (measure.cqlErrors || !measure.elmJson) {
          localErrors.push(CQL_ERROR);
        }
        if (!measure?.groups?.length) {
          localErrors.push(NO_PC_ERROR);
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
        if (localErrors.length > 0) {
          localErrors.push(TEST_CASE_EXECUTION_ERROR);
        }
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
      setErrors([...errors, ...localErrors]);
      if (
        measure?.testCaseConfiguration?.executeInvalidTestCases ||
        !localErrors.length
      ) {
        measureService.current
          .fetchMeasureBundle(measure)
          .then((bundle: Bundle) => {
            setMeasureBundle(bundle);
          })
          .catch((err) => {
            setContextFailure(true);
            setErrors((prevState) => [...prevState, err.message]);
          });
      }
    }
  }, [measure?.id]);

  useEffect(() => {
    if (measureBundle && measure) {
      setErrors(() => []);
      setContextFailure(false);

      terminologyService.current
        .getValueSetsExpansionForBundle(
          measureBundle,
          measure.testCaseConfiguration?.manifestExpansion
        )
        .then((vs: ValueSet[]) => {
          setValueSets(vs);
        })
        .catch((err) => {
          setContextFailure(true);
          setErrors((prevState) => [...prevState, err.message]);
        });
    }
  }, [measureBundle, measure]);

  useEffect(() => {
    setExecutionContextReady(!!measureBundle && !!valueSets && !!measure);
  }, [measureBundle, measure, valueSets]);

  return (
    <ExecutionContextProvider
      value={{
        measureState: [measure, setMeasure],
        bundleState: [measureBundle, setMeasureBundle],
        valueSetsState: [valueSets, setValueSets],
        executionContextReady,
        executing,
        setExecuting,
        contextFailure,
      }}
    >
      <StatusHandler
        error={errors?.length > 0}
        errorMessages={errors}
        warning={
          warnings?.length > 0 ||
          customWarningMessages?.length > 0 ||
          shiftTestCaseDatesWarnings?.length > 0 ||
          updateQiCoreJsonWithGroupAndTitleWarning?.length > 0
        }
        warningMessages={warnings}
        customWarningMessages={customWarningMessages}
        shiftTestCaseDatesWarning={shiftTestCaseDatesWarnings}
        updateQiCoreJsonWithGroupAndTitleWarning={
          updateQiCoreJsonWithGroupAndTitleWarning
        }
        importWarnings={importWarnings}
        testDataId="test-case-alerts"
      />
      <Routes>
        <Route path="/list-page">
          <Route
            index
            element={
              <TestCaseLandingWrapper
                qdm={false}
                children={
                  <TestCaseLanding
                    errors={errors}
                    warnings={warnings}
                    setErrors={setErrors}
                    setImportWarnings={setImportWarnings}
                    setWarnings={setWarnings}
                    setShiftTestCaseDatesWarnings={
                      setShiftTestCaseDatesWarnings
                    }
                    setUpdateQiCoreJsonWithGroupAndTitleWarning={
                      setUpdateQiCoreJsonWithGroupAndTitleWarning
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
                qdm={false}
                children={
                  <TestCaseLanding
                    errors={errors}
                    warnings={warnings}
                    setErrors={setErrors}
                    setImportWarnings={setImportWarnings}
                    setWarnings={setWarnings}
                    setShiftTestCaseDatesWarnings={
                      setShiftTestCaseDatesWarnings
                    }
                    setUpdateQiCoreJsonWithGroupAndTitleWarning={
                      setUpdateQiCoreJsonWithGroupAndTitleWarning
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
                qdm={false}
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
                qdm={false}
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
            element={
              <TestCaseLandingWrapper qdm={false} children={<Expansion />} />
            }
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
                qdm={false}
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
        <Route
          path=":id"
          index
          element={
            <EditTestCase
              errors={errors}
              setErrors={setErrors}
              setCustomWarningMessages={setCustomWarningMessages}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ExecutionContextProvider>
  );
};

export default TestCaseRoutes;
