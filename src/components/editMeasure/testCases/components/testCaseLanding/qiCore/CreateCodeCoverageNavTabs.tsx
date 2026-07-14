import React, { useState } from "react";
import {
  Button,
  Popover,
  Tab,
  Tabs,
} from "@madie/madie-design-system/dist/react";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import * as _ from "lodash";
import {
  Measure,
  MeasureErrorType,
  Model,
  TestCase,
} from "@madie/madie-models";
import useExecutionContext from "../../routes/qiCore/useExecutionContext";
import { TestCasesPassingDetailsProps } from "../common/interfaces";
import { useFeatureFlags } from "@madie/madie-util";
import "twin.macro";
import "styled-components/macro";
import LoadingButton from "../common/loadingButton/LoadingButton";
import LoadingButtonWithMenu from "../common/loadingButton/LoadingButtonWithMenu";
import { Tooltip } from "@mui/material";
import CompositeMeasureNavTabs from "./CompositeMeasureNavTabs";

export interface NavTabProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  executeAllTestCases: boolean;
  canEdit: boolean;
  measure: Measure;
  createNewTestCase: (value: string) => void;
  executeTestCases: () => void;
  executeCompositeTestCases: () => void;
  onImportTestCases?: () => void;
  testCasePassFailStats: TestCasesPassingDetailsProps;
  coveragePercentage: number;
  validTestCases: TestCase[];
  exportTestCases: (bundleType: string) => void;
  validationPercentage?: number;
  onGenerateOverlappingCodesReport: () => void;
  showReportOptions: boolean;
  setShowReportOptions: (show: boolean) => void;
  validationPercentageFraction: string;
  clauseResults?: { total: number; covered: number } | null;
}

const defaultStyle = {
  padding: "0px 10px",
  height: "80px",
  textTransform: "none",
  marginRight: "36px",
  "&:focus": {
    outline: "9px auto -webkit-focus-ring-color",
    outlineOffset: "-1px",
  },
  overflow: "visible",
};

