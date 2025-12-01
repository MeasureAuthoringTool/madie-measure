import React from "react";
import { Chip, Typography } from "@mui/material";
import { Measure } from "@madie/madie-models";
import "./CompareVersionsDialog.scss";

interface MeasureComparisonPanelProps {
  measure: Measure;
  side: "old" | "new";
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const MeasureComparisonPanel = ({
  measure,
  side,
}: MeasureComparisonPanelProps) => {
  const lastUpdatedText = `Last updated on ${formatDate(
    measure.lastModifiedAt
  )}`;

  return (
    <div className="comparison-panel" data-testid={`measure-panel-${side}`}>
      <div className="info-section" data-testid={`version-section-${side}`}>
        <div className="measure-version-row">
          <div className="version-chip-row">
            <Typography className="version-text">
              Version {measure.version}
            </Typography>
            {measure.measureMetaData?.draft && (
              <Chip
                label="Draft"
                className="draft-chip"
                data-testid={`draft-chip-${side}`}
              />
            )}
          </div>
          <Typography
            className="last-updated"
            data-testid={`last-updated-${side}`}
          >
            {lastUpdatedText}
          </Typography>
        </div>
      </div>

      <div
        className="info-section"
        data-testid={`measure-name-section-${side}`}
      >
        <Typography className="measure-name-text">
          Measure Name: {measure.measureName}
        </Typography>
      </div>

      <div className="cql-container" data-testid={`cql-container-${side}`}>
        <Typography>CQL coming soon</Typography>
      </div>
    </div>
  );
};

export default MeasureComparisonPanel;
