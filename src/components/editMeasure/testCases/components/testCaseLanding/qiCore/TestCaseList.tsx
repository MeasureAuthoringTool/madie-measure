import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import * as _ from "lodash";
import {
  Group,
  TestCase,
  MeasureErrorType,
  TestCaseImportRequest,
  TestCaseImportOutcome,
  OverlappingCodeDto,
  ValidationStatus,
} from "@madie/madie-models";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import calculationService from "../../../api/CalculationService";
import {
  CalculationOutput,
  DetailedPopulationGroupResult,
} from "fqm-execution/build/types/Calculator";
import { ObjectId } from "bson";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import useExecutionContext from "../../routes/qiCore/useExecutionContext";
import CreateCodeCoverageNavTabs from "./CreateCodeCoverageNavTabs";
import CodeCoverageHighlighting from "../common/CodeCoverageHighlighting";
import CreateNewTestCaseDialog from "../../createTestCase/CreateNewTestCaseDialog";
import {
  MadieDeleteDialog,
  MadieSpinner,
  Pagination,
  Toast,
} from "@madie/madie-design-system/dist/react";
import Typography from "@mui/material/Typography";
import {
  TestCasesPassingDetailsProps,
  TestCaseListProps,
} from "../common/interfaces";
import TestCaseTable from "../common/TestCaseTable/TestCaseTable";
import UseTestCases from "../common/Hooks/UseTestCases";
import UseToast from "../common/Hooks/UseToast";
import FileSaver from "file-saver";
import TestCaseImportDialog from "../common/import/TestCaseImportDialog";
import ActionCenter from "../common/ActionCenter/ActionCenter";
import CopyTestCaseDialog from "../common/copyTestCases/CopyTestCaseDialog";
import MakeJsonMatchUiDialog from "../../common/MakeJsonMatchUiDialog/MakeJsonMatchUiDialog";
import { generateQiCoreReport } from "../../../util/OverlappingCodesUtils";
import OverlappingCodesDialog from "../common/overLappingCodes/OverlappingCodesDialog";
import getModelFamily from "../../../../../../utils/measureModelHelpers";

export const IMPORT_ERROR =
  "An error occurred while importing your test cases. Please try again, or reach out to the Help Desk.";

export const coverageHeaderRegex =
  /<h2> .* Clause Coverage: (\d*\.\d+|\d*|NaN)%<\/h2>/i;

export const removeHtmlCoverageHeader = (
  coverageHtml: Record<string, string>
): Record<string, string> => {
  const groupCoverage: Record<string, string> = {};
  for (const groupId in coverageHtml) {
    groupCoverage[groupId] = coverageHtml[groupId]?.replace(
      coverageHeaderRegex,
      ""
    );
  }
  return groupCoverage;
};

export const getCoverageValueFromHtml = (
  coverageHtml: Record<string, string>,
  groupId: string,
  displayId: string
): number => {
  let coverageHtmlByGroup = coverageHtml[groupId];
  if (!coverageHtmlByGroup) {
    coverageHtmlByGroup = coverageHtml[displayId];
  }
  const coverageValue = parseInt(
    coverageHtmlByGroup?.match(coverageHeaderRegex)[1]
  );
  return isNaN(coverageValue) ? 0 : coverageValue;
};

