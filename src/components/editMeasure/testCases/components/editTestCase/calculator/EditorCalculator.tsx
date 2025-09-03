import React from "react";
import Calculate from "./calculator-icon.svg";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

const EditorCalculator = () => {
  const toggleCalculator = () => {
    const event = new CustomEvent("toggleEditorCalculatorBox");
    window.dispatchEvent(event);
  };

  return (
    <Tooltip title="Calculate Age/Birth Date/Period of Time">
      <IconButton
        data-testid="editor-calculator-button"
        aria-label="calculator button"
        style={{
          color: "#0073c8",
        }}
        onClick={toggleCalculator}
      >
        <img alt="calculator" src={Calculate} />
      </IconButton>
    </Tooltip>
  );
};

export default EditorCalculator;
