import React, { useEffect, useRef, useState } from "react";
import {
  useDocumentTitle,
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
  useFeatureFlags,
} from "@madie/madie-util";
import {
  TestCase,
  MeasureErrorType,
  TestCaseLockInfo,
} from "@madie/madie-models";
import "../qiCore/EditTestCase.scss";
import {
  Button,
  Toast,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import qdmCalculationService from "../../../api/QdmCalculationService";
import { Allotment } from "allotment";
import RightPanel from "./RightPanel/RightPanel";
import LeftPanel from "./LeftPanel/LeftPanel";
import EditTestCaseBreadCrumbs from "../EditTestCaseBreadCrumbs";
import { useNavigate, useParams } from "react-router-dom";
import useTestCaseServiceApi from "../../../api/useTestCaseServiceApi";
import { useFormik, FormikProvider } from "formik";
import useFormikResetOnEvent from "../../../../../common/useFormikResetOnEvent";
import { QDMPatientSchemaValidator } from "./QDMPatientSchemaValidator";

import "allotment/dist/style.css";
import "./EditTestCase.scss";
import { MadieError, sanitizeUserInput } from "../../../util/Utils";
import * as _ from "lodash";
import "styled-components/macro";
import {
  triggerPopChanges,
  mapExistingTestCasePopulations,
} from "../../../util/PopulationsMap";
import { QDMPatient, DataElement } from "cqm-models";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useQdmExecutionContext } from "../../routes/qdm/QdmExecutionContext";
import StatusHandler from "../../statusHandler/StatusHandler";
import {
  buildHighlightingForGroups,
  GroupCoverageResult,
} from "../../../util/cqlCoverageBuilder/CqlCoverageBuilder";
import checkSpecialCharacters from "../../../util/checkSpecialCharacters";
import { GroupPopulation } from "@madie/madie-models/dist/TestCase";
import LockedMessageModal from "../../../../../common/lockedMessageModal/LockedMessageModal";