const TestCaseList = (props: TestCaseListProps) => {
  const {
    setErrors,
    setWarnings,
    setImportWarnings,
    setShiftTestCaseDatesWarnings,
    setUpdateQiCoreJsonWithGroupAndTitleWarning,
    setCustomWarningMessages,
  } = props;
  const { measureId, criteriaId } = useParams<{
    measureId: string;
    criteriaId: string;
  }>();
  const {
    testCases,
    setTestCases,
    sortedTestCases,
    testCaseService,
    insertTestCases,
    removeTestCases,
    loadingState,
    setLoadingState,
    retrieveTestCases,
    testCasePage,
    sorting,
    setSorting,
  } = UseTestCases({
    measureId,
    setErrors,
  });

  const {
    totalItems,
    visibleItems,
    offset,
    limit,
    count,
    page,
    currentSlice,
    handlePageChange,
    handleLimitChange,
    canGoNext,
    canGoPrev,
  } = testCasePage;

  const {
    toastOpen,
    setToastOpen,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,
    onToastClose,
  } = UseToast();
  let navigate = useNavigate();
  const { search } = useLocation();
  const values = queryString.parse(search);
  const [executionResults, setExecutionResults] = useState<{
    [key: string]: DetailedPopulationGroupResult[];
  }>({});

  const [openCopyTestCaseDialog, setOpenCopyTestCaseDialog] =
    useState<boolean>(false);
  const calculation = useRef(calculationService());
  const { updateMeasure } = measureStore;
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("passing");
  const [calculationOutput, setCalculationOutput] =
    useState<CalculationOutput<any>>();
  const [executeAllTestCases, setExecuteAllTestCases] =
    useState<boolean>(false);
  const [coverageHTML, setCoverageHTML] = useState<Record<string, string>>();
  const [coveragePercentage, setCoveragePercentage] = useState<number>(0);
  const [testCasePassFailStats, setTestCasePassFailStats] =
    useState<TestCasesPassingDetailsProps>({
      passPercentage: undefined,
      passFailRatio: "",
    });
  const [selectedTestCases, setSelectedTestCases] = useState<Array<TestCase>>();
  const { measureState, bundleState, valueSetsState, executing, setExecuting } =
    useExecutionContext();
  const [measure] = measureState;
  const [measureBundle] = bundleState;
  const [valueSets] = valueSetsState;
  const [selectedPopCriteria, setSelectedPopCriteria] = useState<Group>();

  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const abortController = useRef(null);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
    useState<boolean>(false);
  const [shiftDatesDialogModalOpen, setShiftDatesDialogModalOpen] =
    useState<boolean>(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState<boolean>(false);
  const [makeJsonMatchUiDialogOpen, setMakeJsonMatchUiDialogOpen] =
    useState<boolean>(false);

  const [overlappingCodes, setOverlappingCodes] = useState<
    OverlappingCodeDto[]
  >([]);
  const [openOverlappingCodesDialog, setOpenOverlappingCodesDialog] =
    useState<boolean>(false);
  const [showReportOptions, setShowReportOptions] = useState(false);

  useEffect(() => {
    if (testCases?.length != measure?.testCases?.length) {
      const newMeasure = { ...measure, testCases };
      updateMeasure(newMeasure);
    }
  }, [testCases]);

  useEffect(() => {
    setExecuteAllTestCases(false);
    if (
      !_.isNil(measure?.groups) &&
      measure.groups.length > 0 &&
      (_.isNil(selectedPopCriteria) ||
        _.isNil(measure.groups?.find((g) => g.id === selectedPopCriteria.id)))
    ) {
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
    }
  }, [measure]);

  useEffect(() => {
    if (criteriaId && measure?.groups?.length) {
      const selectedPopCriteria = measure.groups?.find(
        (g) => g.id === criteriaId
      );
      setSelectedPopCriteria(selectedPopCriteria);
    }
    if (!criteriaId && !_.isEmpty(measure?.groups)) {
      setSelectedPopCriteria(measure.groups[0]);
      const newPath = `/measures/${measureId}/edit/test-cases/list-page/${
        !_.isEmpty(measure?.groups) && measure?.groups[0].id
      }`;
      // we want to replace the current path to allow the back button to work as intended.
      navigate(newPath, { replace: true });
    }
  }, [criteriaId, measure?.groups]);

  useEffect(() => {
    setCanEdit(
      checkUserCanEdit(measure?.measureSet?.owner, measure?.measureSet?.acls)
    );
  }, [measure]);

  useEffect(() => {
    const validTestCases = measure?.testCaseConfiguration
      ?.executeInvalidTestCases
      ? sortedTestCases
      : sortedTestCases?.filter((tc) => tc.validResource);
    if (validTestCases && calculationOutput?.results && selectedPopCriteria) {
      // Pull Clause Coverage from coverage HTML
      setCoveragePercentage(
        getCoverageValueFromHtml(
          calculationOutput["groupClauseCoverageHTML"],
          selectedPopCriteria.id,
          selectedPopCriteria.displayId
        )
      );
      setCoverageHTML(
        removeHtmlCoverageHeader(calculationOutput["groupClauseCoverageHTML"])
      );
      const executionResults = calculationOutput.results;
      const nextExecutionResults = {};
      validTestCases.forEach((testCase, i) => {
        const detailedResults = executionResults.find(
          (result) => result.patientId === testCase.id
        )?.detailedResults;
        nextExecutionResults[testCase.id] = detailedResults;

        const processedTC = calculationService().processTestCaseResults(
          testCase,
          [selectedPopCriteria],
          detailedResults as DetailedPopulationGroupResult[]
        );
        testCase.groupPopulations = processedTC.groupPopulations;
        testCase.executionStatus = processedTC.executionStatus;
      });
      setExecuteAllTestCases(true);
      const { passPercentage, passFailRatio } =
        calculation.current.getPassingPercentageForTestCases(sortedTestCases);
      setTestCasePassFailStats({
        passPercentage: passPercentage,
        passFailRatio: passFailRatio,
      });
      setTestCases([...testCases]);
      setExecutionResults(nextExecutionResults);
    }
  }, [calculationOutput, selectedPopCriteria]);

  const createNewTestCase = () => {
    setCreateOpen(true);
    setExecuteAllTestCases(false);
  };

  const deleteTestCases = () => {
    const testCaseIds = selectedTestCases?.map((testCase) => testCase.id);
    testCaseService.current
      .deleteTestCases(measureId, testCaseIds)
      .then(() => {
        setToastOpen(true);
        setToastType("success");
        setToastMessage("Test cases successfully deleted");
        removeTestCases(testCaseIds);
      })
      .catch((err) => {
        console.error("deleteTestCases: err.message = " + err.message);
        if (err?.response?.status == 423) {
          if (
            testCaseIds.length ===
            err?.response?.data?.message?.split(",").length
          ) {
            setToastMessage(
              "All the selected test cases are in-use by another user and could not be deleted."
            );
            setToastOpen(true);
            setToastType("warning");
          } else {
            retrieveTestCases();
            setCustomWarningMessages([
              {
                message:
                  "Some of the selected test cases were deleted successfully, but the following test cases are in-use by another user and could not be deleted:",
                details: err?.response?.data?.message?.split(","),
                testDataId: "test-cases-in-use-warning",
              },
            ]);
          }
        } else {
          setErrors((prevState) => [...prevState, err.message]);
        }
      });
  };

  const exportTestCase = async (
    selectedTestCase: TestCase,
    bundleType: string
  ) => {
    try {
      abortController.current = new AbortController();
      const { ecqmTitle, model, version } = measure ?? {};
      const exportData = await testCaseService?.current.exportTestCases(
        measure?.id,
        bundleType,
        [selectedTestCase.id],
        abortController.current.signal
      );
      FileSaver.saveAs(
        exportData.data,
        `${ecqmTitle}-v${version}-${getModelFamily(model)}-TestCases.zip`
      );
      setToastOpen(true);
      setToastType("success");
      setToastMessage("Test case exported successfully");
    } catch (err) {
      if (err?.response?.status == 404) {
        setToastOpen(true);
        setToastType("danger");
        setToastMessage(
          "Test Case(s) are empty or contain errors. Please update your Test Case(s) and export again."
        );
      } else {
        setToastOpen(true);
        setToastType("danger");
        setToastMessage(
          `Unable to export test cases for ${measure?.measureName}. Please try again and contact the Help Desk if the problem persists.`
        );
      }
    }
  };

  const exportTestCases = async (bundleType: string) => {
    setExportOptionsOpen(false);
    try {
      abortController.current = new AbortController();
      const { ecqmTitle, model, version } = measure ?? {};
      let testCaseIds: string[] = [];
      if (_.size(selectedTestCases) > 0) {
        testCaseIds = selectedTestCases?.map((testCase) => testCase.id);
      } else {
        testCaseIds = measure?.testCases?.map((testCase) => testCase.id);
      }
      const exportData = await testCaseService?.current.exportTestCases(
        measure?.id,
        bundleType,
        testCaseIds,
        abortController.current.signal
      );
      FileSaver.saveAs(
        exportData.data,
        `${ecqmTitle}-v${version}-${getModelFamily(model)}-TestCases.zip`
      );
      if (exportData.status == 206) {
        setToastOpen(true);
        setToastType("warning");
        setToastMessage(
          "Test Case Export has successfully been generated. Some Test Cases were invalid and could not be exported."
        );
      } else {
        setToastOpen(true);
        setToastType("success");
        setToastMessage("Test cases exported successfully");
      }
    } catch (err) {
      if (err?.response?.status == 404) {
        setToastOpen(true);
        setToastType("danger");
        setToastMessage(
          "Test Case(s) are empty or contain errors. Please update your Test Case(s) and export again."
        );
      } else {
        setToastOpen(true);
        setToastType("danger");
        setToastMessage(
          `Unable to export test cases for ${measure?.measureName}. Please try again and contact the Help Desk if the problem persists.`
        );
      }
    }
  };

  const handleGenerateOverlappingCodesReport = () => {
    setOverlappingCodes(generateQiCoreReport(valueSets, measureBundle));
    setOpenOverlappingCodesDialog(true);
    setShowReportOptions(false);
  };

  const handleClose = () => {
    setCreateOpen(false);
  };

  const executeTestCases = async () => {
    if (measure && measure.cqlErrors) {
      console.error(
        "executeTestCases: Cannot execute test cases while errors exist in the measure CQL! "
      );
      setErrors((prevState) => [
        ...prevState,
        "Cannot execute test cases while errors exist in the measure CQL!",
      ]);
      return null;
    }

    const testCasesToExecute = measure?.testCaseConfiguration
      ?.executeInvalidTestCases
      ? sortedTestCases
      : sortedTestCases?.filter((tc) => tc.validResource);

    if (testCasesToExecute && testCasesToExecute.length > 0 && measureBundle) {
      setExecuting(true);
      try {
        const calculationOutput: CalculationOutput<any> =
          await calculation.current.calculateTestCases(
            measure,
            testCasesToExecute,
            measureBundle,
            valueSets
          );
        setCalculationOutput(calculationOutput);
      } catch (error) {
        console.error("calculateTestCases: error.message = " + error?.message);

        const syntaxErrorMessages = [
          "Unexpected end of JSON input",
          "Cannot read properties of null (reading 'entry')",
          "not valid JSON",
        ];
        const syntaxErrorMessage =
          "Some test cases could not be executed due to syntax errors in their definitions. Please review and correct the syntax issues, then try running the tests again.";

        if (
          error instanceof SyntaxError ||
          (error?.name && error.name.includes("SyntaxError")) ||
          syntaxErrorMessages.includes(error?.message)
        ) {
          setErrors((prevState) => [...prevState, syntaxErrorMessage]);
        } else {
          setErrors((prevState) => [...prevState, error?.message]);
        }
      }
      setExecuting(false);
    } else if (_.isNil(testCasesToExecute) || _.isEmpty(testCasesToExecute)) {
      console.error("calculateTestCases: No valid test cases to execute");
      setErrors((prevState) => [
        ...prevState,
        "calculateTestCases: No valid test cases to execute",
      ]);
    }
  };
  // Test case 2 "test case name" has a status of "status".
  const generateSRString = (testCaseList) => {
    let string = "";
    if (testCases) {
      testCaseList.forEach((testCase, i) => {
        string += `test case ${i + 1} ${testCase.title} has a status of ${
          testCase.executionStatus
        }. `;
      });
    }
    return string;
  };
  const readerString = generateSRString(testCases);
  const executionResultLength = Object.keys(executionResults).length;

  const onTestCaseImport = async (
    testCaseImportRequest: TestCaseImportRequest[]
  ) => {
    setImportWarnings(null);
    setOpenImportDialog(false);
    setLoadingState(() => ({
      loading: true,
      message: "Importing Test Cases...",
    }));
    try {
      const response = await testCaseService.current.importTestCases(
        measureId,
        testCaseImportRequest
      );
      const importResponse = response.data;
      const testCaseImportOutcome: TestCaseImportOutcome[] =
        importResponse.outcomes;
      const failedImports = testCaseImportOutcome.filter((outcome) => {
        if (outcome.message) return outcome;
      });
      if (failedImports && failedImports.length > 0) {
        setImportWarnings(testCaseImportOutcome);
      } else {
        const successfulImports =
          testCaseImportOutcome.length - failedImports.length;
        setToastOpen(true);
        setToastType("success");
        setToastMessage(
          `(${successfulImports}) Test cases imported successfully`
        );
      }
    } catch (error) {
      setErrors((prevState) => [...prevState, IMPORT_ERROR]);
    } finally {
      setLoadingState({ loading: false, message: "" });
      const newPath = `/measures/${measureId}/edit/test-cases/list-page/${
        !_.isEmpty(measure?.groups) && measure?.groups[0].id
      }?filter=${values.filter ? values.filter : ""}&search=${
        values.search ? values.search : ""
      }&page=1&limit=${values.limit ? values.limit : 10}`;
      navigate(newPath);
      retrieveTestCases();
    }
  };

  const handleQiCloneTestCase = async (testCase: TestCase) => {
    const clonedTestCase = _.cloneDeep(testCase);
    clonedTestCase.title =
      clonedTestCase.title + "-" + new ObjectId().toString();
    try {
      const testCase = await testCaseService.current.createTestCase(
        clonedTestCase,
        measureId
      );
      setToastOpen(true);
      setToastType("success");
      setToastMessage("Test case cloned successfully");
      insertTestCases([testCase]);
    } catch (error) {
      setToastOpen(true);
      setToastMessage(
        `An error occurred while cloning the test case: ${error.message}`
      );
    }
  };

  const onCopyTestCaseClose = (
    msg?: string,
    toastType?: string,
    failedTestCaseIds?: any
  ) => {
    setOpenCopyTestCaseDialog(false);
    if (toastType) {
      setToastType(toastType);
      setToastMessage(msg);
      setToastOpen(true);
    } else {
      setCustomWarningMessages([
        {
          message: msg,
          details: failedTestCaseIds,
          testDataId: "test-cases-copy-to-warning",
        },
      ]);
    }
  };

  const totalTestCases = testCases?.length;
  const validTestCasesCount = _.filter(testCases, {
    validationStatus: ValidationStatus.VALID,
  })?.length;
  const validationPercentage =
    totalTestCases > 0
      ? Math.floor((validTestCasesCount / totalTestCases) * 100)
      : 0;
  const validationPercentageFraction =
    totalTestCases > 0 ? `${validTestCasesCount}/${totalTestCases}` : `0`;

  return (
    <div>
      {!loadingState.loading && (
        <>
          <Toast
            toastKey="test-case-list-toast"
            toastType={toastType}
            testId={
              toastType === "danger"
                ? `test-case-list-error`
                : `test-case-list-success`
            }
            open={toastOpen}
            message={toastMessage}
            onClose={onToastClose}
            autoHideDuration={6000}
            closeButtonProps={{
              "data-testid": "close-error-button",
            }}
          />
          <div tw="lg:col-span-5 pl-2 pr-2">
            <div data-testid="code-coverage-tabs">
              <CreateCodeCoverageNavTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                executeAllTestCases={executeAllTestCases}
                canEdit={canEdit}
                measure={measure}
                createNewTestCase={createNewTestCase}
                executeTestCases={executeTestCases}
                onGenerateOverlappingCodesReport={
                  handleGenerateOverlappingCodesReport
                }
                onImportTestCases={() => {
                  setErrors((prevState) => [
                    ...prevState?.filter((e) => e !== IMPORT_ERROR),
                  ]);
                  setOpenImportDialog(true);
                }}
                testCasePassFailStats={testCasePassFailStats}
                coveragePercentage={coveragePercentage}
                validTestCases={testCases?.filter((tc) => tc.validResource)}
                exportTestCases={exportTestCases}
                showReportOptions={showReportOptions}
                setShowReportOptions={setShowReportOptions}
                validationPercentage={validationPercentage}
                validationPercentageFraction={validationPercentageFraction}
              />
            </div>
            <CreateNewTestCaseDialog
              open={createOpen}
              onClose={handleClose}
              onSuccess={insertTestCases}
            />
            {activeTab === "passing" && (
              <div tw="overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div tw="py-2 inline-block min-w-full sm:px-6 lg:px-8">
                  {!executing && (
                    <>
                      {executionResultLength > 0 && (
                        <div
                          role="alert"
                          style={{
                            position: "absolute",
                            zIndex: "-1",
                            overflow: "hidden",
                          }}
                          data-testid="sr-div"
                        >
                          <span
                            style={{
                              fontSize: "1%",
                            }}
                          >
                            {readerString}
                          </span>
                        </div>
                      )}
                      <ActionCenter
                        selectedTestCases={selectedTestCases}
                        canEdit={canEdit}
                        isQDM={false}
                        setDeleteDialogModalOpen={setDeleteDialogModalOpen}
                        setShiftDatesDialogModalOpen={
                          setShiftDatesDialogModalOpen
                        }
                        setMakeJsonMatchUiDialogOpen={
                          setMakeJsonMatchUiDialogOpen
                        }
                        onCloneTestCase={handleQiCloneTestCase}
                        exportTestCases={exportTestCases}
                        exportOptionsOpen={exportOptionsOpen}
                        setExportOptionsOpen={setExportOptionsOpen}
                        displayTestCaseCopyDialog={() =>
                          setOpenCopyTestCaseDialog(true)
                        }
                        isDraft={measure?.measureMetaData?.draft}
                      />
                      <TestCaseTable
                        sorting={sorting}
                        setSorting={setSorting}
                        // test cases doesn't know how to sort by category
                        testCases={currentSlice}
                        canEdit={canEdit}
                        deleteTestCase={deleteTestCases}
                        exportTestCase={exportTestCase}
                        measure={measure}
                        handleQiCloneTestCase={handleQiCloneTestCase}
                        setSelectedTestCases={setSelectedTestCases}
                        selectedTestCases={selectedTestCases}
                        deleteDialogModalOpen={deleteDialogModalOpen}
                        setDeleteDialogModalOpen={setDeleteDialogModalOpen}
                        shiftDatesDialogModalOpen={shiftDatesDialogModalOpen}
                        setShiftDatesDialogModalOpen={
                          setShiftDatesDialogModalOpen
                        }
                        setWarnings={setWarnings}
                        page={page}
                        setShiftTestCaseDatesWarnings={
                          setShiftTestCaseDatesWarnings
                        }
                      />
                      {currentSlice?.length > 0 && (
                        <Pagination
                          totalItems={totalItems}
                          visibleItems={visibleItems}
                          limitOptions={[10, 25, 50, "All"]}
                          offset={offset}
                          handlePageChange={handlePageChange}
                          handleLimitChange={handleLimitChange}
                          page={page}
                          limit={limit}
                          count={count}
                          shape="rounded"
                          hideNextButton={!canGoNext}
                          hidePrevButton={!canGoPrev}
                        />
                      )}
                    </>
                  )}
                  {executing && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <MadieSpinner style={{ height: 50, width: 50 }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "coverage" && coverageHTML && (
              <CodeCoverageHighlighting
                coverageHTML={
                  coverageHTML[selectedPopCriteria.displayId]
                    ? coverageHTML[selectedPopCriteria.displayId]
                    : coverageHTML[selectedPopCriteria.id]
                }
              />
            )}
          </div>
        </>
      )}
      {loadingState.loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          <Typography color="inherit">{loadingState.message}</Typography>
        </div>
      )}
      <CopyTestCaseDialog
        selectedTestCases={selectedTestCases}
        open={openCopyTestCaseDialog}
        onClose={onCopyTestCaseClose}
        measure={measure}
      />
      {openImportDialog && (
        <TestCaseImportDialog
          dialogOpen={openImportDialog}
          onImport={onTestCaseImport}
          handleClose={() => setOpenImportDialog(false)}
        />
      )}

      <OverlappingCodesDialog
        openDialog={openOverlappingCodesDialog}
        setOpenDialog={setOpenOverlappingCodesDialog}
        handleClose={() => setOpenOverlappingCodesDialog(false)}
        overlappingCodes={overlappingCodes}
        measure={measure}
      />

      <MakeJsonMatchUiDialog
        open={makeJsonMatchUiDialogOpen}
        onClose={() => setMakeJsonMatchUiDialogOpen(false)}
        selectedTestCases={selectedTestCases}
        measureId={measure?.id}
        selectedTestCaseCount={selectedTestCases?.length || 0}
        setUpdateQiCoreJsonWithGroupAndTitleWarning={
          setUpdateQiCoreJsonWithGroupAndTitleWarning
        }
        setShiftTestCaseDatesWarnings={setShiftTestCaseDatesWarnings}
        setWarnings={setWarnings}
        setToastMessage={setToastMessage}
        setToastType={setToastType}
        setToastOpen={setToastOpen}
      />
    </div>
  );
};

export default TestCaseList;