export default function CreateCodeCoverageNavTabs(props: NavTabProps) {
  const { executionContextReady, contextFailure } = useExecutionContext();
  const {
    activeTab,
    setActiveTab,
    executeAllTestCases,
    canEdit,
    createNewTestCase,
    measure,
    executeTestCases,
    executeCompositeTestCases,
    onImportTestCases,
    testCasePassFailStats,
    coveragePercentage,
    validTestCases,
    exportTestCases,
    validationPercentage,
    onGenerateOverlappingCodesReport,
    validationPercentageFraction,
    clauseResults,
  } = props;
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const featureFlags = useFeatureFlags();
  const executionResultsDisplayTemplate = (label) => {
    const codeCoverage = executeAllTestCases ? coveragePercentage : "-";
    const displayPercentage =
      label !== "Coverage"
        ? testCasePassFailStats.passPercentage
        : codeCoverage;
    return (
      <div>
        <div style={{ fontSize: "29px", fontWeight: "600" }}>
          {executeAllTestCases ? displayPercentage + "%" : "-"}{" "}
        </div>
        <div style={{ fontSize: "19px" }}>
          {label}{" "}
          {executeAllTestCases &&
            label !== "Coverage" &&
            `(${testCasePassFailStats.passFailRatio})`}
        </div>
      </div>
    );
  };

  const getValidationResultsDisplay = (label: string) => {
    return (
      <div>
        <div
          style={{ fontSize: "29px", fontWeight: "600" }}
          aria-label={`Validation percentage: ${
            validationPercentage ? validationPercentage + "%" : "not available"
          }`}
        >
          {validationPercentage ? validationPercentage + "%" : "-"}
        </div>
        <div
          style={{ fontSize: "19px" }}
          aria-label={`Validation Percentage Fraction: ${validationPercentageFraction}`}
        >
          {label}({validationPercentageFraction})
        </div>
      </div>
    );
  };

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOptionsOpen(true);
  };
  const handleClose = () => {
    setOptionsOpen(false);
    setAnchorEl(null);
  };

  const isCompositeMeasure = measure?.measureMetaData?.composite;
  const hasErrors =
    (!isCompositeMeasure &&
      (measure?.cqlErrors ||
        _.isNil(measure?.groups) ||
        measure?.groups.length === 0)) ||
    measure?.errors?.includes(
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
    ) ||
    measure?.errors?.includes(MeasureErrorType.MISMATCH_CQL_RISK_ADJUSTMENT) ||
    measure?.errors?.includes(
      MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA
    ) ||
    (measure?.testCaseConfiguration?.executeInvalidTestCases
      ? false
      : _.isEmpty(validTestCases)) ||
    contextFailure;

  return (
    <div tw="flex justify-between items-center" style={{ overflow: "visible" }}>
      {isCompositeMeasure ? (
        <CompositeMeasureNavTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getValidationResultsDisplay={getValidationResultsDisplay}
        />
      ) : (
        <Tabs
          value={activeTab}
          onChange={(e, v) => {
            if (v === "validation") {
              e.preventDefault();
              return;
            }
            setActiveTab(v);
          }}
          type="B"
          orientation="horizontal"
        >
          <Tab
            type="B"
            tabIndex={0}
            aria-label="Passing tab panel"
            sx={defaultStyle}
            label={executionResultsDisplayTemplate("Passing")}
            data-testid="passing-tab"
            value="passing"
          />

          <Tab
            type="B"
            tabIndex={0}
            aria-label="Coverage tab panel"
            sx={defaultStyle}
            label={
              <Tooltip
                data-testid={`action-center-tooltip-`}
                //@ts-ignore
                title={
                  open
                    ? `${clauseResults?.covered}/${clauseResults?.total} logical clauses in your CQL are covered`
                    : "More"
                }
                placement="top"
                arrow
                disableHoverListener={!clauseResults}
              >
                {executionResultsDisplayTemplate("Coverage")}
              </Tooltip>
            }
            data-testid="coverage-tab"
            value="coverage"
          />
          {_.isEqual(measure?.model, Model.QICORE_6_0_0) && (
            <Tab
              type="B"
              tabIndex={0}
              aria-label="Validation tab panel"
              sx={defaultStyle}
              label={getValidationResultsDisplay("Valid")}
              data-testid="validation-tab"
              value="validation"
            />
          )}
        </Tabs>
      )}
      <div
        tw="flex flex-wrap space-x-4 justify-end"
        style={{ overflow: "visible" }}
      >
        <LoadingButtonWithMenu
          hasErrors={hasErrors}
          isExecutionContextReady={executionContextReady}
          dataTestId="reports-button"
          label="Reports"
          menuItems={[
            {
              label: "Overlapping Codes",
              dataTestId: "overlapping-codes",
              toImplementFunction: onGenerateOverlappingCodesReport,
            },
          ]}
          showOptions={props.showReportOptions}
          setShowOptions={props.setShowReportOptions}
        />
        {canEdit && (
          <>
            <Button
              variant="outline"
              onClick={onImportTestCases}
              disabled={!canEdit}
              data-testid="import-test-cases-button"
            >
              <FileUploadIcon
                style={{ margin: "0 5px 0 -2px" }}
                fontSize="small"
              />
              Import
            </Button>

            <Button
              disabled={!canEdit}
              onClick={createNewTestCase}
              data-testid="create-new-test-case-button"
            >
              <AddIcon style={{ margin: "0 5px 0 -2px" }} fontSize="small" />
              New Case
            </Button>
          </>
        )}

        <LoadingButton
          hasErrors={hasErrors}
          isExecutionContextReady={executionContextReady}
          onClick={
            isCompositeMeasure ? executeCompositeTestCases : executeTestCases
          }
          dataTestId="execute-test-cases-button"
          primary={true}
          label="Run Test(s)"
        />
        <Popover
          optionsOpen={optionsOpen}
          anchorEl={anchorEl}
          handleClose={handleClose}
          canEdit={canEdit}
          additionalSelectOptionProps={[
            {
              label: "Transaction Bundle",
              dataTestId: `export-transaction-bundle`,
              toImplementFunction: () => {
                exportTestCases("TRANSACTION");
              },
            },
            {
              label: "Collection Bundle",
              dataTestId: `export-collection-bundle`,
              toImplementFunction: () => {
                exportTestCases("COLLECTION");
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
