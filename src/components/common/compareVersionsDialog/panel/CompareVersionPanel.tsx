import React, { ReactNode, useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { Measure } from "@madie/madie-models";

interface CompareVersionPanelProps {
  measure: Measure;
  children?: ReactNode;
  side: "old" | "new";
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const CompareVersionPanel = ({
  measure,
  children,
  side,
}: CompareVersionPanelProps) => {
  const lastUpdatedText = useMemo(
    () => `Last updated on ${formatDate(measure.lastModifiedAt)}`,
    [measure.lastModifiedAt]
  );

  return (
    <div className="comparison-panel" data-testid={`comparison-panel-${side}`}>
      <div className="panel-header">
        <div className="measure-version-row">
          <div className="version-chip-row">
            <Typography
              className="version-text"
              data-testid={`version-text-${side}`}
            >
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

      <div className="panel-content" data-testid={`panel-content-${side}`}>
        {children}
      </div>
    </div>
  );
};

export default CompareVersionPanel;
