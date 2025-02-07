import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "./CreateTestCaseNavTabs.scss";
import "twin.macro";
import "styled-components/macro";
import EditorSearch from "../editTestCase/qiCore/LeftPanel/EditorSearch";

export interface NavTabProps {
  leftPanelActiveTab: string;
  setLeftPanelActiveTab: (value: string) => void;
  isQICore6: boolean;
}

export default function CreateTestCaseNavTabs(props: NavTabProps) {
  const { leftPanelActiveTab, setLeftPanelActiveTab } = props;
  const isQICore6 = props.isQICore6;
  return (
    <>
      {isQICore6 && (
        <div tw="flex flex-row w-full">
          <div tw="basis-11/12">
            <Tabs
              id="test-case-nav-container"
              value={leftPanelActiveTab}
              onChange={(e, v) => {
                setLeftPanelActiveTab(v);
              }}
              type="D"
            >
              <Tab
                tabIndex={0}
                aria-label="Elements tab panel"
                type="D"
                label={`Elements`}
                data-testid="elements-tab"
                value="elements"
              />
              <Tab
                tabIndex={0}
                aria-label="JSON tab panel"
                type="D"
                label={`JSON`}
                data-testid="json-tab"
                value="json"
              />
            </Tabs>
          </div>
          <div tw="mr-auto p-2">
            {leftPanelActiveTab === "json" && <EditorSearch />}
          </div>
        </div>
      )}
    </>
  );
}
