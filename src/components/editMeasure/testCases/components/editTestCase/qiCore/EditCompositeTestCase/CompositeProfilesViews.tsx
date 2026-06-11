import React from "react";
import CompositeMeasuresTable from "./CompositeMeasuresTable";
import HowItWorks from "../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks";
import { Button } from "@madie/madie-design-system/dist/react";

const CompositeProfileViews = ({
  howItWorksOpen,
  setAvailableTab,
  setHowItWorksOpen,
  compositeMeasures,
  completedMeasureCount,
  handleSelectTestCase,
}) => {
  return (
    <>
      <div
        className={howItWorksOpen ? "how-it-works-flush-left" : ""}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Button
          variant="outline"
          type="button"
          data-testid="back-to-all-profiles-button"
          onClick={() => setAvailableTab("profiles")}
        >
          Back to All Profiles
        </Button>
        <HowItWorks isOpen={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
      </div>

      <div className="elements-panel-header">
        <h3>Select Which Measures to choose Test Case Profiles from:</h3>
        <div>
          {compositeMeasures?.length > 0 && (
            <p className="sub-heading">
              {completedMeasureCount} of {compositeMeasures?.length} Measures
              (Components) complete
            </p>
          )}
        </div>
      </div>
      <CompositeMeasuresTable
        measures={compositeMeasures}
        onSelectTestCase={handleSelectTestCase}
      />
    </>
  );
};

export default CompositeProfileViews;
