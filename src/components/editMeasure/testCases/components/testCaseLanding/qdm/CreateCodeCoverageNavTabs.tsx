import React, { useState, useEffect } from "react";
import {
  Button,
  Tabs,
  Tab,
  Popover,
} from "@madie/madie-design-system/dist/react";
import AddIcon from "@mui/icons-material/Add";

import * as _ from "lodash";
import {
  Measure,
  MeasureErrorType,
  TestCase,
  Group,
} from "@madie/madie-models";
import { TestCasesPassingDetailsProps } from "../common/interfaces";
import { useQdmExecutionContext } from "../../routes/qdm/QdmExecutionContext";
import LoadingButtonWithMenu from "../common/loadingButton/LoadingButtonWithMenu";
import LoadingButton from "../common/loadingButton/LoadingButton";
import { Tooltip } from "@mui/material";

import classNames from "classnames";
import "./CreateCodeCoverageNavTabs.scss";

export interface NavTabProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  executeAllTestCases: boolean;
  canEdit: boolean;
  measure: Measure;
  createNewTestCase: (value: string) => void;
  executeTestCases: () => void;
  testCasePassFailStats: TestCasesPassingDetailsProps;
  coveragePercentage: string;
  validTestCases: TestCase[];
  selectedPopCriteria: Group;
  onExportQRDA: () => void;
  onExportExcel: (fileType: string) => void;
  exportExecuting: boolean;
  optionsOpen: boolean;
  setOptionsOpen: (exportExecuting: boolean) => void;
  onGenerateOverlappingCodesReport: () => void;
  showReportOptions: boolean;
  setShowReportOptions: (show: boolean) => void;
  clauseResults?: { total: number; covered: number } | null;
}

const defaultStyle = {
  padding: "0px 10px",
  height: "90px",
  minHeight: "90px",
  textTransform: "none",
  marginRight: "36px",
  "&:focus": {
    outline: "9px auto -webkit-focus-ring-color",
    outlineOffset: "-1px",
  },
};

export default function CreateCodeCoverageNavTabs(props: NavTabProps) {
  const { executionContextReady, contextFailure } = useQdmExecutionContext();
  const {
    activeTab,
    setActiveTab,
    executeAllTestCases,
    canEdit,
    createNewTestCase,
    measure,
    executeTestCases,
    testCasePassFailStats,
    coveragePercentage,
    validTestCases,
    onExportQRDA,
    onExportExcel,
    optionsOpen,
    setOptionsOpen,
    onGenerateOverlappingCodesReport,
    clauseResults,
  } = props;
  const [activeTip, setActiveTip] = useState<boolean>(false);
  const toolTipClass = classNames("madie-tooltip", {
    // hide the tooltip if all testcases have been run
    hidden: !activeTip || executeAllTestCases,
  });
  const [anchorEl, setAnchorEl] = useState(null);

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

  const hasErrors =
    measure?.cqlErrors ||
    measure?.errors?.includes(
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES
    ) ||
    measure?.errors?.includes(MeasureErrorType.MISMATCH_CQL_RISK_ADJUSTMENT) ||
    measure?.errors?.includes(
      MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA
    ) ||
    _.isNil(measure?.groups) ||
    measure?.groups.length === 0 ||
    (measure?.testCaseConfiguration?.executeInvalidTestCases
      ? false
      : _.isEmpty(validTestCases)) ||
    contextFailure;

  const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOptionsOpen(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setOptionsOpen(false);
    setAnchorEl(null);
  };

  // we only want these attributes surrounding the button if it's disabled.
  const focusTrapAttributes = !executeAllTestCases
    ? {
        role: "button",
        tabIndex: 0,
        onFocus: () => setActiveTip(true),
        onBlur: () => {
          setActiveTip(false);
        },
        onMouseEnter: () => {
          setActiveTip(true);
        },
        onMouseLeave: () => {
          setActiveTip(false);
        },
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            setActiveTip(false);
          }
        },
      }
    : {};
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          alignItems: "center",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => {
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
        </Tabs>
        <div style={{ margin: "6px 0 0 auto", display: "flex", gap: "10px" }}>
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
                label: "QRDA",
                toImplementFunction: onExportQRDA,
                dataTestId: `export-qrda-${measure?.id}`,
              },
              {
                label: "Excel",
                toImplementFunction: onExportExcel,
                dataTestId: `export-excel-${measure?.id}`,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
