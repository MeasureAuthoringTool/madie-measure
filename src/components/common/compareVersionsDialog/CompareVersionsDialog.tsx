import React, { useState } from "react";
import { Typography } from "@mui/material";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import CompareVersionsNavTabs from "./CompareVersionsNavTabs";
import CqlComparisonPanel from "./panel/CqlComparisonPanel";
import HrComparisonPanel from "./panel/HrComparisonPanel";
import { Allotment } from "allotment";
import "./CompareVersionsDialog.scss";
import CqlDiffViewer from "./CqlDiffViewer";
import HumanReadableDiffViewer from "./HumanReadableDiffViewer";

interface CompareVersionsDialogProps {
  measures: Measure[] | null | undefined;
  open: boolean;
  onClose: () => void;
}

export const getNewestMeasureInstance = (measures: Measure[]): Measure => {
  const [a, b] = measures;

  const isDraftA = a.measureMetaData?.draft;
  const isDraftB = b.measureMetaData?.draft;

  // A draft measure is always the newest
  if (isDraftA && !isDraftB) return a;
  if (isDraftB && !isDraftA) return b;

  // Compare versions numerically (major.minor.patch)
  const vA = a.version.split(".").map(Number);
  const vB = b.version.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (vA[i] > vB[i]) return a;
    if (vB[i] > vA[i]) return b;
  }

  // Versions are equal — fallback to the first measure
  return a;
};

const CompareVersionsDialog = ({
  measures,
  open,
  onClose,
}: CompareVersionsDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("cql");
  const [differences, setDifferences] = useState<number>(0);

  if (!measures || measures.length !== 2) return null;

  const newMeasure = getNewestMeasureInstance(measures);
  const oldMeasure = newMeasure === measures[0] ? measures[1] : measures[0];

  return (
    <MadieDialog
      title="Compare Measure Versions"
      dialogProps={{
        onClose,
        open,
        maxWidth: "xxl",
        "data-testid": "compare-versions-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Close",
        "data-testid": "compare-versions-close-button",
      }}
      titleBoxSx={{ padding: "20px 24px" }}
      contentSx={{ padding: 0 }}
    >
      <div className="compare-versions-dialog">
        <div className="dialog-header">
          <Typography className="measure-header">
            <span className="measure-name" data-testid="measure-name">
              {newMeasure.measureName}
            </span>{" "}
            <span className="measure-cmsid" data-testid="measure-cmsid">
              (CMS ID: {newMeasure.measureSet?.cmsId ?? "-"})
            </span>
          </Typography>
        </div>

        <div className="tabs-container">
          <CompareVersionsNavTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {activeTab === "cql" && (
          <>
            <div
              className="cql-comparison-panels-container"
              data-testid="tab-content-cql"
            >
              <CqlComparisonPanel measure={oldMeasure} side="old" />
              <CqlComparisonPanel measure={newMeasure} side="new" />
            </div>

            <CqlDiffViewer oldMeasure={oldMeasure} newMeasure={newMeasure} />
          </>
        )}

        {activeTab === "human-readable" && (
          <div className="allotment-container">
            <Allotment vertical defaultSizes={[75, 25]}>
              <Allotment.Pane>
                <div
                  className="hr-comparison-panels-container"
                  data-testid="tab-content-human-readable"
                >
                  <HrComparisonPanel measure={oldMeasure} side="old" />
                  <HrComparisonPanel measure={newMeasure} side="new" />
                </div>
              </Allotment.Pane>

              <Allotment.Pane>
                <div
                  className="differences-section"
                  data-testid="differences-section"
                  aria-labelledby={`differences-${differences}`}
                >
                  <Typography
                    variant="h6"
                    className="differences-header"
                    tabIndex={0}
                  >
                    Differences ({differences})
                  </Typography>
                  <HumanReadableDiffViewer
                    oldMeasure={oldMeasure}
                    newMeasure={newMeasure}
                    setDifferences={setDifferences}
                  />
                </div>
              </Allotment.Pane>
            </Allotment>
          </div>
        )}
      </div>
    </MadieDialog>
  );
};

export default CompareVersionsDialog;
