import React, { useCallback, useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import _ from "lodash";
import {
  Group,
  GroupedStratificationDto,
  MeasureErrorType,
  PopulationDto,
  TestCase,
  TestCaseExcelExportDto,
  OverlappingCodeDto,
} from "@madie/madie-models";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import calculationService from "../../../api/CalculationService";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import CreateCodeCoverageNavTabs from "./CreateCodeCoverageNavTabs";
import CreateNewTestCaseDialog from "../../createTestCase/CreateNewTestCaseDialog";
import {
  MadieSpinner,
  Pagination,
  Toast,
} from "@madie/madie-design-system/dist/react";
import Typography from "@mui/material/Typography";
import {
  TestCaseListProps,
  TestCasesPassingDetailsProps,
} from "../common/interfaces";
import TestCaseTable from "../common/TestCaseTable/TestCaseTable";
import UseTestCases from "../common/Hooks/UseTestCases";
import UseToast from "../common/Hooks/UseToast";
import { useQdmExecutionContext } from "../../routes/qdm/QdmExecutionContext";
import qdmCalculationService, {
  CqmExecutionResultsByPatient,
} from "../../../api/QdmCalculationService";
import TestCaseCoverage from "./TestCaseCoverage/TestCaseCoverage";
import { QDMPatient } from "cqm-models";
import { cloneTestCase } from "../../../util/QdmTestCaseHelper";
import {
  buildHighlightingForAllGroups,
  GroupCoverageResult,
} from "../../../util/cqlCoverageBuilder/CqlCoverageBuilder";
import { checkSpecialCharactersForExport } from "../../../util/checkSpecialCharacters";
import {
  createExcelExportDtosForAllTestCases,
  populatePopulationDtos,
  populateStratificationDtos,
} from "../../../util/TestCaseExcelExportUtil";
import { CqlDefinitionCallstack } from "../../editTestCase/groupCoverage/QiCoreGroupCoverage";
import useExcelExportService from "../../../api/useExcelExportService";
import FileSaver from "file-saver";
import { AxiosError, AxiosResponse } from "axios";
import ExportModal from "./ExportModal";
import {
  QrdaTestCaseDTO,
  QrdaGroupExportDTO,
} from "../../../api/useTestCaseServiceApi";
import useQdmCqlParsingService from "../../../api/cqlElmTranslationService/useQdmCqlParsingService";
import ActionCenter from "../common/ActionCenter/ActionCenter";
import CopyTestCaseDialog from "../common/copyTestCases/CopyTestCaseDialog";
import { generateQdmReport } from "../../../util/OverlappingCodesUtils";
import OverlappingCodesDialog from "../common/overLappingCodes/OverlappingCodesDialog";

export const IMPORT_ERROR =
  "An error occurred while importing your test cases. Please try again, or reach out to the Help Desk.";
export const EXCEL_SUCCESS_MESSAGE = "Excel exported successfully.";
export const EXCEL_ERROR_MESSAGE =
  "Error exporting Excel. Please try again. If the issue continues, please contact helpdesk.";
export const DEFINITION_CALLSTACK_ERROR =
  "Error while Parsing CQL for callStack. Please try again. If the issue continues, please contact helpdesk.";
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
  groupId: string
): number => {
  const coverageValue = parseInt(
    coverageHtml?.[groupId]?.match(coverageHeaderRegex)[1]
  );
  return isNaN(coverageValue) ? 0 : coverageValue;
};

export const getTotalAndCoveredClauses = (
  uniqRelevantClausesCount,
  allRelevantClausesCount
) => {
  return {
    covered: uniqRelevantClausesCount,
    total: allRelevantClausesCount,
  };
};

