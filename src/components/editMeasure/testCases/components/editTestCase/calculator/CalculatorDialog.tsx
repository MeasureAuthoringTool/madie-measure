import React, { useState } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import "styled-components/macro";
import CalculatorNavTabs from "./CalculatorNavTabs";
import DurationTab from "./durationTab/DurationTab";
import { Divider } from "@mui/material";
import ComputedDate from "./computedDateTab/ComputedDate";

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
          variant: "cyan",
          cancelText: "Close",
          "data-testid": "calculation-close-button",
        }}
      >
        <CalculatorNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <Divider sx={{ borderColor: "#8c8c8c" }} />
        {activeTab === "duration-difference" && (
          <div className="panel-content">
            <DurationTab />
          </div>
        )}
        {activeTab === "computed-date" && (
          <div className="panel-content">
            <ComputedDate />
          </div>
        )}
      </MadieDialog>
    </>
  );
};

export default CalculatorDialog;
