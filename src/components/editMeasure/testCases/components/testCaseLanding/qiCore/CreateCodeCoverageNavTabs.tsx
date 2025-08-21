import React, { useState } from "react";
import {
  Button,
  Tabs,
  Tab,
  Popover,
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

export interface NavTabProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  executeAllTestCases: boolean;
  canEdit: boolean;
  measure: Measure;
  createNewTestCase: (value: string) => void;
  executeTestCases: () => void;
  onImportTestCases?: () => void;
  testCasePassFailStats: TestCasesPassingDetailsProps;
  coveragePercentage: number;
  validTestCases: TestCase[];
  exportTestCases: (bundleType: string) => void;
  validationPercentage?: number;
  onGenerateOverlappingCodesReport: () => void;
  showReportOptions: boolean;
  setShowReportOptions: (show: boolean) => void;
}

const defaultStyle = {
  padding: "0px 10px",
  height: "80px",
  minHeight: "80px",
  textTransform: "none",
  marginRight: "36px",
  "&:focus": {
    outline: "9px auto -webkit-focus-ring-color",
    outlineOffset: "-1px",
  },
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
    onImportTestCases,
    testCasePassFailStats,
    coveragePercentage,
    validTestCases,
    exportTestCases,
    validationPercentage,
    onGenerateOverlappingCodesReport,
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
        <div style={{ fontSize: "29px", fontWeight: "600" }}>
          {validationPercentage ? validationPercentage + "%" : "-"}
        </div>
        <div style={{ fontSize: "19px" }}>{label}</div>
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

  const hasErrors =
    measure?.cqlErrors ||
    measure?.errors?.includes(
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
    ) ||
    _.isNil(measure?.groups) ||
    measure?.groups.length === 0 ||
    _.isEmpty(validTestCases) ||
    contextFailure;

  return (
    <div tw="flex justify-between items-center">
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
          label={executionResultsDisplayTemplate("Coverage")}
          data-testid="coverage-tab"
          value="coverage"
        />
        {_.isEqual(measure?.model, Model.QICORE_6_0_0) &&
          featureFlags?.stu6TestCaseValidation && (
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
      <div tw="flex flex-wrap space-x-4 justify-end h-10">
        {featureFlags.OverlappingValueSets && (
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
        )}

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
              MADiE Import
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
          onClick={executeTestCases}
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