const TestCaseList = (props: TestCaseListProps) => {
  let navigate = useNavigate();
  const { search } = useLocation();
  const values = queryString.parse(search);
  const {
    setErrors,
    setImportErrors,
    setWarnings,
    setImportWarnings,
    setCustomWarningMessages,
    setShiftTestCaseDatesWarnings,
  } = props;
  const { measureId, criteriaId } = useParams<{
    measureId: string;
    criteriaId: string;
  }>();
  const {
    testCases,
    setTestCases,
    sortedTestCases,
    insertTestCases,
    removeTestCases,
    testCaseService,
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
  // UseTestCases handles all the pagination and navigation independent of where we're at
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
  const excelExportService = useRef(useExcelExportService());
  const calculation = useRef(calculationService());
  const qdmCalculation = useRef(qdmCalculationService());
  const { updateMeasure } = measureStore;

  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("passing");
  const [calculationOutput, setCalculationOutput] =
    useState<CqmExecutionResultsByPatient>();
  const [executeAllTestCases, setExecuteAllTestCases] =
    useState<boolean>(false);
  const [coveragePercentage, setCoveragePercentage] = useState<string>("-");
  const [testCasePassFailStats, setTestCasePassFailStats] =
    useState<TestCasesPassingDetailsProps>({
      passPercentage: undefined,
      passFailRatio: "",
    });
  const { measureState, cqmMeasureState, executing, setExecuting } =
    useQdmExecutionContext();
  const [measure] = measureState;
  const [cqmMeasure] = cqmMeasureState;
  const [selectedPopCriteria, setSelectedPopCriteria] = useState<Group>();
  const [importDialogState, setImportDialogState] = useState<any>({
    open: false,
  });
  const [selectedTestCases, setSelectedTestCases] = useState<any>();
  const [exportExecuting, setExportExecuting] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const qdmCqlParsingService = useRef(useQdmCqlParsingService());
  const [exportOptionsOpen, setExportOptionsOpen] = useState<boolean>(false);
  const [openCopyTestCaseDialog, setOpenCopyTestCaseDialog] =
    useState<boolean>(false);

  const [overlappingCodes, setOverlappingCodes] = useState<
    OverlappingCodeDto[]
  >([]);
  const [openOverlappingCodesDialog, setOpenOverlappingCodesDialog] =
    useState<boolean>(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [clauseResults, setClauseResults] = useState<{
    total: number;
    covered: number;
  } | null>(null);
  // const [callstackMap, setCallstackMap] = useState<CqlDefinitionCallstack>();
  // callStackMap is used for generating Excel Export
  useEffect(() => {}, [measure?.cql]);
  useEffect(() => {
    if (testCases?.length != measure?.testCases?.length) {
      const newMeasure = { ...measure, testCases };
      updateMeasure(newMeasure);
    }
  }, [testCases]);

  const [groupCoverageResult, setGroupCoverageResult] = useState([]);
  useState<GroupCoverageResult>();
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
    useState<boolean>(false);
  const [shiftDatesDialogModalOpen, setShiftDatesDialogModalOpen] =
    useState<boolean>(false);
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
    if (!criteriaId && measure?.groups) {
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
    if (!_.isNil(measureId) && testCaseService) {
      retrieveTestCases();
    }
  }, [measureId, testCaseService]);
  useEffect(() => {
    const validTestCases = measure?.testCaseConfiguration
      ?.executeInvalidTestCases
      ? sortedTestCases
      : sortedTestCases?.filter((tc) => tc.validResource);
    if (validTestCases && calculationOutput && selectedPopCriteria) {
      const executionResults: CqmExecutionResultsByPatient = calculationOutput;
      // calculation output only contains valid testcases already.
      const highlightingForAllGroups = buildHighlightingForAllGroups(
        calculationOutput,
        cqmMeasure
      );
      setGroupCoverageResult(highlightingForAllGroups);
      validTestCases.forEach((testCase) => {
        const patient: QDMPatient = JSON.parse(testCase.json);
        const patientResults = executionResults[patient._id];
        const testCaseWithResults =
          qdmCalculation.current.processTestCaseResults(
            testCase,
            [selectedPopCriteria],
            measure,
            patientResults
          );
        testCase.groupPopulations = testCaseWithResults.groupPopulations;
        testCase.executionStatus = testCaseWithResults.executionStatus;
      });
      setExecuteAllTestCases(true);
      const { passPercentage, passFailRatio } =
        calculation.current.getPassingPercentageForTestCases(sortedTestCases);
      setTestCasePassFailStats({
        passPercentage: passPercentage,
        passFailRatio: passFailRatio,
      });
      setTestCases([...testCases]);
    }
    setCoveragePercentage(clauseCoverageProcessor());
  }, [calculationOutput, selectedPopCriteria]);

  const clauseCoverageProcessor = (measureGroup?: Group): string => {
    //generates populations' coverage %
    if (!calculationOutput) {
      return;
    }
    const group = measureGroup ?? selectedPopCriteria;
    if (!group) {
      return;
    }
    let allClauses = [];
    let relevantStatements;
    const patientIDs = Object.keys(calculationOutput);
    patientIDs.forEach((patientID) => {
      let newClauseResults = [];
      const clauseResults =
        calculationOutput[patientID][group.id]?.clause_results;
      if (clauseResults) {
        newClauseResults = Object.values(
          calculationOutput[patientID][group.id]?.clause_results
        )?.flatMap(Object.values);
      }
      // we only need one copy of relevantStatements from the first group to match against
      if (!relevantStatements) {
        const statementResults =
          calculationOutput[patientID][group.id]?.statement_results;
        if (statementResults) {
          relevantStatements = Object.values(
            calculationOutput[patientID][group.id]?.statement_results
          )?.flatMap(Object.values);
        }
      }
      allClauses = [...allClauses, ...newClauseResults];
    });
    // get a list of used statements
    relevantStatements = relevantStatements.filter((s) => s.relevance !== "NA");
    const allRelevantClauses = allClauses
      .filter((c) =>
        relevantStatements.some(
          (s) =>
            s.statementName === c.statementName &&
            s.libraryName === c.libraryName
        )
      )
      .filter((result) => result.final !== "NA");
    // get a list of all unique used clauses
    const allUniqueClauses = _.uniqWith(
      allRelevantClauses,
      (c1, c2) => c1.libraryName === c2.libraryName && c1.localId === c2.localId
    ).sort((a, b) => a.localId - b.localId);
    // get a list of all unique covered clauses
    const coveredClauses = _.uniqWith(
      allRelevantClauses.filter((clause) => clause.final === "TRUE"),
      (c1, c2) => c1.libraryName === c2.libraryName && c1.localId === c2.localId
    );
    setClauseResults(
      getTotalAndCoveredClauses(coveredClauses.length, allUniqueClauses.length)
    );
    // set onto window for any environment debug purposes
    if (localStorage.getItem("madieDebug") || (window as any).madieDebug) {
      // eslint-disable-next-line no-console
      console.log("coveredClauses: ", _.cloneDeep(coveredClauses));
      // eslint-disable-next-line no-console
      console.log("allUniqueClauses: ", _.cloneDeep(allUniqueClauses));
      // eslint-disable-next-line no-console
      console.log(
        "uncoveredClauses: ",
        _.cloneDeep(
          _.pullAllBy(_.cloneDeep(allUniqueClauses), coveredClauses, "localId")
        )
      );
    }
    return Math.floor(
      (coveredClauses.length / allUniqueClauses.length) * 100
    ).toString();
  };
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
          setToastOpen(true);
          setToastType("danger");
          setToastMessage(
            `Unable to Delete test Case(s) with ID(s) ${testCaseIds.join(
              ", "
            )}. Please try again. If the issue continues, please contact helpdesk.`
          );
        }
      });
  };

  const handleCloneTestCase = async (testCase: TestCase) => {
    try {
      const clonedTestCase = cloneTestCase(testCase);
      const result = await testCaseService.current.createTestCase(
        clonedTestCase,
        measureId
      );
      setToastOpen(true);
      setToastType("success");
      setToastMessage("Test case cloned successfully");
      insertTestCases([result]);
    } catch (error) {
      setToastOpen(true);
      setToastMessage(
        `An error occurred while cloning the test case: ${error.message}`
      );
    }
  };

  const handleClose = () => {
    setCreateOpen(false);
  };

  const executeTestCases = useCallback(async () => {
    if (measure && measure.cqlErrors) {
      console.error(
        "executeTestCases: Cannot execute test cases while errors exist in the measure CQL! "
      );
      setToastOpen(true);
      setToastType("danger");
      setToastMessage(
        "Cannot execute test cases while errors exist in the measure CQL!"
      );
      return null;
    }

    const testCasesToExecute = measure?.testCaseConfiguration
      ?.executeInvalidTestCases
      ? sortedTestCases
      : sortedTestCases?.filter((tc) => tc.validResource);
    if (testCasesToExecute && testCasesToExecute.length > 0 && cqmMeasure) {
      setExecuting(true);
      try {
        // calculation service needs to be changed: currently it is using QI Core calculation service
        const patients = testCasesToExecute.map((tc) => JSON.parse(tc.json));
        const calculationOutput: CqmExecutionResultsByPatient =
          await qdmCalculation.current.calculateQdmTestCases(
            cqmMeasure,
            patients
          );
        setCalculationOutput(calculationOutput);
      } catch (error) {
        console.error("calculateTestCases: error.message = ", error);
        setToastOpen(true);
        setToastType("danger");
        const syntaxErrorMessage =
          "Some test cases could not be executed due to syntax errors in their definitions. Please review and correct the syntax issues, then try running the tests again.";
        if (
          error instanceof SyntaxError ||
          (error?.name && error.name.includes("SyntaxError"))
        ) {
          setToastMessage(syntaxErrorMessage);
        }
        setToastMessage("Error while executing test cases");
      }
      setExecuting(false);
    } else if (_.isNil(testCasesToExecute) || _.isEmpty(testCasesToExecute)) {
      console.error("calculateTestCases: No valid test cases to execute");
      setToastOpen(true);
      setToastType("danger");
      setToastMessage("No valid test cases to execute");
    }
  }, [
    measure,
    sortedTestCases,
    cqmMeasure,
    qdmCalculation,
    setExecuting,
    setCalculationOutput,
    setToastOpen,
    setToastType,
    setToastMessage,
  ]);

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
  const executionResultLength = calculationOutput
    ? Object.keys(calculationOutput).length
    : 0;

  const exportExcel = async () => {
    let callstack: CqlDefinitionCallstack;

    setExportExecuting(true);
    setOptionsOpen(false);
    setExportOptionsOpen(false);

    try {
      callstack = await qdmCqlParsingService.current.getDefinitionCallstacks(
        measure.cql
      );
    } catch (error) {
      console.error(
        "Error while Parsing CQL for callStack: err.message = " + error.message
      );
      setToastOpen(true);
      setToastType("danger");
      setToastMessage(DEFINITION_CALLSTACK_ERROR);
      setExportExecuting(false);
      // stop further execution if callstack fails
      return;
    }

    try {
      const testCaseExcelExportDtos: TestCaseExcelExportDto[] =
        createExcelExportDtosForAllTestCases(
          measure,
          cqmMeasure,
          calculationOutput,
          callstack
        );

      const excelBlob: Blob = await testCaseService.current.exportExcel(
        measureId,
        testCaseExcelExportDtos
      );

      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${measure.ecqmTitle}-v${measure.version}-QDM-TestCases.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      setToastOpen(true);
      setToastType("success");
      setToastMessage(EXCEL_SUCCESS_MESSAGE);
      document.body.removeChild(link);
    } catch (error) {
      setToastOpen(true);
      setToastType("danger");
      setToastMessage(EXCEL_ERROR_MESSAGE);
    } finally {
      setExportExecuting(false);
    }
  };

  const exportQRDA = async () => {
    const failedTCs = checkSpecialCharactersForExport(testCases);
    if (failedTCs.length) {
      setErrors((prevState) => [...prevState, ...failedTCs]);
      return;
    }
    setExportExecuting(true);
    setOptionsOpen(false);
    setExportOptionsOpen(false);
    const localMeasure = _.cloneDeep(measure);
    const executionResults: CqmExecutionResultsByPatient = calculationOutput;
    const groupExportDTOs: QrdaGroupExportDTO[] = [];
    let groupNumber = 1;
    try {
      // process calculation results for every population criteria
      localMeasure.groups?.forEach((group) => {
        const testCaseDTOs: QrdaTestCaseDTO[] = [];
        localMeasure.testCases.forEach((testCase) => {
          const patient: QDMPatient = JSON.parse(testCase.json);
          const patientResults = executionResults[patient._id];
          const testCaseWithResults =
            qdmCalculation.current.processTestCaseResults(
              testCase,
              [group],
              localMeasure,
              patientResults
            );
          testCase.groupPopulations = testCaseWithResults.groupPopulations;
          testCase.executionStatus = testCaseWithResults.executionStatus;

          const groupPopulation = testCase.groupPopulations?.find(
            (groupPopulation) => {
              return groupPopulation.groupId === group.id;
            }
          );

          let stratNumber = 1;
          const populationDtos: PopulationDto[] =
            populatePopulationDtos(groupPopulation);
          const groupedStratDtos: GroupedStratificationDto[] =
            populateStratificationDtos(
              groupPopulation,
              groupNumber,
              stratNumber,
              testCase.id
            );
          testCaseDTOs.push({
            testCaseId: testCase.id,
            lastName: testCase.series,
            firstName: testCase.title,
            populations: populationDtos,
            stratifications: groupedStratDtos,
          });
        });
        groupExportDTOs.push({
          groupId: group.id,
          groupNumber: groupNumber.toString(),
          coverage: clauseCoverageProcessor(
            localMeasure.groups.find((g) => g.id === group.id)
          ),
          testCaseDTOs,
        });
        groupNumber++;
      });
      const exportData = await testCaseService.current.exportQRDA(measureId, {
        measure: localMeasure,
        groupDTOs: groupExportDTOs,
      });
      FileSaver.saveAs(
        exportData,
        `${localMeasure.ecqmTitle}-v${localMeasure.version}-QDM-TestCases.zip`
      );
      setToastOpen(true);
      setToastType("success");
      setToastMessage("QRDA exported successfully");
    } catch (err) {
      setToastOpen(true);
      setToastType("danger");
      setToastMessage(
        "Unable to Export QRDA. Please try again. If the issue continues, please contact helpdesk."
      );
    }
    setExportExecuting(false);
  };

  const handleGenerateOverlappingCodesReport = () => {
    setOverlappingCodes(generateQdmReport(cqmMeasure.value_sets));
    setOpenOverlappingCodesDialog(true);
    setShowReportOptions(false);
  };

  const onCopyTestCaseClose = (msg?: string, toastType?: string) => {
    setOpenCopyTestCaseDialog(false);
    if (toastType) {
      setToastType(toastType);
      setToastMessage(msg);
      setToastOpen(true);
    }
  };

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
                testCasePassFailStats={testCasePassFailStats}
                coveragePercentage={coveragePercentage}
                validTestCases={testCases?.filter((tc) => tc.validResource)}
                selectedPopCriteria={selectedPopCriteria}
                onExportQRDA={exportQRDA}
                onExportExcel={exportExcel}
                exportExecuting={exportExecuting}
                optionsOpen={optionsOpen}
                setOptionsOpen={setOptionsOpen}
                showReportOptions={showReportOptions}
                setShowReportOptions={setShowReportOptions}
                clauseResults={clauseResults}
              />
            </div>
            <CreateNewTestCaseDialog
              open={createOpen}
              onClose={handleClose}
              measure={measure}
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
                        isQDM={true}
                        onCloneTestCase={handleCloneTestCase}
                        onExportExcel={exportExcel}
                        setDeleteDialogModalOpen={setDeleteDialogModalOpen}
                        setShiftDatesDialogModalOpen={
                          setShiftDatesDialogModalOpen
                        }
                        onExportQRDA={exportQRDA}
                        measureId={measureId}
                        exportOptionsOpen={exportOptionsOpen}
                        setExportOptionsOpen={setExportOptionsOpen}
                        displayTestCaseCopyDialog={() =>
                          setOpenCopyTestCaseDialog(true)
                        }
                        executeAllTestCases={executeAllTestCases}
                        isDraft={measure?.measureMetaData?.draft}
                      />
                      <TestCaseTable
                        sorting={sorting}
                        setSorting={setSorting}
                        testCases={currentSlice}
                        canEdit={canEdit}
                        deleteTestCase={deleteTestCases}
                        exportTestCase={null}
                        onCloneTestCase={handleCloneTestCase}
                        measure={measure}
                        setSelectedTestCases={setSelectedTestCases}
                        deleteDialogModalOpen={deleteDialogModalOpen}
                        selectedTestCases={selectedTestCases}
                        setDeleteDialogModalOpen={setDeleteDialogModalOpen}
                        shiftDatesDialogModalOpen={shiftDatesDialogModalOpen}
                        setShiftDatesDialogModalOpen={
                          setShiftDatesDialogModalOpen
                        }
                        setShiftTestCaseDatesWarnings={
                          setShiftTestCaseDatesWarnings
                        }
                        setWarnings={setWarnings}
                        page={page}
                      />
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
            {activeTab === "coverage" && (
              <div tw="overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div tw="py-2 inline-block min-w-full sm:px-6 lg:px-8">
                  <TestCaseCoverage
                    measureGroups={measure.groups}
                    testCases={testCases}
                    measureCql={measure.cql}
                    groupCoverageResult={groupCoverageResult}
                    data-testid="test-case-coverage"
                    populationCriteria={selectedPopCriteria}
                    calculationOutput={calculationOutput}
                  />
                </div>
              </div>
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
          <MadieSpinner
            style={{ height: 50, width: 50 }}
            data-testid="testcase-list-loading-spinner"
          />
          <Typography color="inherit">{loadingState.message}</Typography>
        </div>
      )}
      <CopyTestCaseDialog
        selectedTestCases={selectedTestCases}
        open={openCopyTestCaseDialog}
        onClose={onCopyTestCaseClose}
        measure={measure}
      />

      <OverlappingCodesDialog
        openDialog={openOverlappingCodesDialog}
        setOpenDialog={setOpenOverlappingCodesDialog}
        handleClose={() => setOpenOverlappingCodesDialog(false)}
        overlappingCodes={overlappingCodes}
        measure={measure}
      />

      {exportExecuting && <ExportModal openModal={true}></ExportModal>}
    </div>
  );
};

export default TestCaseList;
