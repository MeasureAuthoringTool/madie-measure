import React, { useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import CompareVersionsNavTabs from "./CompareVersionsNavTabs";
import "./CompareVersionsDialog.scss";

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

  const newestMeasure = getNewestMeasureInstance(measures);

  return (
    <MadieDialog
      form
      title="Compare Measure Versions"
      dialogProps={{
        onClose,
        open,
        maxWidth: "lg",
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
      <Box className="measure-info-container">
        <Typography variant="h6">
          <span className="measure-name" data-testid="measure-name">
            {newestMeasure.measureName}
          </span>{" "}
          <span className="measure-cmsid" data-testid="measure-cmsid">
            (CMS ID: {newestMeasure.measureSet?.cmsId ?? "-"})
          </span>
        </Typography>
      </Box>

      <Divider className="divider" />

      <div className="horizontal-padding">
        <CompareVersionsNavTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <Divider className="divider" />

      {activeTab === "cql" && (
        <div className="horizontal-padding" data-testid="tab-content-cql">
          <Typography>CQL content goes here</Typography>
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
    </MadieDialog>
  );
};

export default CompareVersionsDialog;
