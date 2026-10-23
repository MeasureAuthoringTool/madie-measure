import React, { useState } from "react";
import {
  MadieDiscardDialog,
  Tabs,
  Tab,
} from "@madie/madie-design-system/dist/react";
import "./CreateTestCaseNavTabs.scss";

import "styled-components/macro";
import EditorSearch from "../editTestCase/qiCore/LeftPanel/EditorSearch";
import EditorCalculator from "../editTestCase/calculator/EditorCalculator";

export interface NavTabProps {
  leftPanelActiveTab: string;
  setLeftPanelActiveTab: (value: string) => void;
  isBuilderEnabled: boolean;
  dirty: boolean;
  setCalculationDialogOpen: any;
  canEdit?: boolean;
  addedCount?: number;
}
export default function CreateTestCaseNavTabs(props: NavTabProps) {
  const {
    leftPanelActiveTab,
    setLeftPanelActiveTab,
    isBuilderEnabled,
    dirty,
    setCalculationDialogOpen,
    canEdit,
    addedCount,
  } = props;
  const [pendingPanel, setPendingPanel] = useState(leftPanelActiveTab);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const onContinue = () => {
    setLeftPanelActiveTab(pendingPanel);
    setDiscardDialogOpen(false);
  };
  return (
    <>
      {isBuilderEnabled && (
        <div className="mm:flex mm:flex-row mm:w-full">
          <div className="mm:basis-11/12">
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
              {canEdit && (
                <Tab
                  tabIndex={0}
                  aria-label="Available elements tab panel"
                  type="D"
                  label="Available"
                  data-testid="available-tab"
                  value="available"
                />
              )}
              <Tab
                tabIndex={0}
                aria-label="Added elements tab panel"
                type="D"
                label={`Added (${addedCount})`}
                data-testid="added-tab"
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
          <div className="mm:ml-auto mm:mr-8 mm:flex">
            <EditorCalculator onClick={() => setCalculationDialogOpen(true)} />
            {leftPanelActiveTab === "json" && <EditorSearch />}
          </div>
          <MadieDiscardDialog
            open={discardDialogOpen}
            onClose={() => setDiscardDialogOpen(false)}
            onContinue={onContinue}
          />
        </div>
      )}
    </>
  );
}