const EditTestCase = () => {
  useDocumentTitle("MADiE Edit Measure Edit Test Case");
  const featureFlags = useFeatureFlags();
  /* For formik, we could simplify our patterns in some places

  Establish a single source of truth and preserve it in state
  Initialize a formik object that references the properties that we would change on that object. Initialize with formik.enableReinitialize = true;
  Only modify the formik.values, and not the source of truth.
  Do not use any useEffects to update any form state
  Update the source of truth only on successful requests */
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const { updateMeasure } = measureStore;
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls
  );

  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };
  const showToast = (
    message: string,
    toastType: "success" | "danger" | "warning"
  ) => {
    setToastOpen(true);
    setToastType(toastType);
    setToastMessage(message);
  };

  const qdmCalculation = useRef(qdmCalculationService());
  const testCaseService = useRef(useTestCaseServiceApi());

  const { cqmMeasureState, executionContextReady, executing, setExecuting } =
    useQdmExecutionContext();

  const [cqmMeasure] = cqmMeasureState;

  const navigate = useNavigate();
  const { measureId, id } = useParams();
  const [isTestCaseExecuted, setIsTestCaseExecuted] = useState<boolean>(false);

  // our truth, currentTestCase is what we have in DB
  const [currentTestCase, setCurrentTestCase] = useState<TestCase>(null);
  const [qdmPatient, setQdmPatient] = useState<QDMPatient>(); // our truth reference for birthDay only
  // This should be the parsed tc.json initialized class
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [qdmExecutionErrors, setQdmExecutionErrors] = useState<Array<string>>(
    []
  );
  const [selectedDataElement, setSelectedDataElement] = useState<DataElement>();
  const [groupCoverageResult, setGroupCoverageResult] =
    useState<GroupCoverageResult>();
  const [testCaseResults, setTestCaseResults] = useState<GroupPopulation[]>();
  dayjs.extend(utc);
  dayjs.utc().format(); // utc format

  const formik = useFormik({
    initialValues: {
      title: currentTestCase?.title || "",
      description: currentTestCase?.description || "",
      series: currentTestCase?.series || "",
      json: currentTestCase?.json || "",
      groupPopulations: currentTestCase?.groupPopulations || [],
    },
    enableReinitialize: true,
    validationSchema: QDMPatientSchemaValidator,
    onSubmit: async (values: any) => await handleSubmit(values),
  });
  useFormikResetOnEvent(formik);
  const { resetForm } = formik;

  // Fetches test case based on ID, identifies measure.group converts it to testcase.groupPopulation
  // if the measure.group is not in TC then a new testcase.groupPopulation is added to nextTc
  // and set it to form
  useEffect(() => {
    if (measure && measureId && id) {
      testCaseService.current
        .getTestCase(id, measureId, false)
        .then((tc: TestCase) => {
          const nextTc = _.cloneDeep(tc);
          setLockedModalOpen(
            canEdit && featureFlags.Locking && nextTc.testCaseLock
              ? true
              : false
          );
          if (measure?.groups) {
            nextTc.groupPopulations = measure.groups?.map((group) => {
              const existingTestCasePC = tc.groupPopulations?.find(
                (gp) => gp.groupId === group.id
              );
              return _.isNil(existingTestCasePC)
                ? qdmCalculation.current.mapMeasureGroup(measure, group)
                : mapExistingTestCasePopulations(existingTestCasePC, group);
            });
          } else {
            nextTc.groupPopulations = [];
          }
          let patient: QDMPatient = new QDMPatient();
          if (nextTc?.json) {
            patient = new QDMPatient(JSON.parse(tc?.json));
          }
          nextTc.json = JSON.stringify(patient);
          setQdmPatient(patient);
          setCurrentTestCase(nextTc);
        })
        .catch((error) => {
          if (error.toString().includes("404")) {
            navigate("/404");
          }
        });
      const handleUnload = () => {
        testCaseService.current.unlockTestCase(id);
      };
      if (featureFlags?.Locking && canEdit) {
        window.addEventListener("beforeunload", handleUnload);
        testCaseService.current
          .lockTestCase(measureId, id)
          .then(() => {})
          .catch((e) => {
            console.error("Error locking TestCase:", e);
          });
      }
      return () => {
        if (featureFlags?.Locking && canEdit) {
          window.removeEventListener("beforeunload", handleUnload);
          testCaseService.current.unlockTestCase(id);
        }
      };
    }
  }, [
    measureId,
    id,
    measure?.groups,
    navigate,
    featureFlags?.Locking,
    canEdit,
  ]);

  const testCaseCanEdit =
    canEdit && !(featureFlags?.Locking && currentTestCase?.testCaseLock);
  const testCaseLockedBy: string =
    featureFlags?.Locking && currentTestCase?.testCaseLock
      ? currentTestCase?.testCaseLock?.lockedBy
      : undefined;
  const [lockedModalOpen, setLockedModalOpen] = useState(
    canEdit && testCaseLockedBy ? true : false
  );

  const handleSubmit = async (testCase: TestCase) => {
    testCase.title = sanitizeUserInput(testCase.title);
    testCase.description = sanitizeUserInput(testCase.description);
    testCase.series = sanitizeUserInput(testCase.series);
    if (formik.values?.json) {
      testCase.json = formik.values?.json;
      const patient: QDMPatient = JSON.parse(formik.values.json);
      if (patient) {
        setQdmPatient(patient);
      }
    }

    await updateTestCase(testCase);
  };

  const updateTestCase = async (testCase: TestCase) => {
    const modifiedTestCase = { ...currentTestCase, ...testCase };
    const errorMsg = checkSpecialCharacters(modifiedTestCase);
    if (errorMsg) {
      showToast(errorMsg, "danger");
      return;
    }
    try {
      const updatedTestCase = await testCaseService.current.updateTestCase(
        modifiedTestCase,
        measureId
      );
      setCurrentTestCase(_.cloneDeep(updatedTestCase));
      updateMeasureStore(updatedTestCase);
      showToast("Test Case Updated Successfully", "success");
    } catch (error) {
      if (featureFlags.Locking && error.message.includes("is locked by:")) {
        const splitted = error.message.trim().split(" ");
        const lockedBy = splitted[splitted.length - 1];
        setCurrentTestCase({
          ...currentTestCase,
          testCaseLock: { lockedBy: lockedBy } as unknown as TestCaseLockInfo,
        });
        setLockedModalOpen(true);
        resetForm();
        showToast(`${error.message}`, "danger");
        return;
      }
      if (error instanceof MadieError) {
        showToast(
          `Error updating Test Case "${measure.measureName}": ${error.message}`,
          "danger"
        );
        return;
      }
      showToast(`Error updating Test Case "${measure.measureName}"`, "danger");
    }
  };

  function updateMeasureStore(testCase: TestCase) {
    const measureCopy = Object.assign({}, measure);
    // find and remove stale test case from measure
    measureCopy.testCases = measureCopy.testCases?.filter(
      (tc) => tc.id !== testCase.id
    );
    // add updated test to measure
    if (measureCopy.testCases) {
      measureCopy.testCases.push(testCase);
    } else {
      measureCopy.testCases = [testCase];
    }
    // update measure store
    updateMeasure(measureCopy);
  }

  const calculateQdmTestCases = async () => {
    setExecuting(true);
    try {
      const patient = JSON.parse(formik.values?.json);
      const patients: any[] = [patient];
      const calculationOutput =
        await qdmCalculation.current.calculateQdmTestCases(
          cqmMeasure,
          patients
        );

      const patientResults = calculationOutput[patient._id];
      const testCaseWithResults = qdmCalculation.current.processTestCaseResults(
        { ...formik.values },
        measure.groups,
        measure,
        patientResults
      );
      setTestCaseResults(testCaseWithResults.groupPopulations);
      const coverageResults = buildHighlightingForGroups(
        patientResults,
        cqmMeasure
      );
      setGroupCoverageResult(coverageResults);
      setIsTestCaseExecuted(true);
    } catch (error) {
      setQdmExecutionErrors((prevState) => [...prevState, `${error.message}`]);
      showToast("Error while calculating QDM test cases", "danger");
      console.error("Error while calculating QDM test cases:", error);
    } finally {
      setExecuting(false);
    }
  };

  const { updateRouteHandlerState } = routeHandlerStore;
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty, currentTestCase?.json]);

  const discardChanges = () => {
    resetForm();
    setSelectedDataElement(null);
    setDiscardDialogOpen(false);
  };

  const [testCaseErrors, setTestCaseErrors] = useState(null);
  const [testCaseWarnings, setTestCaseWarnings] = useState(null);
  const [missingDataElements, setMissingDataElements] = useState(null);

  const handleTestCaseErrors = (value) => {
    setTestCaseErrors(value);
  };

  const handleTestCaseWarnings = (value) => {
    setTestCaseWarnings(value);
  };

  const handleMissingDataElements = (value) => {
    setMissingDataElements(value);
  };

  return (
    <>
      {qdmExecutionErrors && qdmExecutionErrors.length > 0 && (
        <StatusHandler
          error={true}
          errorMessages={qdmExecutionErrors}
          testDataId="test_case_execution_errors"
        />
      )}
      {!_.isNull(testCaseErrors) && (
        <StatusHandler
          error={true}
          errorMessages={[testCaseErrors]}
          testDataId="test_case_execution_errors"
        />
      )}
      {!_.isNull(testCaseWarnings) && (
        <StatusHandler
          warning={true}
          warningMessages={[testCaseWarnings]}
          testDataId="test_case_execution_warnings"
        />
      )}
      {!_.isNull(missingDataElements) && (
        <StatusHandler
          warning={true}
          missingDataElements={missingDataElements}
          testDataId="test_case_missing_data_elements"
        />
      )}
      <FormikProvider value={formik}>
        <EditTestCaseBreadCrumbs
          testCase={currentTestCase}
          measureId={measureId}
          lockingEnabled={featureFlags?.Locking}
          canEdit={canEdit}
        />

        <form
          id="edit-test-case-form"
          data-testid={"edit-test-case-form"}
          onSubmit={formik.handleSubmit}
        >
          <div className="allotment-wrapper">
            <Allotment defaultSizes={[175, 125]} vertical={false}>
              <Allotment.Pane>
                <LeftPanel
                  canEdit={testCaseCanEdit}
                  handleTestCaseErrors={handleTestCaseErrors}
                  handleTestCaseWarnings={handleTestCaseWarnings}
                  handleMissingDataElements={handleMissingDataElements}
                  selectedDataElement={selectedDataElement}
                  setSelectedDataElement={setSelectedDataElement}
                />
              </Allotment.Pane>
              <Allotment.Pane>
                <RightPanel
                  canEdit={testCaseCanEdit}
                  testCaseGroups={formik?.values?.groupPopulations}
                  isTestCaseExecuted={isTestCaseExecuted}
                  setIsTestCaseExecuted={setIsTestCaseExecuted}
                  errors={formik.errors.groupPopulations}
                  groupCoverageResult={groupCoverageResult}
                  testCaseResults={testCaseResults}
                  calculationErrors={qdmExecutionErrors}
                  onChange={(
                    groupPopulations,
                    changedGroupId,
                    changedPopulation
                  ) => {
                    const updatedPops = triggerPopChanges(
                      groupPopulations,
                      changedGroupId,
                      changedPopulation,
                      measure?.groups
                    );
                    const nextGc = _.cloneDeep(updatedPops);
                    // only update the formState. Not the source of truth.
                    formik.setFieldValue("groupPopulations", nextGc);
                  }}
                  measureGroups={measure?.groups}
                  measureName={measure?.measureName}
                  measureCql={measure?.cql}
                  cqlErrors={measure?.cqlErrors}
                  includeSDE={measure?.testCaseConfiguration?.sdeIncluded}
                  includeRAV={measure?.testCaseConfiguration?.ravIncluded}
                  supplementalData={measure?.supplementalData}
                  riskAdjustments={measure?.riskAdjustments}
                />
              </Allotment.Pane>
            </Allotment>
          </div>
          <div className="bottom-row">
            {/* shows up in some mockups. leaving for later */}
            {/* <Button variant="outline-filled">Import</Button> */}
            <div className="spacer" />
            <Button
              variant="primary"
              data-testid="qdm-test-case-run-button"
              onClick={calculateQdmTestCases}
              disabled={
                !!measure?.cqlErrors ||
                _.isEmpty(measure?.groups) ||
                measure?.errors?.includes(
                  MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
                ) ||
                measure?.errors?.includes(
                  MeasureErrorType.MISMATCH_CQL_RISK_ADJUSTMENT
                ) ||
                measure?.errors?.includes(
                  MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA
                ) ||
                !formik.values?.json ||
                !executionContextReady ||
                executing
              }
            >
              Run Test
            </Button>
            <Button
              variant="cyan"
              type="submit"
              data-testid="edit-test-case-save-button"
              disabled={!(formik.dirty && formik.isValid) || !testCaseCanEdit}
            >
              Save
            </Button>
            <Button
              variant="outline-filled"
              disabled={!formik.dirty || !testCaseCanEdit}
              onClick={() => setDiscardDialogOpen(true)}
            >
              Discard Changes
            </Button>
          </div>
          {/* outside flow of page */}
          <Toast
            toastKey="edit-action-toast"
            aria-live="polite"
            toastType={toastType}
            testId={toastType === "danger" ? "error-toast" : "success-toast"}
            closeButtonProps={{
              "data-testid": "close-toast-button",
            }}
            open={toastOpen}
            message={toastMessage}
            onClose={onToastClose}
            autoHideDuration={10000}
          />
        </form>
      </FormikProvider>
      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onContinue={discardChanges}
      />
      {canEdit && testCaseLockedBy && (
        <LockedMessageModal
          lockedType={"test case"}
          lockedBy={testCaseLockedBy}
          lockedModalOpen={lockedModalOpen}
          setLockedModalOpen={setLockedModalOpen}
        />
      )}
    </>
  );
};

export default EditTestCase;
