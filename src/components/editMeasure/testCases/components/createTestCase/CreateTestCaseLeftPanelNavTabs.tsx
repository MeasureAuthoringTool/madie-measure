import React, { useState } from "react";
import {
  MadieDiscardDialog,
  Tabs,
  Tab,
} from "@madie/madie-design-system/dist/react";
import "./CreateTestCaseNavTabs.scss";
import "twin.macro";
import "styled-components/macro";
import EditorSearch from "../editTestCase/qiCore/LeftPanel/EditorSearch";
import EditorCalculator from "../editTestCase/calculator/EditorCalculator";

export interface NavTabProps {
  leftPanelActiveTab: string;
  setLeftPanelActiveTab: (value: string) => void;
  isQICore6: boolean;
  dirty: boolean;
  setCalculationDialogOpen: any;
}
export default function CreateTestCaseNavTabs(props: NavTabProps) {
  const {
    leftPanelActiveTab,
    setLeftPanelActiveTab,
    dirty,
    setCalculationDialogOpen,
  } = props;
  const [pendingPanel, setPendingPanel] = useState(leftPanelActiveTab);

  const isQICore6 = props.isQICore6;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const onContinue = () => {
    setLeftPanelActiveTab(pendingPanel);
    setDiscardDialogOpen(false);
  };
  return (
    <>
      {isQICore6 && (
        <div tw="flex flex-row w-full">
          <div tw="basis-11/12">
            <Tabs
              id="test-case-nav-container"
              value={leftPanelActiveTab}
              onChange={(e, v) => {
                if (dirty) {
                  setPendingPanel(v);
                  setDiscardDialogOpen(true);
                } else {
                  setLeftPanelActiveTab(v);
                }
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
          <div tw="ml-auto mr-8 flex">
            <EditorCalculator onClick={() => setCalculationDialogOpen(true)} />
            {leftPanelActiveTab === "json" && <EditorSearch />}
          </div>
          {isQICore6 && (
            <MadieDiscardDialog
              open={discardDialogOpen}
              onClose={() => setDiscardDialogOpen(false)}
              onContinue={onContinue}
            />
          )}
        </div>
      )}
    </>
  );
}
