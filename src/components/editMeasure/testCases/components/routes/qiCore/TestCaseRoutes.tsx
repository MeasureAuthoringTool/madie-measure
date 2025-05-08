import React, { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import TestCaseLanding from "../../testCaseLanding/qiCore/TestCaseLanding";
import EditTestCase from "../../editTestCase/qiCore/EditTestCase";
import NotFound from "../../notfound/NotFound";
import { measureStore, useFeatureFlags } from "@madie/madie-util";
import { Bundle, ValueSet } from "fhir/r4";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import { ExecutionContextProvider } from "./ExecutionContext";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import * as _ from "lodash";
import StatusHandler from "../../statusHandler/StatusHandler";
import TestCaseLandingWrapper from "../../testCaseLanding/common/TestCaseLandingWrapper";
import {
  Measure,
  MeasureErrorType,
  Model,
  TestCaseImportOutcome,
} from "@madie/madie-models";
import TestCaseData from "../../testCaseConfiguration/testCaseData/TestCaseData";
import SDEPage from "../../testCaseConfiguration/sde/SDEPage";
import Expansion from "../../testCaseConfiguration/expansion/Expansion";

export const CQL_RETURN_TYPES_MISMATCH_ERROR =
  "One or more Population Criteria has a mismatch with CQL return types. Test Cases cannot be executed until this is resolved.";

const stu6TestCaseValidationDisabledMessage = (
  <span>
    Validations for QI-Core STU6 are Disabled. No validations will be displayed.
    Validation of your Test Case JSON can be performed using an alternative
    tool, such as the{" "}
    <a
      href={"https://validator.fhir.org/"}
      target="_blank"
      rel="noopener noreferrer"
    >
      HL7 FHIR Validator
    </a>
    with the US-Core and QI-Core IGs selected.
  </span>
);

const TestCaseRoutes = () => {
  const [measureBundle, setMeasureBundle] = useState<Bundle>();
  const [valueSets, setValueSets] = useState<ValueSet[]>();
  const [errors, setErrors] = useState<Array<string>>([]);
  const [warnings, setWarnings] = useState<Array<any>>([]);
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
    const localErrors: Array<string> = [...errors];
    if (measure) {
      if (
        measure.model === Model.QICORE_6_0_0 &&
        !featureFlags?.stu6TestCaseValidation
      ) {
        setWarnings((warnings) => [
          ...warnings,
          stu6TestCaseValidationDisabledMessage,
        ]);
      }

      const compareTo = _.cloneDeep(measure);
      compareTo.testCases = null;
      if (measureBundle && lastMeasure && _.isEqual(lastMeasure, compareTo)) {
        return;
      }
      setLastMeasure(compareTo);
      setErrors(() => []);
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

      if (
        measure?.errors?.includes(
          MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
        )
      ) {
        localErrors.push(CQL_RETURN_TYPES_MISMATCH_ERROR);
        setErrors(localErrors);
      } else {
        setErrors(
          localErrors.filter((s) => s !== CQL_RETURN_TYPES_MISMATCH_ERROR)
        );
      }

      if (!localErrors.length) {
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
      {/* Status handler for Test Cases tab*/}
      {errors && errors.length > 0 && (
        <StatusHandler
          error={true}
          errorMessages={errors}
          testDataId="execution_context_loading_errors"
        />
      )}
      {warnings?.length > 0 && (
        <>
          <StatusHandler
            warning={true}
            warningMessages={warnings}
            testDataId="execution_context_loading_warning"
          />
        </>
      )}
      {importWarnings && importWarnings.length > 0 && (
        <StatusHandler importWarnings={importWarnings} />
      )}
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
                  />
                }
              />
            }
          />
          {featureFlags?.QICoreIncludeSDEValues && (
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
          )}

          {featureFlags?.QICoreManifestExpansion && (
            <Route
              path="/list-page/expansion"
              element={
                <TestCaseLandingWrapper qdm={false} children={<Expansion />} />
              }
            />
          )}

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
          element={<EditTestCase errors={errors} setErrors={setErrors} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ExecutionContextProvider>
  );
};

export default TestCaseRoutes;
