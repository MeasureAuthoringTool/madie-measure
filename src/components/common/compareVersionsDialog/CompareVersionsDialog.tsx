import React, { useState } from "react";
import { Divider, Typography } from "@mui/material";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import CompareVersionsNavTabs from "./CompareVersionsNavTabs";
import "./CompareVersionsDialog.scss";
import MeasureComparisonPanel from "./MeasureComparisonPanel";

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

  if (!measures || measures.length !== 2) return null;

  const newMeasure = getNewestMeasureInstance(measures);
  const oldMeasure = newMeasure === measures[0] ? measures[1] : measures[0];

  return (
    <MadieDialog
      form
      title="Compare Measure Versions"
      dialogProps={{
        onClose,
        open,
        maxWidth: "xl",
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
        <div className="info-section">
          <Typography className="measure-header">
            <span className="measure-name" data-testid="measure-name">
              {newMeasure.measureName}
            </span>{" "}
            <span className="measure-cmsid" data-testid="measure-cmsid">
              (CMS ID: {newMeasure.measureSet?.cmsId ?? "-"})
            </span>
          </Typography>
        </div>

        <Divider className="divider" />

        <div className="horizontal-padding">
          <CompareVersionsNavTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <Divider className="divider" />

        {activeTab === "cql" && (
          <div
            className="comparison-panels-container"
            data-testid="tab-content-cql"
          >
            <MeasureComparisonPanel measure={oldMeasure} side="old" />
            <MeasureComparisonPanel measure={newMeasure} side="new" />
          </div>
        )}

        {activeTab === "human-readable" && (
          <div
            className="horizontal-padding"
            data-testid="tab-content-human-readable"
          >
            <Typography>Human Readable content goes here</Typography>
          </div>
        )}
      </div>
    </MadieDialog>
  );
};

export default CompareVersionsDialog;
