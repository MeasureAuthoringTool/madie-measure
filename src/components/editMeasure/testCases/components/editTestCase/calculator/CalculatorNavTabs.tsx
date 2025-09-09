import React from "react";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";

export interface NavTabProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export default function CalculatorNavTabs(props: NavTabProps) {
  const { activeTab, setActiveTab } = props;
  return (
    <Tabs
      type="B"
      id="calculation-tool-navs"
      value={activeTab}
      onChange={(e, v) => {
        setActiveTab(v);
      }}
    >
      <Tab
        tabIndex={0}
        aria-label="Duration/Difference tab panel"
        type="B"
        label="Duration/Difference"
        data-testid="duration-difference-tab"
        value="duration-difference"
      />
      <Tab
        tabIndex={0}
        aria-label="Computed Date tab panel"
        type="B"
        label="Computed Date"
        data-testid="computed-date-tab"
        value="computed-date"
      />
    </Tabs>
  );
}
