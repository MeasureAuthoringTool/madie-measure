import React from "react";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";

export interface NavTabProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export default function CompareVersionsNavTabs(props: NavTabProps) {
  const { activeTab, setActiveTab } = props;

  return (
    <Tabs
      type="B"
      id="compare-versions-navs"
      value={activeTab}
      onChange={(e, v) => setActiveTab(v)}
    >
      <Tab
        tabIndex={0}
        aria-label="CQL tab panel"
        type="B"
        label="CQL"
        data-testid="cql-tab"
        value="cql"
      />
      <Tab
        tabIndex={0}
        aria-label="Human Readable tab panel"
        type="B"
        label="Human Readable"
        data-testid="human-readable-tab"
        value="human-readable"
      />
    </Tabs>
  );
}
