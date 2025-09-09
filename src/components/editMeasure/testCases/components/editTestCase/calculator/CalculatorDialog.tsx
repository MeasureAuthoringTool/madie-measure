import React, { useState } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import "styled-components/macro";
import CalculatorNavTabs from "./CalculatorNavTabs";
import DurationTab from "./durationTab/DurationTab";
import { Divider } from "@mui/material";

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
        <CalculatorNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <Divider sx={{ borderColor: "#8c8c8c" }} />
        <div className="panel-content">
          <DurationTab />
        </div>
      </MadieDialog>
    </>
  );
};

export default CalculatorDialog;
