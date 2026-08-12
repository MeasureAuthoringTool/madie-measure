import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "../../../createTestCase/CreateTestCaseNavTabs.scss";
import "twin.macro";
import "styled-components/macro";
import EditorSearch from "../../../editTestCase/qiCore/LeftPanel/EditorSearch";

export interface NavTabProps {
  leftPanelActiveTab: string;
  setLeftPanelActiveTab: (value: string) => void;
  testCaseCanEdit: boolean;
  addedCount?: number;
}
export default function CreateCompositeTestCaseLeftPanelNavTabs(
  props: NavTabProps
) {
  const {
    leftPanelActiveTab,
    setLeftPanelActiveTab,
    testCaseCanEdit,
    addedCount,
  } = props;
  return (
    <>
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
            {testCaseCanEdit && (
              <Tab
                tabIndex={0}
                aria-label="create tab panel"
                type="D"
                label={`Available`}
                data-testid="create-tab"
                value="available"
              />
            )}
            <Tab
              tabIndex={0}
              aria-label="elements tab panel"
              type="D"
              label={`Added (${addedCount})`}
              data-testid="elements-tab"
              value="added"
            />
            <Tab
              tabIndex={0}
              aria-label="JSON tab panel"
              type="D"
              label="JSON"
              data-testid="json-tab"
              value="json"
            />
          </Tabs>
        </div>
        <div tw="ml-auto mr-8 flex">
          {leftPanelActiveTab === "json" && <EditorSearch />}
        </div>
      </div>
    </>
  );
}
