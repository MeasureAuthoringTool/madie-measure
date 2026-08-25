import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "../../../createTestCase/CreateTestCaseNavTabs.scss";
export interface NavTabProps {
  rightPanelActiveTab: string;
  setRightPanelActiveTab: (value: string) => void;
}

export default function CreateCompositeTestCaseRightPanelTabs(
  props: NavTabProps
) {
  const { rightPanelActiveTab, setRightPanelActiveTab } = props;

  return (
    <Tabs
      id="test-case-nav-container"
      value={rightPanelActiveTab}
      onChange={(e, v) => {
        setRightPanelActiveTab(v);
      }}
      type="D"
    >
      <Tab
        tabIndex={0}
        aria-label="Actual tab panel"
        type="D"
        value="actual"
        label="Expected / Actual"
        data-testid="actual-tab"
      />
      <Tab
        tabIndex={0}
        aria-label="Details tab panel"
        type="D"
        value="details"
        label="Details"
        data-testid="details-tab"
      />
    </Tabs>
  );
}
