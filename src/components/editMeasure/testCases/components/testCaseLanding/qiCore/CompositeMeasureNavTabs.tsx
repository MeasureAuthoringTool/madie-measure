import React from "react";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "twin.macro";
import "styled-components/macro";
import { CompositeScores } from "./compositeScores";

export const COMPOSITE_TAB_VALUES = [
  "compositeScore",
  "denominatorScore",
  "numeratorScore",
  "validation",
];

export interface CompositeMeasureNavTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  getValidationResultsDisplay: (label: string) => React.ReactNode;
  compositeScores?: CompositeScores;
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

// Scores default to "-" until execution results are available, mirroring the
// Passing tab's display in CreateCodeCoverageNavTabs.
const scoreDisplayTemplate = (
  label: string,
  value?: number,
  isPercentage = false
) => (
  <div>
    <div style={{ fontSize: "29px", fontWeight: "600" }}>
      {value != null ? (isPercentage ? `${value}%` : value) : "-"}
    </div>
    <div style={{ fontSize: "19px" }}>{label}</div>
  </div>
);

export default function CompositeMeasureNavTabs({
  activeTab,
  setActiveTab,
  getValidationResultsDisplay,
  compositeScores,
}: CompositeMeasureNavTabsProps) {
  return (
    <Tabs
      value={
        COMPOSITE_TAB_VALUES.includes(activeTab) ? activeTab : "compositeScore"
      }
      onChange={(e, v) => {
        // "validation" is a display-only stats tab, mirroring the non-composite view.
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
        aria-label="Composite Score tab panel"
        sx={defaultStyle}
        label={scoreDisplayTemplate(
          "Composite Score",
          compositeScores?.compositeScore,
          true
        )}
        data-testid="composite-score-tab"
        value="compositeScore"
      />
      <Tab
        type="B"
        tabIndex={0}
        aria-label="Denominator Score tab panel"
        sx={defaultStyle}
        label={scoreDisplayTemplate(
          "Denominator Score",
          compositeScores?.denominatorScore
        )}
        data-testid="denominator-score-tab"
        value="denominatorScore"
      />
      <Tab
        type="B"
        tabIndex={0}
        aria-label="Numerator Score tab panel"
        sx={defaultStyle}
        label={scoreDisplayTemplate(
          "Numerator Score",
          compositeScores?.numeratorScore
        )}
        data-testid="numerator-score-tab"
        value="numeratorScore"
      />
      <Tab
        type="B"
        tabIndex={0}
        aria-label="Validation tab panel"
        sx={defaultStyle}
        label={getValidationResultsDisplay("Valid")}
        data-testid="validation-tab"
        value="validation"
      />
    </Tabs>
  );
}
