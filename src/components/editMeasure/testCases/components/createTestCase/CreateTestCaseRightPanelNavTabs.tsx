import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "./CreateTestCaseNavTabs.scss";
export interface NavTabProps {
  rightPanelActiveTab: string;
  isCompositeMeasure: boolean;
  setRightPanelActiveTab: (value: string) => void;
}

export default function CreateTestCaseRightPanelNavTabs(props: NavTabProps) {
  const { rightPanelActiveTab, setRightPanelActiveTab, isCompositeMeasure } =
    props;

  return (
    <Tabs
      id="test-case-nav-container"
      value={rightPanelActiveTab}
      onChange={(e, v) => {
        setRightPanelActiveTab(v);
      }}
      type="B"
    >
      {!isCompositeMeasure && (
        <Tab
          tabIndex={0}
          aria-label="Measure CQL View Only tab panel"
          type="B"
          label="CQL"
          data-testid="measurecql-tab"
          value="measurecql"
        />
      )}
      {!isCompositeMeasure && (
        <Tab
          tabIndex={0}
          aria-label="Highlighting tab panel"
          type="B"
          label="Highlighting"
          data-testid="highlighting-tab"
          value="highlighting"
        />
      )}
      <Tab
        tabIndex={0}
        aria-label={`${
          isCompositeMeasure ? "Actual" : "Expected or Actual"
        } tab panel`}
        type="B"
        value="expectoractual"
        label={isCompositeMeasure ? "Actual" : "Expected / Actual"}
        data-testid="expectoractual-tab"
      />
      <Tab
        tabIndex={0}
        aria-label="Details tab panel"
        type="B"
        value="details"
        label="Details"
        data-testid="details-tab"
      />
    </Tabs>
  );
}
