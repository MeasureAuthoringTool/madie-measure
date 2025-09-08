import React, { useState } from "react";
import { MadieDialog, Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "styled-components/macro";
import { Box } from "@mui/system";

interface CalculatorDialogProps {
  open: boolean;
  onClose: Function;
}

const CalculatorDialog = ({ open, onClose }: CalculatorDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("duration-difference");

  return (
    <>
      <MadieDialog
        form
        title="Calculation Tool"
        dialogProps={{
          onClose,
          open,
          maxWidth: "lg",
          "data-testid": "calculation-dialog",
        }}
        continueButtonProps={""}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Close",
          "data-testid": "calculation-close-button",
        }}
      >
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
      </MadieDialog>
    </>
  );
};

export default CalculatorDialog;
